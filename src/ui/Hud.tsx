import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { XPBar } from './XPBar'
import { PlayerAvatar } from './Avatar'
import { Emoji } from './Emoji'
import { AccountButton, AccountModal } from './Account'
import { CheatsheetButton } from './Cheatsheet'
import { LangSwitcher } from './LangSwitcher'
import { useT } from '../game/i18n'
import { useGame, MASTERY_THRESHOLD } from '../game/store'
import { useAccount, flushSync, verifiedShareUrl } from '../game/account'
import { levelFromXp } from '../game/xp'
import { shareScore } from '../game/share'
import { COMMANDS } from '../game/commands'
import { CHALLENGES } from '../content/tiers'
import { sfx } from '../game/sound'

/**
 * The persistent top bar — on every screen, home included. Carries the main
 * shortcuts (customize / maps / share / day streak) plus coins, XP, sound and
 * the optional account control. (Graphics quality is auto-detected per device;
 * there is no manual toggle.)
 */
export function Hud({
  onHome,
  onShop,
  onMap,
  onQuiz,
}: {
  onHome: () => void
  onShop: () => void
  onMap: () => void
  onQuiz: () => void
}) {
  const streak = useGame((s) => s.streak.count)
  const soundOn = useGame((s) => s.soundOn)
  const toggleSound = useGame((s) => s.toggleSound)
  const coins = useGame((s) => s.coins)
  const accountStatus = useAccount((s) => s.status)
  const t = useT()

  const [shareMsg, setShareMsg] = useState<string | null>(null)
  const [sharePrompt, setSharePrompt] = useState(false)

  const doShare = async (verified: string | null) => {
    const s = useGame.getState()
    const stats = {
      level: levelFromXp(s.xp),
      solved: Object.keys(s.completed).length,
      total: CHALLENGES.length,
      mastered: COMMANDS.filter((c) => (s.mastery[c.id] ?? 0) >= MASTERY_THRESHOLD).length,
      coins: s.coins,
    }
    const res = await shareScore(stats, verified)
    setShareMsg(
      res === 'shared' ? t('hud.shared') : res === 'copied' ? t('hud.scoreCopied') : t('hud.shareFailed'),
    )
    window.setTimeout(() => setShareMsg(null), 2600)
  }

  const onShare = async () => {
    sfx.ui()
    const verified = verifiedShareUrl()
    if (verified) {
      await flushSync() // the link must show the numbers being shared
      await doShare(verified)
    } else if (accountStatus === 'anon') {
      setSharePrompt(true) // offer a verified share first
    } else {
      await doShare(null)
    }
  }

  return (
    <header className="relative z-20 flex flex-wrap items-center justify-between gap-3 border-b border-border bg-panel/70 px-4 py-3 backdrop-blur">
      <button
        onClick={() => {
          sfx.ui()
          onHome()
        }}
        className="flex items-center gap-2"
      >
        <PlayerAvatar size={22} />
        <span className="hidden font-terminal text-xl font-bold tracking-tight text-term glow-term transition-opacity hover:opacity-80 sm:inline">
          :VimLegends
        </span>
      </button>

      <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
        <nav className="flex flex-wrap items-center gap-1 sm:gap-2" aria-label="Main">
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              sfx.ui()
              onShop()
            }}
            title={t('home.customizeTitle')}
            aria-label={t('home.customizeTitle')}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-amber hover:text-amber"
          >
            <Emoji name="palette" size={14} /> <span className="hidden md:inline">{t('hud.customize')}</span>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              sfx.ui()
              onMap()
            }}
            title={t('hud.mapsTitle')}
            aria-label={t('hud.mapsTitle')}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-term hover:text-term"
          >
            <Emoji name="target" size={14} /> <span className="hidden md:inline">{t('hud.maps')}</span>
          </button>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              sfx.ui()
              onQuiz()
            }}
            title={t('hud.quizTitle')}
            aria-label={t('hud.quiz')}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-cyan hover:text-cyan"
          >
            <Emoji name="star" size={14} /> <span className="hidden md:inline">{t('hud.quiz')}</span>
          </button>
          <CheatsheetButton
            label={t('hud.cheatsheet')}
            responsive
            keepEditorFocus
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-magenta hover:text-magenta"
          />
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => void onShare()}
            title={t('hud.shareTitle')}
            aria-label={t('hud.shareTitle')}
            className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-cyan hover:text-cyan"
          >
            <Emoji name="rocket" size={14} /> <span className="hidden md:inline">{t('hud.share')}</span>
          </button>
          <span
            title={streak > 0 ? t('hud.streakActive', { n: streak }) : t('hud.streakInactive')}
            className={`flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm ${
              streak > 0 ? 'text-amber' : 'text-ink-dim opacity-70'
            }`}
          >
            <Emoji name="fire" size={14} /> <span className="tabular-nums">{streak}</span>
            <span className="hidden lg:inline">{t('hud.dayStreak')}</span>
          </span>
        </nav>

        <XPBar />
        <button
          onClick={() => {
            sfx.ui()
            onShop()
          }}
          title={t('hud.shopTitle')}
          aria-label={t('hud.shopAria', { n: coins })}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-sm text-amber transition-colors hover:border-amber"
        >
          <span className="coin" /> <span className="tabular-nums">{coins}</span>
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            toggleSound()
            sfx.ui()
          }}
          className="opacity-80 transition-opacity hover:opacity-100"
          title={soundOn ? t('hud.mute') : t('hud.unmute')}
          aria-label={soundOn ? t('hud.mute') : t('hud.unmute')}
        >
          <Emoji name={soundOn ? 'sound-on' : 'mute'} size={18} />
        </button>
        <LangSwitcher />
        <AccountButton />
      </div>

      {shareMsg && (
        <p className="absolute right-4 top-full mt-2 rounded-lg border border-border bg-panel px-3 py-1.5 text-xs text-term shadow-lg">
          {shareMsg}
        </p>
      )}
      <AnimatePresence>
        {sharePrompt && (
          <AccountModal
            onClose={() => setSharePrompt(false)}
            note={t('hud.signInNote')}
            onShareAnyway={() => {
              setSharePrompt(false)
              void doShare(null)
            }}
          />
        )}
      </AnimatePresence>
    </header>
  )
}
