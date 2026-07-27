import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Hud } from './ui/Hud'
import { CommandBelt } from './ui/CommandBelt'
import { WorldMap } from './ui/WorldMap'
import { Shop } from './ui/Shop'
import { Background } from './ui/Background'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { Emoji } from './ui/Emoji'
import { Profile } from './ui/Profile'
import { GitHubButton } from './ui/GitHubButton'
import { SisterAppButton } from './ui/SisterAppButton'
import { CampaignMode } from './modes/CampaignMode'
import { ArcadeMode } from './modes/ArcadeMode'
import { CHALLENGES } from './content/tiers'
import { useGame, MASTERY_THRESHOLD } from './game/store'
import { useT, useLang } from './game/i18n'
import { levelFromXp } from './game/xp'
import { COMMANDS } from './game/commands'
import { initAccount } from './game/account'
import { DONATE_URL } from './game/links'
import { setSoundMuted, sfx } from './game/sound'
import { COSMETIC_BY_ID } from './game/cosmetics'
import { effectiveQuality } from './game/quality'
import { setStage, useStage } from './three/stageState'

// The entire 3D graph (three, r3f, drei, models) lives behind this one lazy
// boundary — the sync bundle stays 3D-free and the editor stays instant.
const Stage3D = lazy(() => import('./three/Stage3D'))
// Quiz mode (+ its question bank) is a leaf route — lazy so it never weighs down
// the sync bundle. On mobile we open here, so it's fetched immediately anyway.
const QuizMode = lazy(() => import('./modes/QuizMode').then((m) => ({ default: m.QuizMode })))

type Screen =
  | { name: 'home' }
  | { name: 'map' }
  | { name: 'play'; id: string }
  | { name: 'arcade' }
  | { name: 'quiz' }
  | { name: 'shop' }
  | { name: 'profile'; publicId: string }

function firstUnsolvedId(completed: Record<string, unknown>): string | null {
  return CHALLENGES.find((ch) => !completed[ch.id])?.id ?? null
}

/** The real editor needs a keyboard, so small touch screens land on Quiz mode. */
function isMobileViewport(): boolean {
  try {
    return window.matchMedia('(max-width: 640px)').matches
  } catch {
    return false
  }
}

/** The URL-hash form of a screen, so browser back/forward + refresh work.
 *  'profile' is a ?u= deep-link (handled separately), so it maps to no hash. */
function screenToHash(s: Screen): string {
  switch (s.name) {
    case 'home':
    case 'profile':
      return ''
    case 'play':
      return `#play/${s.id}`
    default:
      return `#${s.name}`
  }
}

/** Parse a screen from a URL hash, or null if it isn't a known route. A #play/<id>
 *  whose challenge no longer exists falls back to the map. */
function screenFromHash(hash: string): Screen | null {
  const h = hash.replace(/^#/, '')
  if (!h || h === 'home') return { name: 'home' }
  if (h.startsWith('play/')) {
    const id = h.slice('play/'.length)
    return CHALLENGES.some((c) => c.id === id) ? { name: 'play', id } : { name: 'map' }
  }
  if (h === 'map' || h === 'arcade' || h === 'quiz' || h === 'shop') return { name: h }
  return null
}

/** A shared verified-score link (?u=<publicId>) opens on the score page. Otherwise
 *  restore the screen from the URL hash (refresh-in-place / deep link); failing
 *  that, a phone opens straight into Quiz mode (the touch-friendly trainer). */
function initialScreen(): Screen {
  const u = new URLSearchParams(window.location.search).get('u')
  if (u) return { name: 'profile', publicId: u }
  const fromHash = screenFromHash(window.location.hash)
  if (fromHash && fromHash.name !== 'home') return fromHash
  return isMobileViewport() ? { name: 'quiz' } : { name: 'home' }
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(initialScreen)
  const soundOn = useGame((s) => s.soundOn)
  const equipped = useGame((s) => s.equipped)
  const quality = useGame((s) => s.quality)
  const contextLost = useStage((s) => s.contextLost)
  const stageReady = useStage((s) => s.ready)
  const lang = useLang()

  const theme = COSMETIC_BY_ID[equipped.theme]
  const accent = theme?.accent ?? '#7c6bff'
  const accentDim = theme?.accentDim ?? '#5a4cd6'
  const bgId = COSMETIC_BY_ID[equipped.background]?.bg ?? 'crt'

  // A lost WebGL context downgrades to lite for the rest of the session.
  const tier = contextLost ? 'lite' : effectiveQuality(quality)

  // Probe the optional backend once: restores the session, merges progress,
  // starts auto-sync. A static deployment simply reports 'offline'.
  useEffect(() => {
    void initAccount()
  }, [])

  useEffect(() => {
    setSoundMuted(!soundOn)
  }, [soundOn])

  // Reflect the active language on <html lang> for a11y / SEO (covers the initial
  // auto-detected value; explicit switches also set this via the store).
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--color-term', accent)
    root.style.setProperty('--color-term-dim', accentDim)
  }, [accent, accentDim])

  // Mirror UI state into the 3D bridge store (safe before the chunk loads).
  useEffect(() => {
    setStage({ screen: screen.name, accent, bgId })
  }, [screen.name, accent, bgId])

  // Warm the 3D chunk on idle so route transitions never await it.
  useEffect(() => {
    if (tier !== 'webgl') return
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number }
    const idle = (cb: () => void) => (w.requestIdleCallback ? w.requestIdleCallback(cb) : window.setTimeout(cb, 1500))
    idle(() => {
      void import('./three/Stage3D')
    })
  }, [tier])

  // Keep the URL hash in sync with the screen so browser back/forward + refresh-in-
  // place work. play→play transitions replace (so the whole campaign doesn't stack
  // into history); every other move pushes a new entry. 'profile' stays on its ?u=.
  const prevScreenRef = useRef<Screen>(screen)
  useEffect(() => {
    if (screen.name !== 'profile') {
      const desired = screenToHash(screen)
      if (window.location.hash !== desired) {
        const method =
          prevScreenRef.current.name === 'play' && screen.name === 'play' ? 'replaceState' : 'pushState'
        window.history[method](null, '', desired || window.location.pathname + window.location.search)
      }
    }
    prevScreenRef.current = screen
  }, [screen])

  // Browser back/forward (popstate) and manual hash edits (hashchange) drive the screen.
  useEffect(() => {
    const onNav = () => {
      const u = new URLSearchParams(window.location.search).get('u')
      if (u) return setScreen({ name: 'profile', publicId: u })
      const s = screenFromHash(window.location.hash)
      if (s) setScreen(s)
    }
    window.addEventListener('popstate', onNav)
    window.addEventListener('hashchange', onNav)
    return () => {
      window.removeEventListener('popstate', onNav)
      window.removeEventListener('hashchange', onNav)
    }
  }, [])

  const go = (s: Screen) => setScreen(s)
  const play = (id: string) => go({ name: 'play', id })
  const leaveProfile = () => {
    // Drop the ?u= param so a reload doesn't bounce back to the shared score.
    window.history.replaceState(null, '', window.location.pathname)
    go({ name: 'home' })
  }

  const challenge = screen.name === 'play' ? CHALLENGES.find((c) => c.id === screen.id) : undefined
  const onBoss = challenge?.kind === 'boss'

  return (
    <MotionConfig reducedMotion="user">
      {/* Lite background stays mounted until the 3D stage has painted a frame
          (and forever in the lite tier) — never a blank flash. */}
      {(tier === 'lite' || !stageReady) && <Background bg={bgId} accent={accent} />}
      {tier === 'webgl' && (
        <ErrorBoundary
          fallback={<Background bg={bgId} accent={accent} />}
          onError={() => setStage({ contextLost: true })}
        >
          <Suspense fallback={null}>
            <Stage3D />
          </Suspense>
        </ErrorBoundary>
      )}
      {/* A per-context colour wash so each screen reads distinctly at a glance:
          Quiz (cyan) ≠ Motion Rush (amber), and any boss fight floods magenta so
          you always know you're facing one. Sits above the background, below UI. */}
      <ScreenTint screen={screen.name} boss={onBoss} />
      <div className="relative z-10 min-h-screen">
        {screen.name !== 'profile' && (
          <Hud
            onHome={() => go({ name: 'home' })}
            onShop={() => go({ name: 'shop' })}
            onMap={() => go({ name: 'map' })}
            onQuiz={() => go({ name: 'quiz' })}
          />
        )}

        <AnimatePresence mode="wait">
          <motion.main
            key={screen.name + (screen.name === 'play' ? screen.id : '')}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            {screen.name === 'home' && (
              <Home
                onPlay={play}
                onMap={() => go({ name: 'map' })}
                onArcade={() => go({ name: 'arcade' })}
                onQuiz={() => go({ name: 'quiz' })}
              />
            )}
            {screen.name === 'map' && <WorldMap onPlay={play} />}
            {screen.name === 'arcade' && <ArcadeMode />}
            {screen.name === 'quiz' && (
              <Suspense fallback={null}>
                <QuizMode />
              </Suspense>
            )}
            {screen.name === 'shop' && <Shop />}
            {screen.name === 'profile' && <Profile publicId={screen.publicId} onPlay={leaveProfile} />}
            {screen.name === 'play' &&
              (challenge ? (
                <CampaignMode
                  challenge={challenge}
                  onPlay={play}
                  onMap={() => go({ name: 'map' })}
                  onQuiz={() => go({ name: 'quiz' })}
                />
              ) : (
                <Fallback onHome={() => go({ name: 'home' })} />
              ))}
          </motion.main>
        </AnimatePresence>
      </div>
    </MotionConfig>
  )
}

function Home({
  onPlay,
  onMap,
  onArcade,
  onQuiz,
}: {
  onPlay: (id: string) => void
  onMap: () => void
  onArcade: () => void
  onQuiz: () => void
}) {
  const xp = useGame((s) => s.xp)
  const coins = useGame((s) => s.coins)
  const completed = useGame((s) => s.completed)
  const arcadeBest = useGame((s) => s.arcadeBest)
  const reset = useGame((s) => s.resetProgress)
  const t = useT()
  const [confirmReset, setConfirmReset] = useState(false)

  const solved = Object.keys(completed).length
  const hasProgress = solved > 0 || xp > 0 || coins > 0 || arcadeBest > 0
  const nextId = firstUnsolvedId(completed)

  const startCampaign = () => {
    sfx.ui()
    if (nextId) onPlay(nextId)
    else onMap()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="text-center">
        <motion.h1
          className="title-gradient font-terminal text-6xl font-bold tracking-tight sm:text-7xl"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          :VimLegends
        </motion.h1>
        <p className="mt-3 text-lg text-ink-dim">{t('home.tagline')}</p>
      </div>

      <HomeStats />

      <button
        onClick={startCampaign}
        className="btn-primary mt-8 w-full rounded-xl px-6 py-4 text-lg font-bold"
      >
        ▶ {hasProgress ? t('home.continueCampaign') : t('home.startCampaign')}
      </button>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => {
            sfx.ui()
            onArcade()
          }}
          className="btn-accent flex-1 rounded-xl px-6 py-4 text-lg font-bold"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Emoji name="target" size={22} /> {t('home.motionRush')}
          </span>
        </button>
        <button
          onClick={() => {
            sfx.ui()
            onQuiz()
          }}
          className="btn-accent flex-1 rounded-xl px-6 py-4 text-lg font-bold"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Emoji name="star" size={22} /> {t('home.quizMode')}
          </span>
        </button>
      </div>

      <div className="mt-10">
        <CommandBelt />
      </div>

      <div className="mt-8 flex items-center justify-center">
        {hasProgress && (
          <button
            onClick={() => {
              sfx.ui()
              setConfirmReset(true)
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-ink-dim transition-colors hover:border-danger hover:text-danger"
          >
            <span aria-hidden>⟲</span> {t('home.resetProgress')}
          </button>
        )}
      </div>

      {/* Conditional render (no AnimatePresence exit): closing unmounts the
          full-screen overlay instantly, so an invisible z-40 layer can never
          linger and swallow clicks on Home. It still animates IN. */}
      {confirmReset && (
        <motion.div
          className="fixed inset-0 z-40 grid place-items-center bg-bg/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          onClick={() => setConfirmReset(false)}
        >
          <motion.div
            className="panel w-full max-w-sm p-6 text-center"
            role="dialog"
            aria-modal="true"
            aria-label={t('home.resetTitle')}
            initial={{ scale: 0.92, y: 12, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mx-auto grid h-12 w-12 place-items-center rounded-full text-2xl text-danger"
              style={{ background: 'color-mix(in srgb, var(--color-danger) 15%, transparent)' }}
              aria-hidden
            >
              ⚠
            </div>
            <h3 className="mt-3 font-terminal text-2xl font-bold text-danger">{t('home.resetTitle')}</h3>
            <p className="mt-2 text-sm text-ink-dim">{t('home.resetBody')}</p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  sfx.ui()
                  setConfirmReset(false)
                }}
                className="rounded-xl border border-border px-5 py-2.5 text-sm text-ink-dim transition-colors hover:border-term hover:text-term"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => {
                  sfx.error()
                  reset()
                  setConfirmReset(false)
                }}
                className="rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-105"
                style={{ background: 'var(--color-danger)' }}
              >
                {t('home.resetConfirm')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <p className="mt-8 flex flex-wrap items-center justify-center gap-3 text-center text-xs text-ink-dim">
        <GitHubButton />
        <SisterAppButton />
        <a
          href={DONATE_URL}
          target="_blank"
          rel="noreferrer"
          onClick={() => sfx.ui()}
          className="inline-flex items-center gap-1.5 rounded-full border border-magenta/50 px-3 py-1 font-bold text-magenta transition-colors hover:bg-magenta/10"
        >
          ♥ {t('home.donate')}
        </a>
      </p>
    </div>
  )
}

function HomeStats() {
  const xp = useGame((s) => s.xp)
  const coins = useGame((s) => s.coins)
  const completed = useGame((s) => s.completed)
  const mastery = useGame((s) => s.mastery)
  const arcadeBest = useGame((s) => s.arcadeBest)
  const t = useT()

  const level = levelFromXp(xp)
  const solved = Object.keys(completed).length
  const mastered = COMMANDS.filter((c) => (mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length

  const stats = [
    { label: t('stats.level'), value: level, color: 'text-term', bar: 'var(--color-term)' },
    { label: t('stats.coins'), value: coins, color: 'text-amber', bar: 'var(--color-amber)' },
    { label: t('stats.solved'), value: `${solved}/${CHALLENGES.length}`, color: 'text-cyan', bar: 'var(--color-cyan)' },
    { label: t('stats.mastered'), value: mastered, color: 'text-magenta', bar: 'var(--color-magenta)' },
    { label: t('stats.rush'), value: arcadeBest, color: 'text-term', bar: 'var(--color-term)' },
  ]

  return (
    <div className="mt-10 grid grid-cols-3 gap-3 text-center sm:grid-cols-5">
      {stats.map((s) => (
        <div
          key={s.label}
          className="panel py-3"
          style={{ borderTop: `2.5px solid ${s.bar}`, boxShadow: `0 -1px 16px -7px ${s.bar}` }}
        >
          <div className={`font-terminal text-2xl font-semibold tabular-nums ${s.color}`}>{s.value}</div>
          <div className="text-[10px] uppercase tracking-widest text-ink-dim">{s.label}</div>
        </div>
      ))}
    </div>
  )
}

function Fallback({ onHome }: { onHome: () => void }) {
  const t = useT()
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <button onClick={onHome} className="text-term underline">
        ← {t('common.backHome')}
      </button>
    </div>
  )
}

/**
 * Full-screen colour wash that gives each context its own identity. A boss fight
 * always wins (magenta) so it's unmistakable; otherwise Quiz (cyan) and Motion
 * Rush (amber) get distinct tints. Everything else stays on the equipped
 * background untinted. Pointer-events-none, at z-0 above the background.
 */
function ScreenTint({ screen, boss }: { screen: string; boss: boolean }) {
  const tint = boss
    ? 'var(--color-magenta)'
    : screen === 'quiz'
      ? 'var(--color-cyan)'
      : screen === 'arcade'
        ? 'var(--color-amber)'
        : null
  if (!tint) return null
  const strength = boss ? 24 : 16
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        background: `radial-gradient(125% 85% at 50% -10%, color-mix(in srgb, ${tint} ${strength}%, transparent), transparent 62%)`,
      }}
    />
  )
}
