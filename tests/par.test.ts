import { describe, expect, it } from 'vitest'
import { CHALLENGES } from '../src/content/tiers'
import { playChallenge, createEditor, press, tokenize } from './driver'
import { makeVimCtx } from '../src/game/verify'
import type { Challenge } from '../src/game/types'

/**
 * Par validator: every entry is a REFERENCE SOLUTION proving its challenge is
 * solvable at ≤ par with the real vim keymap. Add a line here whenever a new
 * challenge is authored (the content phase will grow this to full coverage).
 */
const SOLUTIONS: Record<string, string> = {
  't1-first-blood': 'x',
  't1-navigate': 'jllll',
  't1-insert': 'i <Esc>',
  't1-append': 'a!<Esc>',
  't1-undo': 'ddu',
  'boss-gatekeeper': 'dddd$ie<Esc>jxoonward!<Esc>',
  // Tier 3 — Faster
  't3-cut-word': 'dw',
  't3-shear': 'f;lD',
  't3-ciw': 'ciwcount<Esc>',
  't3-ci-paren': 'f(ci(250<Esc>',
  't3-ci-quote': 'ci"hello<Esc>',
  't3-daw': 'daw',
  't3-counts': 'd3w',
  't3-dupe-line': 'yyp',
  't3-transplant': 'yiwj$viwp',
  't3-visual-snip': 'vf]lx',
  't3-visual-line': 'Vjjd',
  't3-visual-block': '<C-v>jjjlx',
  't3-tag-change': 'citWelcome<Esc>',
  'boss-gauntlet': 'ciwcount<Esc>jwwwwdawjdd',
  // Tier 4 — Seeker (dialog keystrokes count: the panel lives in the editor)
  't4-searchlight': '/ERROR<CR>dd',
  't4-third-strike': '/WARN<CR>nnciwINFO<Esc>',
  't4-question': '?sec<CR>dd',
  't4-star-player': '*ciwrows<Esc>',
  't4-slice-args': 'df,x',
  't4-repeat-find': 'f.;;dt"',
  't4-percent': '%lx',
  't4-sub-line': ':s/Flase/False<CR>',
  't4-sub-global': ':%s/colour/color/g<CR>',
  't4-sub-confirm': ':%s/count/total/gc<CR>ynyny',
  't4-marks': 'maggdd`a',
  'boss-grepgut': '/eror<CR>ddndd:%s/warn/WARN/g<CR>jf(d%x',
  'boss-proofreader': 'cwthe<Esc>jddcwsave<Esc>',
  // Extra fundamentals (open-above, change-to-end, brackets, transpose, indent)
  't2-open-above': 'Oimport sys<Esc>',
  't2-append-eol': 'A;<Esc>',
  't2-insert-bol': 'I# <Esc>',
  't3-change-tail': 'Cinfo<Esc>',
  't3-bracket': 'ci[mono<Esc>',
  't3-transpose': 'xp',
  't3-indent': '>j',
  't6-indent-para': '>ip',
  // Tier 5 — Superpowers (dot, gn, Ctrl-a, registers, macros)
  't5-dot': 'A;<Esc>j.j.',
  't5-dot-op': 'fDdaw;.;.',
  't5-gn': '*cgnfinal<Esc>..',
  't5-incr': '3<C-a>',
  't5-reg-named': '"ayyjdddd"ap',
  't5-reg-zero': 'yyjdd"0p',
  't5-blackhole': 'yyj"_ddp',
  't5-reg-append': '"ayyjj"AyyG"ap',
  't5-macro': 'qa<C-a>jq@a@a',
  't5-macro-scale': 'qaI[ ] <Esc>jq@a@@@@@@',
  't5-macro-text': 'qa0<C-a>$ciwshipped<Esc>jq@a@a',
  'boss-automaton': 'qa<C-a>jq@a@ayyj"_ddpggA;<Esc>j.j.',
  // Tier 6 — Legend (:g/:v/:sort/:normal, case ops, joins, block, gq)
  't6-join': '3J',
  't6-gjoin': '3gJ',
  't6-upper': 'gUiw',
  't6-toggle': 'g~$',
  't6-sort': ':sort<CR>',
  't6-sort-u': ':sort u<CR>',
  't6-global-del': ':g/DEBUG/d<CR>',
  't6-vglobal': ':v/FAIL/d<CR>',
  't6-global-normal': ':g/task/normal wgUiw<CR>',
  't6-block-insert': '<C-v>jjI# <Esc>',
  't6-block-append': '<C-v>jj$A,<Esc>',
  't6-para': 'dap',
  't6-gq': ':set tw=20<CR>gqip',
  't6-replace': '6r*',
  'boss-archivist': ':g/DEBUG/d<CR>:sort<CR>gg<C-v>jjjI# <Esc>',
}

function byId(id: string): Challenge {
  const ch = CHALLENGES.find((c) => c.id === id)
  if (!ch) throw new Error(`unknown challenge ${id}`)
  return ch
}

describe('par validator (reference solutions)', () => {
  for (const [id, solution] of Object.entries(SOLUTIONS)) {
    it(`${id}: solvable at ≤ par with "${solution}"`, () => {
      const ch = byId(id)
      const res = playChallenge(ch, solution)
      expect(res.solvedAtKey, `not solved — final buffer:\n${res.finalText}`).not.toBeNull()
      expect(res.solvedAtKey!).toBeLessThanOrEqual(ch.par)
    })
  }

  it('boss stage ratchet: goals complete in order', () => {
    const ch = byId('boss-gatekeeper')
    // Stage 1 only:
    const partial = playChallenge(ch, 'dddd')
    expect(partial.solvedAtKey).toBeNull()
    expect(partial.finalText).toBe(ch.goal.targetText)
  })
})

describe('vim-state checkers (verify.ts)', () => {
  const scratch: Challenge = {
    id: 'scratch',
    tier: 1,
    title: 't',
    brief: 'b',
    taughtCommands: [],
    startText: 'alpha\nbravo',
    goal: { targetText: 'never', describe: 'n/a' },
    par: 1,
    hint: '',
  }

  it('registerEquals reads a named linewise yank', () => {
    const view = createEditor(scratch)
    try {
      for (const t of tokenize('"ayy')) press(view, t)
      const vim = makeVimCtx(view)
      expect(vim.register('a')?.text.replace(/\n$/, '')).toBe('alpha')
      expect(vim.register('a')?.linewise).toBe(true)
      expect(vim.register('z')).toBeNull()
    } finally {
      view.destroy()
    }
  })

  it('markSet sees m{r} marks with 1-based lines', () => {
    const view = createEditor(scratch)
    try {
      for (const t of tokenize('jma')) press(view, t)
      const vim = makeVimCtx(view)
      expect(vim.mark('a')?.line).toBe(2)
      expect(vim.mark('b')).toBeNull()
    } finally {
      view.destroy()
    }
  })

  it('mode() tracks visual/visualBlock/insert', () => {
    const view = createEditor(scratch)
    try {
      const vim = makeVimCtx(view)
      expect(vim.mode()).toBe('normal')
      press(view, 'v')
      expect(vim.mode()).toBe('visual')
      press(view, '<Esc>')
      press(view, '<C-v>')
      expect(vim.mode()).toBe('visualBlock')
      press(view, '<Esc>')
      press(view, 'i')
      expect(vim.mode()).toBe('insert')
    } finally {
      view.destroy()
    }
  })

  it('isRecording flips during q{r} macro recording', () => {
    const view = createEditor(scratch)
    try {
      const vim = makeVimCtx(view)
      expect(vim.isRecording()).toBe(false)
      press(view, 'q')
      press(view, 'a')
      expect(vim.isRecording()).toBe(true)
      press(view, 'x')
      press(view, 'q')
      expect(vim.isRecording()).toBe(false)
      expect(vim.register('a')?.text).toBe('x')
    } finally {
      view.destroy()
    }
  })

  it('visual block edits produce multi-range selections (allowMultipleSelections fix)', () => {
    const block: Challenge = { ...scratch, startText: '> one\n> two\n> three' }
    const view = createEditor(block)
    try {
      // Ctrl-v, select the "> " column on all three lines, delete it.
      for (const t of tokenize('<C-v>jjlx')) press(view, t)
      expect(view.state.doc.toString()).toBe('one\ntwo\nthree')
    } finally {
      view.destroy()
    }
  })
})
