import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { sfx } from '../game/sound'
import { Emoji } from '../ui/Emoji'
import { WORLDS } from '../content/tiers'
import { QUIZ, quizForTier, type QuizQuestion } from '../content/quiz'
import { useT } from '../game/i18n'

/**
 * Quiz mode — a touch-first, multiple-choice trainer. It's the mobile way to
 * play: no editor/keyboard needed, just tap the right answer. Questions are pure
 * data (src/content/quiz.ts), grouped by world; a round shuffles both the
 * questions and each question's choices for replay variety. Rewards go through
 * the store's recordQuiz (coins + best + streak), like the arcade.
 */

const MIXED_SIZE = 10

type Phase = 'pick' | 'playing' | 'over'

interface RoundItem {
  q: QuizQuestion
  choices: string[]
  answer: number // index into the shuffled `choices`
}

/** Fisher–Yates — Math.random is fine here (UI only, never in tests). */
function shuffle<T>(input: T[]): T[] {
  const a = input.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

type ChoiceState = 'idle' | 'correct' | 'wrong' | 'dim'

/** Opaque smoked-glass fill — dark-anchored so text stays legible over the
 * animated 3D scene. Shared by the quiz answer buttons and the picker cards so
 * both read as solid panels rather than see-through tints. */
const PLAIN_BG = 'rgba(18, 22, 32, 0.9)' // matches the .panel smoked glass, a touch more opaque

/** Per-choice background: the plain fill, with a light accent wash once answered. */
function choiceBg(state: ChoiceState): string {
  if (state === 'correct') return `color-mix(in srgb, var(--color-term) 22%, ${PLAIN_BG})`
  if (state === 'wrong') return `color-mix(in srgb, var(--color-danger) 22%, ${PLAIN_BG})`
  return PLAIN_BG // idle & dim
}

function buildRound(questions: QuizQuestion[], size: number): RoundItem[] {
  return shuffle(questions)
    .slice(0, size)
    .map((q) => {
      const order = shuffle(q.choices.map((_, i) => i))
      return {
        q,
        choices: order.map((i) => q.choices[i]),
        answer: order.indexOf(q.answer),
      }
    })
}

export function QuizMode() {
  const recordQuiz = useGame((s) => s.recordQuiz)
  const best = useGame((s) => s.quizBest)
  const t = useT()

  const [phase, setPhase] = useState<Phase>('pick')
  const [round, setRound] = useState<RoundItem[]>([])
  const [idx, setIdx] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [correct, setCorrect] = useState(0)
  const [reward, setReward] = useState({ coins: 0, isNewBest: false })

  const start = (questions: QuizQuestion[], size: number) => {
    const r = buildRound(questions, size)
    if (!r.length) return
    setRound(r)
    setIdx(0)
    setPicked(null)
    setCorrect(0)
    setPhase('playing')
    sfx.ui()
  }

  const item = round[idx]
  const answered = picked !== null

  const choose = useCallback(
    (choice: number) => {
      if (picked !== null || !item) return
      setPicked(choice)
      if (choice === item.answer) {
        setCorrect((c) => c + 1)
        sfx.success()
      } else {
        sfx.error()
      }
    },
    [picked, item],
  )

  const advance = useCallback(() => {
    if (picked === null) return
    if (idx + 1 >= round.length) {
      const c = correct
      const res = recordQuiz(c, round.length)
      setReward({ coins: res.coinsGained, isNewBest: res.isNewBest })
      setPhase('over')
      sfx.levelUp()
    } else {
      setIdx((i) => i + 1)
      setPicked(null)
    }
  }, [picked, idx, round.length, correct, recordQuiz])

  // Desktop niceties: 1–4 pick an answer, Enter/Space advances.
  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (!answered && /^[1-9]$/.test(e.key)) {
        const n = Number(e.key) - 1
        if (item && n < item.choices.length) {
          e.preventDefault()
          choose(n)
        }
      } else if (answered && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault()
        advance()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, answered, item, choose, advance])

  if (phase === 'pick') return <QuizPicker best={best} onStart={start} />

  if (phase === 'over') {
    const total = round.length
    const pct = total ? Math.round((correct / total) * 100) : 0
    const stars = pct >= 100 ? 3 : pct >= 70 ? 2 : pct >= 40 ? 1 : 0
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="panel p-6">
          <div className="text-[11px] uppercase tracking-[0.25em] text-ink-dim">{t('quiz.complete')}</div>
          <div className="mt-3 font-terminal text-6xl tabular-nums text-term glow-term">
            {correct}<span className="text-2xl text-ink-dim">/{total}</span>
          </div>
          <div className="mt-2 text-lg" aria-label={`${stars} of 3 stars`}>
            {'★★★'.slice(0, stars)}
            <span className="text-ink-dim">{'★★★'.slice(stars)}</span>
          </div>
          <p className="mt-2 text-sm text-ink-dim">
            {t('quiz.pctCorrect', { pct })}
            {reward.isNewBest && <span className="ml-2 text-amber">★ {t('quiz.newBest')}</span>}
          </p>
          {reward.coins > 0 && (
            <p className="mt-1 flex items-center justify-center gap-1.5 text-amber">
              +{reward.coins} <span className="coin" />
            </p>
          )}
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => start(round.map((r) => r.q), round.length)}
              className="btn-primary flex-1 rounded-xl px-5 py-3 font-bold"
            >
              ↻ {t('quiz.retry')}
            </button>
            <button
              onClick={() => {
                sfx.ui()
                setPhase('pick')
              }}
              className="flex-1 rounded-xl border border-border px-5 py-3 text-ink-dim transition-colors hover:border-term hover:text-term"
            >
              {t('quiz.chooseTopic')}
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // phase === 'playing'
  if (!item) return null
  const progress = ((idx + (answered ? 1 : 0)) / round.length) * 100

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* progress + score */}
      <div className="flex items-center justify-between text-xs text-ink-dim">
        <span className="tabular-nums">{t('quiz.question', { n: idx + 1, total: round.length })}</span>
        <span className="inline-flex items-center gap-1.5 tabular-nums text-term">
          <Emoji name="star" size={14} /> {correct}
        </span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-2">
        <div className="h-full rounded-full bg-term transition-[width] duration-300" style={{ width: `${progress}%` }} />
      </div>

      {/* prompt */}
      <div className="panel mt-4 p-5">
        <p className="text-lg font-medium text-ink">{t(`quiz.${item.q.id}.prompt`, undefined, item.q.prompt)}</p>
      </div>

      {/* choices — large, tappable */}
      <div className="mt-3 flex flex-col gap-2.5">
        {item.choices.map((choice, i) => {
          const isAnswer = i === item.answer
          const isPicked = picked === i
          const state = !answered
            ? 'idle'
            : isAnswer
              ? 'correct'
              : isPicked
                ? 'wrong'
                : 'dim'
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              // Smoked-glass base so the choice text stays readable over the animated
              // 3D scene — accent-tinted for correct/wrong, plain dark for idle/dim.
              style={{ background: choiceBg(state) }}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-base backdrop-blur-md transition-colors ${
                state === 'correct'
                  ? 'border-term text-ink'
                  : state === 'wrong'
                    ? 'border-danger text-ink'
                    : state === 'dim'
                      ? 'border-border text-ink-dim opacity-60'
                      : 'border-border text-ink hover:border-term active:scale-[0.99]'
              }`}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-md border text-sm font-bold ${
                  state === 'correct'
                    ? 'border-term text-term'
                    : state === 'wrong'
                      ? 'border-danger text-danger'
                      : 'border-border text-ink-dim'
                }`}
              >
                {answered && isAnswer ? '✓' : answered && isPicked ? '✗' : i + 1}
              </span>
              <span className="font-mono">{choice}</span>
            </button>
          )
        })}
      </div>

      {/* feedback + next */}
      {answered && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          {item.q.explain && (
            <div className="flex items-start gap-2.5 rounded-xl border border-border bg-panel-2/50 px-4 py-3 text-sm text-ink-dim">
              <span className="mt-0.5 shrink-0">
                <Emoji name="bulb" size={15} />
              </span>
              <span>{t(`quiz.${item.q.id}.explain`, undefined, item.q.explain)}</span>
            </div>
          )}
          <button onClick={advance} className="btn-primary mt-3 w-full rounded-xl px-5 py-3.5 font-bold">
            {idx + 1 >= round.length ? t('quiz.seeResults') : t('quiz.nextQuestion')} →
          </button>
        </motion.div>
      )}
    </div>
  )
}

function QuizPicker({
  best,
  onStart,
}: {
  best: number
  onStart: (questions: QuizQuestion[], size: number) => void
}) {
  const worlds = useMemo(() => WORLDS.map((w) => ({ ...w, count: quizForTier(w.tier).length })), [])
  const t = useT()

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="screen-title font-terminal text-4xl">{t('quiz.title')}</h2>
          <p className="mt-1 text-ink-dim">{t('quiz.subtitle')}</p>
        </div>
        <div className="text-right text-sm">
          <div className="text-ink-dim">{t('quiz.best')}</div>
          <div className="font-terminal text-2xl tabular-nums text-term">{best}</div>
        </div>
      </div>

      {/* Mixed round — the quick, everything-goes option */}
      <button
        onClick={() => onStart(QUIZ, MIXED_SIZE)}
        style={{ background: PLAIN_BG }}
        className="mt-6 flex w-full items-center gap-3 rounded-xl border border-term/50 px-5 py-4 text-left backdrop-blur-md transition-colors hover:border-term"
      >
        <Emoji name="rocket" size={22} />
        <span className="flex-1">
          <span className="block font-bold text-ink">{t('quiz.mixedRound')}</span>
          <span className="text-sm text-ink-dim">{t('quiz.mixedDesc', { n: MIXED_SIZE })}</span>
        </span>
        <span aria-hidden className="text-term">▶</span>
      </button>

      <div className="mt-6 text-[11px] uppercase tracking-widest text-ink-dim">{t('quiz.orDrill')}</div>
      <div className="mt-2 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {worlds.map((w) => (
          <button
            key={w.tier}
            onClick={() => onStart(quizForTier(w.tier), quizForTier(w.tier).length)}
            className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-left backdrop-blur-md transition-colors hover:border-term"
            style={{ background: PLAIN_BG, borderLeft: `3px solid ${w.accent}` }}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full font-terminal text-sm font-bold" style={{ background: `color-mix(in srgb, ${w.accent} 20%, transparent)`, color: w.accent }}>
              {w.tier}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-ink">
                {t(`content.world.${w.tier}.name`, undefined, w.name)}
              </span>
              <span className="text-xs text-ink-dim">
                {t(`content.world.${w.tier}.subtitle`, undefined, w.subtitle)}
              </span>
            </span>
            <span className="text-xs tabular-nums text-ink-dim">{w.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
