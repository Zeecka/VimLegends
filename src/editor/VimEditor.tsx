import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { EditorSelection, EditorState, type Extension } from '@codemirror/state'
import { EditorView, type ViewUpdate } from '@codemirror/view'
import { getCM } from '@replit/codemirror-vim'
import { makeExtensions } from './vimSetup'
import { loadLang } from './langs'
import { stagesOf, type Challenge, type Goal, type VimCtx } from '../game/types'
import { makeVimCtx } from '../game/verify'
import { sfx } from '../game/sound'

interface Props {
  challenge: Challenge
  onComplete: (keystrokes: number) => void
  onKeystroke?: (count: number) => void
  onModeChange?: (mode: string) => void
  /** Boss: a stage was cleared; `stage` is the 0-based index now active. */
  onStageAdvance?: (stage: number) => void
  /** Boss: the keystroke budget was exhausted without winning. */
  onFail?: (keystrokes: number) => void
  /** When true, keystrokes are ignored for scoring (e.g. after completion). */
  frozen?: boolean
}

/** Imperative handle so parents can restore keyboard focus to the editor. */
export interface VimEditorHandle {
  focus: () => void
}

// Includes AltGraph: on AZERTY (and many non-US layouts) chars like # or @ are
// typed with AltGr, whose standalone keydown must not count as an extra keystroke
// — otherwise par (and 3 stars) is unreachable on those layouts.
const MODIFIER_KEYS = new Set(['Shift', 'Control', 'Alt', 'AltGraph', 'Meta', 'CapsLock', 'Dead'])

function goalMet(view: EditorView, goal: Goal, vim: VimCtx): boolean {
  if (goal.targetText !== undefined) {
    // An exact-text goal is not "done" while you are still in insert mode: the
    // closing Esc is required, matching the briefs ("…then Esc") and the pars
    // (which budget that keystroke). Otherwise a level wins mid-type, before the
    // Esc the instructions ask for.
    return vim.mode() !== 'insert' && view.state.doc.toString() === goal.targetText
  }
  if (goal.predicate) return goal.predicate(view, vim)
  return false
}

/**
 * An embedded CodeMirror 6 editor running real Vim keybindings (@replit/codemirror-vim),
 * instrumented to (a) count keystrokes, (b) detect goal completion — incl. multi-stage
 * boss goals and vim-state goals, (c) report the vim mode.
 * Remount (via a `key` on the parent) to reset for a new challenge.
 */
const VimEditor = forwardRef<VimEditorHandle, Props>(function VimEditor(
  { challenge, onComplete, onKeystroke, onModeChange, onStageAdvance, onFail, frozen },
  ref,
) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const keystrokes = useRef(0)
  const done = useRef(false)
  const frozenRef = useRef(frozen)
  frozenRef.current = frozen

  useImperativeHandle(ref, () => ({ focus: () => viewRef.current?.focus() }), [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return

    let cancelled = false
    let cleanup: (() => void) | undefined

    const create = (extraExtensions: Extension[]) => {
      // Multi-stage (boss) support: stage goals are checked as a RATCHET — once
      // a stage is passed it stays passed, so undo can never rewind the fight.
      const stages = stagesOf(challenge)
      const stageIdx = { current: 0 }
      const budget = challenge.keystrokeBudget

      const fail = () => {
        done.current = true
        sfx.error()
        onFail?.(keystrokes.current)
      }

      const runGoalCheck = (view: EditorView) => {
        if (done.current) return
        // Never judge the pristine buffer: the initial cursor placement fires a
        // selectionSet update, and a goal that matches the start state (e.g. a
        // delete-then-undo round trip) would otherwise win with zero input.
        if (keystrokes.current === 0) return
        const vimCtx = makeVimCtx(view)
        let advanced = false
        while (stageIdx.current < stages.length && goalMet(view, stages[stageIdx.current].goal, vimCtx)) {
          stageIdx.current += 1
          advanced = true
        }
        if (stageIdx.current >= stages.length) {
          done.current = true
          sfx.success()
          onComplete(keystrokes.current)
          return
        }
        if (advanced) {
          sfx.combo(stageIdx.current + 1)
          onStageAdvance?.(stageIdx.current)
        }
        // Budget is checked AFTER goals on the same update, so a winning
        // keystroke at exactly the limit counts as a win, not a loss.
        if (budget !== undefined && keystrokes.current > budget) fail()
      }

      const onUpdate = (u: ViewUpdate) => {
        if (done.current) return
        if (!u.docChanged && !u.selectionSet) return
        runGoalCheck(u.view)
      }

      // Re-check goals after every completed vim command (microtask-deduped):
      // register/mark/macro/mode goals can become true with NO doc or selection
      // change (e.g. `ma`, `"ayy`, `q`) — the updateListener alone misses those.
      let recheckQueued = false
      const scheduleRecheck = () => {
        if (recheckQueued) return
        recheckQueued = true
        queueMicrotask(() => {
          recheckQueued = false
          const v = viewRef.current
          if (v && !done.current) runGoalCheck(v)
        })
      }

      const view = new EditorView({
        state: EditorState.create({
          doc: challenge.startText,
          extensions: makeExtensions(onUpdate, extraExtensions),
        }),
        parent: host,
      })
      viewRef.current = view

      // Place the starting cursor if requested.
      if (challenge.startCursor) {
        try {
          const { line, ch } = challenge.startCursor
          const lineInfo = view.state.doc.line(Math.min(line, view.state.doc.lines))
          const pos = Math.min(lineInfo.from + ch, lineInfo.to)
          view.dispatch({ selection: EditorSelection.cursor(pos) })
        } catch {
          /* out-of-range cursor: ignore, leave at default */
        }
      }

      // Count keystrokes (VimGolf-style: every non-modifier key press counts as 1).
      // Capture phase is essential: the CodeMirror/vim keymap handles and stops
      // propagation of keys it consumes, so a bubble-phase listener would miss them.
      const onKeyDown = (e: KeyboardEvent) => {
        if (done.current || frozenRef.current) return
        if (MODIFIER_KEYS.has(e.key)) return
        keystrokes.current += 1
        onKeystroke?.(keystrokes.current)
        sfx.key()
        // Budget fallback for keys that produce no doc/selection update (e.g. a
        // pending `q`). CM dispatches synchronously inside this event, so by the
        // time the microtask runs, a winning final keystroke has already won.
        if (budget !== undefined && keystrokes.current > budget) {
          queueMicrotask(() => {
            if (!done.current && keystrokes.current > budget) fail()
          })
        }
      }
      view.dom.addEventListener('keydown', onKeyDown, true)

      // Report vim mode changes for the HUD, and re-run goal checks on mode
      // changes + completed vim commands (best-effort — API may be absent).
      let detachVim: (() => void) | undefined
      try {
        const cm = getCM(view) as unknown as {
          on?: (ev: string, fn: (arg?: unknown) => void) => void
          off?: (ev: string, fn: (arg?: unknown) => void) => void
        } | null
        if (cm?.on) {
          const modeHandler = (arg?: unknown) => {
            const { mode } = (arg ?? {}) as { mode?: string }
            onModeChange?.(mode ?? 'normal')
            scheduleRecheck()
          }
          const doneHandler = () => scheduleRecheck()
          cm.on('vim-mode-change', modeHandler)
          cm.on('vim-command-done', doneHandler)
          detachVim = () => {
            cm.off?.('vim-mode-change', modeHandler)
            cm.off?.('vim-command-done', doneHandler)
          }
        }
      } catch {
        /* vim event reporting unavailable */
      }
      onModeChange?.('normal')

      view.focus()

      cleanup = () => {
        view.dom.removeEventListener('keydown', onKeyDown, true)
        detachVim?.()
        view.destroy()
        viewRef.current = null
      }
    }

    // Language extensions (syntax tree for it/at) are heavy and lazy-loaded;
    // plain challenges mount synchronously as before.
    if (challenge.lang) {
      loadLang(challenge.lang).then((ext) => {
        if (!cancelled) create([ext])
      })
    } else {
      create([])
    }

    return () => {
      cancelled = true
      cleanup?.()
    }
    // Remount on challenge change via key; deps intentionally exclude callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challenge])

  return <div ref={hostRef} className="h-full w-full" />
})

export default VimEditor
