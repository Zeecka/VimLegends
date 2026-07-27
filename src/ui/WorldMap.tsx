import { motion } from 'framer-motion'
import { WORLDS, challengesForTier, tierUnlocked } from '../content/tiers'
import { useGame } from '../game/store'
import { useT } from '../game/i18n'
import { StarRow } from './atoms'
import { Emoji } from './Emoji'
import { sfx } from '../game/sound'

/**
 * The campaign as a journey map: six world "stations" strung along a vertical
 * spine, each a node tinted with its world accent (locked / current / cleared),
 * with the world's challenges as a trail of star-beads you click to play. Motion
 * staggers the stations in, fills each progress bar, and gently pulses the world
 * you're currently on. All framer-motion, so <MotionConfig reducedMotion="user">
 * (App root) makes it instant/static for reduced-motion users.
 */
export function WorldMap({ onPlay }: { onPlay: (id: string) => void }) {
  const completed = useGame((s) => s.completed)
  const t = useT()

  // The world the player is "on" — the first unlocked world not yet fully cleared.
  const currentTier = WORLDS.find((w) => {
    const chs = challengesForTier(w.tier)
    return chs.length > 0 && tierUnlocked(w.tier, completed) && !chs.every((c) => completed[c.id])
  })?.tier

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h2 className="screen-title font-terminal text-4xl">{t('map.title')}</h2>
      <p className="mt-1 text-ink-dim">{t('map.subtitle')}</p>

      <ol className="relative mt-10 space-y-5">
        {/* The spine threading the station nodes together. */}
        <div
          className="pointer-events-none absolute left-[26px] top-8 bottom-8 w-px bg-gradient-to-b from-border via-border to-transparent"
          aria-hidden
        />
        {WORLDS.map((w, wi) => {
          const chs = challengesForTier(w.tier)
          const hasContent = chs.length > 0
          const worldUnlocked = tierUnlocked(w.tier, completed)
          const cleared = hasContent && chs.every((c) => completed[c.id])
          const playable = hasContent && worldUnlocked
          const isCurrent = w.tier === currentTier
          const solved = chs.filter((c) => completed[c.id]).length
          const starsEarned = chs.reduce((n, c) => n + (completed[c.id]?.stars ?? 0), 0)
          const accent = playable ? w.accent : 'var(--color-ink-dim)'
          const name = t(`content.world.${w.tier}.name`, undefined, w.name)

          return (
            <motion.li
              key={w.tier}
              className="relative flex gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: wi * 0.06, type: 'spring', stiffness: 180, damping: 22 }}
            >
              {/* Station node */}
              <motion.div
                className="relative z-10 mt-1 grid h-[54px] w-[54px] shrink-0 place-items-center rounded-full border-2 font-terminal text-xl font-bold tabular-nums"
                style={{
                  borderColor: accent,
                  color: cleared ? 'var(--color-bg)' : accent,
                  background: cleared ? w.accent : 'var(--color-panel)',
                  boxShadow: playable ? `0 0 22px -6px ${w.accent}` : 'none',
                }}
                animate={isCurrent ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                transition={isCurrent ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
              >
                {cleared ? '✓' : !worldUnlocked && hasContent ? <Emoji name="lock" size={18} /> : w.tier}
              </motion.div>

              {/* Station content */}
              <section className="panel flex-1 overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
                  <div>
                    <h3 className="font-terminal text-2xl" style={{ color: accent }}>
                      {t('map.worldLabel', { n: w.tier, name })}
                    </h3>
                    <p className="text-sm text-ink-dim">
                      {t(`content.world.${w.tier}.subtitle`, undefined, w.subtitle)}
                    </p>
                  </div>
                  {!hasContent ? (
                    <span className="rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-widest text-ink-dim">
                      {t('map.comingSoon')}
                    </span>
                  ) : cleared ? (
                    <span
                      className="rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
                      style={{ borderColor: w.accent, color: w.accent, background: `color-mix(in srgb, ${w.accent} 14%, transparent)` }}
                    >
                      ✓ {t('map.cleared')}
                    </span>
                  ) : !worldUnlocked ? (
                    <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[10px] uppercase tracking-widest text-ink-dim">
                      <Emoji name="lock" size={11} /> {t('map.locked')}
                    </span>
                  ) : (
                    <span
                      className="rounded-full border px-2.5 py-1 text-[11px] font-medium tabular-nums"
                      style={{ borderColor: accent, color: accent }}
                    >
                      {solved}/{chs.length} · {starsEarned}★
                    </span>
                  )}
                </div>

                {playable ? (
                  <>
                    {/* World progress fill. */}
                    <div className="mx-5 h-1 overflow-hidden rounded-full bg-panel-2">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: w.accent }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(solved / chs.length) * 100}%` }}
                        transition={{ delay: wi * 0.06 + 0.15, duration: 0.5, ease: 'easeOut' }}
                      />
                    </div>

                    {/* Trail of challenge beads. */}
                    <div className="flex flex-wrap gap-3 p-4">
                      {chs.map((c, i) => {
                        const prev = i === 0 ? null : chs[i - 1]
                        const unlocked = i === 0 || !!completed[prev!.id]
                        const res = completed[c.id]
                        const isBoss = c.kind === 'boss'
                        return (
                          <button
                            key={c.id}
                            disabled={!unlocked}
                            onClick={() => {
                              sfx.ui()
                              onPlay(c.id)
                            }}
                            title={t(`content.${c.id}.title`, undefined, c.title)}
                            className={`group flex w-11 flex-col items-center gap-1 ${unlocked ? '' : 'cursor-not-allowed'}`}
                          >
                            <span
                              className={`grid h-11 w-11 place-items-center rounded-full border text-sm font-bold tabular-nums transition-transform ${
                                unlocked ? 'group-hover:-translate-y-0.5' : 'border-border/40 text-ink-dim/40'
                              } ${isBoss ? 'ring-1 ring-magenta/60' : ''} ${
                                unlocked && !res ? 'border-border text-ink' : ''
                              }`}
                              style={
                                res
                                  ? {
                                      borderColor: isBoss ? 'var(--color-magenta)' : w.accent,
                                      color: isBoss ? 'var(--color-magenta)' : w.accent,
                                      background: `color-mix(in srgb, ${isBoss ? 'var(--color-magenta)' : w.accent} 14%, transparent)`,
                                    }
                                  : undefined
                              }
                            >
                              {isBoss ? '☠' : !unlocked ? <Emoji name="lock" size={12} /> : String(i + 1).padStart(2, '0')}
                            </span>
                            <StarRow value={res?.stars ?? 0} size={9} />
                          </button>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <p className="border-t border-border px-5 py-4 text-sm text-ink-dim">
                    {!hasContent
                      ? t('map.stub', {
                          subtitle: t(`content.world.${w.tier}.subtitle`, undefined, w.subtitle),
                        })
                      : t('map.lockedHint', { prev: w.tier - 1, count: chs.length })}
                  </p>
                )}
              </section>
            </motion.li>
          )
        })}
      </ol>
    </div>
  )
}
