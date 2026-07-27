import { useEffect, useRef, useState } from 'react'
import { useFocusTrap } from './useFocusTrap'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { login, logout, useAccount } from '../game/account'
import { sfx } from '../game/sound'
import { useT } from '../game/i18n'

const PROVIDER_LABEL: Record<string, string> = { google: 'Google', github: 'GitHub' }

/**
 * Sign-in dialog. Accounts are OPTIONAL — the copy makes clear the game is
 * fully playable without one; signing in adds cross-device saves and a
 * verified (server-stored) score for sharing.
 *
 * Portalled to <body>: it is opened from the HUD, whose `backdrop-blur` would
 * otherwise become the containing block for `fixed inset-0` and pin this dialog
 * inside the 54px header. See CheatsheetModal for the same note.
 */
export function AccountModal({
  onClose,
  note,
  onShareAnyway,
}: {
  onClose: () => void
  /** Optional context line (e.g. shown when triggered from "share my score"). */
  note?: string
  /** When set, offers a "share without an account" escape hatch. */
  onShareAnyway?: () => void
}) {
  const providers = useAccount((s) => s.providers)
  const t = useT()
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, onClose)

  return createPortal(
    <div className="fixed inset-0 z-40 grid place-items-center bg-bg/70 p-4 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={{ opacity: 0, y: 12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="panel w-full max-w-sm p-6 outline-none"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t('account.dialogLabel')}
      >
        <h3 className="font-terminal text-2xl font-bold text-term">{t('account.title')}</h3>
        <p className="mt-2 text-sm text-ink-dim">{t('account.body')}</p>
        {note && <p className="mt-3 rounded-lg border border-amber/40 bg-amber/10 px-3 py-2 text-xs text-amber">{note}</p>}

        <div className="mt-5 flex flex-col gap-2">
          {providers.map((p) => (
            <button
              key={p}
              onClick={() => {
                sfx.ui()
                login(p)
              }}
              className="btn-primary rounded-xl px-4 py-2.5 font-bold"
            >
              {t('account.continueWith', { provider: PROVIDER_LABEL[p] ?? p })}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          {onShareAnyway ? (
            <button
              onClick={onShareAnyway}
              className="text-ink-dim underline decoration-dotted underline-offset-4 hover:text-ink"
            >
              {t('account.shareWithout')}
            </button>
          ) : (
            <span className="text-ink-dim">{t('account.mergedNote')}</span>
          )}
          <button onClick={onClose} className="text-ink-dim underline decoration-dotted underline-offset-4 hover:text-ink">
            {t('account.close')}
          </button>
        </div>
      </motion.div>
    </div>,
    document.body,
  )
}

/** Header account control: "Sign in" when anonymous, avatar + menu when signed in. */
export function AccountButton() {
  const status = useAccount((s) => s.status)
  const user = useAccount((s) => s.user)
  const syncedAt = useAccount((s) => s.syncedAt)
  const syncPending = useAccount((s) => s.syncPending)
  const [modal, setModal] = useState(false)
  const [menu, setMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const t = useT()

  useEffect(() => {
    if (!menu) return
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenu(false)
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [menu])

  if (status === 'checking' || status === 'offline') return null

  if (status === 'anon') {
    return (
      <>
        <button
          onClick={() => {
            sfx.ui()
            setModal(true)
          }}
          className="rounded-full border border-border px-3 py-1 text-sm text-ink-dim transition-colors hover:border-term hover:text-term"
        >
          {t('account.signIn')}
        </button>
        <AnimatePresence>{modal && <AccountModal onClose={() => setModal(false)} />}</AnimatePresence>
      </>
    )
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => {
          sfx.ui()
          setMenu((m) => !m)
        }}
        title={user?.name}
        className="flex items-center gap-1.5 rounded-full border border-border py-0.5 pl-0.5 pr-2 text-sm text-ink-dim transition-colors hover:border-term"
      >
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="h-6 w-6 rounded-full" referrerPolicy="no-referrer" />
        ) : (
          <span className="grid h-6 w-6 place-items-center rounded-full bg-panel-2 text-xs text-term">
            {(user?.name ?? '?').slice(0, 1).toUpperCase()}
          </span>
        )}
        <span
          className={`h-1.5 w-1.5 rounded-full ${syncPending ? 'animate-pulse bg-amber' : syncedAt ? 'bg-term' : 'bg-border'}`}
          title={syncPending ? t('account.saving') : syncedAt ? t('account.saved') : t('account.notSaved')}
        />
      </button>
      {menu && (
        <div className="panel absolute right-0 top-full z-30 mt-2 w-52 p-3 text-sm">
          <p className="truncate font-medium text-ink">{user?.name}</p>
          <p className="mt-0.5 text-xs text-ink-dim">
            {syncedAt
              ? t('account.viaSaved', { provider: PROVIDER_LABEL[user?.provider ?? ''] ?? user?.provider ?? '' })
              : t('account.viaNotSaved', { provider: PROVIDER_LABEL[user?.provider ?? ''] ?? user?.provider ?? '' })}
          </p>
          <button
            onClick={() => {
              sfx.ui()
              setMenu(false)
              void logout()
            }}
            className="mt-3 w-full rounded border border-border py-1.5 text-xs text-ink-dim transition-colors hover:border-danger hover:text-danger"
          >
            {t('account.signOut')}
          </button>
        </div>
      )}
    </div>
  )
}
