import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StarRow, KeyCap, KeyedText } from './atoms'
import { Emoji } from './Emoji'
import { Confetti } from './Confetti'
import { sfx } from '../game/sound'
import { COMMANDS, COMMANDS_BY_ID } from '../game/commands'
import { useGame, MASTERY_THRESHOLD, type CompleteOutcome } from '../game/store'
import { useT } from '../game/i18n'
import { levelFromXp } from '../game/xp'
import { shareScore } from '../game/share'
import { CHALLENGES } from '../content/tiers'

interface Props {
  outcome: CompleteOutcome
  keystrokes: number
  par: number
  /** Boss levels get a bigger, louder headline. */
  boss?: boolean
  hasNext: boolean
  /** Label for the advance button — "Next →" for a level, "Next world →" after a boss. */
  nextLabel?: string
  onNext: () => void
  onReplay: () => void
  onMap: () => void
}

export function ResultScreen({ outcome, keystrokes, par, boss, hasNext, nextLabel = 'Next →', onNext, onReplay, onMap }: Props) {
  const xp = useGame((s) => s.xp)
  const completed = useGame((s) => s.completed)
  const mastery = useGame((s) => s.mastery)
  const coins = useGame((s) => s.coins)
  const t = useT()
  const [shareMsg, setShareMsg] = useState<string | null>(null)
  // A win is worth celebrating when it's a boss, a flawless 3-star, or a level-up.
  const celebrate = boss || outcome.stars === 3 || outcome.leveledUp
  const [confetti, setConfetti] = useState(celebrate)

  useEffect(() => {
    for (let i = 0; i < outcome.stars; i++) sfx.star(i)
    if (outcome.coinsGained > 0) window.setTimeout(() => sfx.coin(), outcome.stars * 140 + 140)
    // Boss defeat gets its own fanfare (bigger than a level-up); otherwise a level-up plays.
    if (boss) window.setTimeout(() => sfx.boss(), 320)
    else if (outcome.leveledUp) window.setTimeout(() => sfx.levelUp(), 520)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Enter advances to the next level (or next world) — no reach for the mouse.
  // Capture phase: the (still-focused, only-frozen) editor's vim keymap consumes
  // Enter and stops propagation, so a bubble-phase listener would never see it.
  useEffect(() => {
    if (!hasNext) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        onNext()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [hasNext, onNext])

  const onShare = async () => {
    sfx.ui()
    const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length
    const res = await shareScore({
      level: levelFromXp(xp),
      solved: Object.keys(completed).length,
      total: CHALLENGES.length,
      mastered,
      coins,
    })
    setShareMsg(res === 'shared' ? t('result.shared') : res === 'copied' ? t('result.copied') : t('result.shareFailed'))
    window.setTimeout(() => setShareMsg(null), 2500)
  }

  // Anything short of 3 stars can be improved by replaying for a lower
  // keystroke count — surface that as an explicit call-to-action.
  const canImprove = outcome.stars < 3

  return (
    <motion.div
      className="absolute inset-0 z-30 grid place-items-center bg-bg/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Boss defeat gets a brief magenta screen-wash so it reads as bigger than a normal solve. */}
      <AnimatePresence>
        {boss && (
          <motion.div
            className="pointer-events-none absolute inset-0 bg-magenta/25"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>
      {confetti && <Confetti boss={boss} onDone={() => setConfetti(false)} />}
      <motion.div
        className="panel w-full max-w-md p-8 text-center"
        initial={{ scale: 0.85, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 220, damping: 20 }}
      >
        <p className="title-gradient font-terminal text-4xl font-bold">
          {boss ? t('result.bossDefeated') : outcome.isPerfect ? t('result.perfect') : t('result.solved')}
        </p>

        <div className="mt-4 flex justify-center">
          <StarRow value={outcome.stars} size={40} animated />
        </div>

        <div className="mt-5 flex items-center justify-center gap-6 text-sm">
          <span className="text-ink-dim">
            {t('result.keystrokesLabel')} <b className="text-ink">{keystrokes}</b>
          </span>
          <span className="text-ink-dim">
            {t('result.goalLabel')} <b className="text-ink">{par}</b>
          </span>
        </div>

        {canImprove && <p className="mt-3 text-xs text-ink-dim">{t('result.improveHint', { par })}</p>}

        <div className="mt-4 flex items-center justify-center gap-6">
          {outcome.xpGained > 0 && (
            <motion.p
              className="font-terminal text-2xl text-amber glow-amber"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
            >
              +{outcome.xpGained} XP
            </motion.p>
          )}
          {outcome.coinsGained > 0 && (
            <motion.p
              className="flex items-center gap-1.5 font-terminal text-2xl text-amber"
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.32, type: 'spring', stiffness: 300 }}
            >
              +{outcome.coinsGained}
              <span className="coin" />
            </motion.p>
          )}
        </div>
        {outcome.xpGained === 0 && outcome.coinsGained === 0 && (
          <p className="mt-4 text-xs text-ink-dim">{t('result.alreadyMastered')}</p>
        )}

        {outcome.leveledUp && (
          <motion.p
            className="mt-2 text-cyan"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            ▲ {t('result.levelUp', { n: outcome.newLevel })}
          </motion.p>
        )}

        {outcome.newlyMastered.length > 0 && (
          <div className="mt-4 text-sm">
            <p className="text-ink-dim">{t('result.commandMastered')}</p>
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              {outcome.newlyMastered.map((id) => (
                <KeyCap key={id}>{COMMANDS_BY_ID[id]?.keys ?? id}</KeyCap>
              ))}
            </div>
          </div>
        )}

        <div className="mt-7 flex justify-center gap-3">
          <button
            onClick={onReplay}
            className={
              canImprove
                ? 'rounded border border-term/70 px-4 py-2 text-sm font-medium text-term transition-colors hover:bg-term/10'
                : 'rounded border border-border px-4 py-2 text-sm text-ink-dim transition-colors hover:border-term hover:text-term'
            }
          >
            ↻ {canImprove ? t('result.retryFor3') : t('result.replay')}
          </button>
          <button
            onClick={onMap}
            className="rounded border border-border px-4 py-2 text-sm text-ink-dim transition-colors hover:border-term hover:text-term"
          >
            ⊞ {t('result.map')}
          </button>
          {hasNext && (
            <button
              onClick={onNext}
              className="rounded bg-term px-5 py-2 text-sm font-bold text-bg transition-transform hover:scale-105"
            >
              {nextLabel}
            </button>
          )}
        </div>
        {hasNext && (
          <p className="mt-3 text-[11px] text-ink-dim">
            <KeyedText text={t('result.pressEnter')} />
          </p>
        )}

        <button
          onClick={onShare}
          className="mx-auto mt-4 inline-flex items-center gap-1.5 text-xs text-cyan underline decoration-dotted underline-offset-4 hover:opacity-80"
        >
          <Emoji name="rocket" size={14} /> {t('result.shareMyScore')}
        </button>
        {shareMsg && <p className="mt-1.5 text-xs text-term">{shareMsg}</p>}
      </motion.div>
    </motion.div>
  )
}
