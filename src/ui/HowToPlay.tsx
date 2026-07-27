import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { CheatsheetButton } from './Cheatsheet'
import { Emoji } from './Emoji'
import { KeyedText } from './atoms'
import { useFocusTrap } from './useFocusTrap'
import { useT } from '../game/i18n'

/**
 * A 60-second primer for players who've never touched Vim — the one thing the
 * app was missing before you're dropped into a real modal editor. Lazy-loaded
 * (default export) so it never weighs on the sync bundle. Auto-shown once to
 * brand-new players (see App's Home), and always reachable from the Home button.
 */
export default function HowToPlay({ onClose }: { onClose: () => void }) {
  const panelRef = useRef<HTMLDivElement>(null)
  const t = useT()
  useFocusTrap(panelRef, onClose)

  const steps = [
    { k: t('howto.step1.title'), body: t('howto.step1.body') },
    { k: t('howto.step2.title'), body: t('howto.step2.body') },
    { k: t('howto.step3.title'), body: t('howto.step3.body') },
    { k: t('howto.step4.title'), body: t('howto.step4.body') },
  ]

  // Portal to <body> so an ancestor containing block (the animating main's
  // transform, the top bar's backdrop-blur) can't squash this fixed overlay.
  return createPortal(
    <motion.div
      className="fixed inset-0 z-50 grid place-items-center bg-bg/75 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.16 }}
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t('howto.dialogLabel')}
        className="panel flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden outline-none"
        initial={{ scale: 0.94, y: 14, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-2.5">
            <Emoji name="keyboard" size={20} />
            <h2 className="font-terminal text-xl font-bold text-term">{t('howto.title')}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-full border border-border px-2.5 py-1 text-sm text-ink-dim transition-colors hover:border-danger hover:text-danger"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto px-5 py-4">
          <p className="text-sm text-ink-dim">{t('howto.intro')}</p>
          {steps.map((s, i) => (
            <div key={s.k} className="flex gap-3 rounded-xl border border-border bg-panel-2/40 p-3.5">
              <span
                className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold text-bg"
                style={{ background: 'var(--color-term)' }}
                aria-hidden
              >
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{s.k}</p>
                <p className="mt-0.5 text-sm text-ink-dim">
                  <KeyedText text={s.body} />
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-border px-5 py-3.5">
          <CheatsheetButton
            label={t('campaign.cheatsheet')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3.5 py-1.5 text-sm text-ink-dim transition-colors hover:border-magenta hover:text-magenta"
          />
          <button onClick={onClose} className="btn-primary ml-auto rounded-lg px-4 py-1.5 text-sm font-bold">
            {t('howto.letsGo')} →
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  )
}
