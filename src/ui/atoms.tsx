import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

/**
 * Row of up to 3 stars, `value` filled. Pass `animated` to burst each earned star
 * in with a stagger that matches the per-star `sfx.star()` pings (0.14s apart) —
 * the result screen was ringing three chimes while the stars appeared all at once.
 * <MotionConfig reducedMotion="user"> (App root) makes the burst instant for users
 * who prefer reduced motion.
 */
export function StarRow({ value, size = 20, animated = false }: { value: number; size?: number; animated?: boolean }) {
  return (
    <span className="inline-flex gap-1" aria-label={`${value} of 3 stars`}>
      {[1, 2, 3].map((i) => {
        const filled = i <= value
        const cls = filled ? 'text-amber glow-amber' : 'text-border'
        if (!animated || !filled) {
          return (
            <span key={i} style={{ fontSize: size }} className={cls}>
              ★
            </span>
          )
        }
        return (
          <motion.span
            key={i}
            style={{ fontSize: size, display: 'inline-block' }}
            className={cls}
            initial={{ scale: 0, rotate: -60, opacity: 0 }}
            animate={{ scale: [0, 1.35, 1], rotate: [-60, 8, 0], opacity: 1 }}
            transition={{ delay: (i - 1) * 0.14, duration: 0.42, ease: 'easeOut', times: [0, 0.6, 1] }}
          >
            ★
          </motion.span>
        )
      })}
    </span>
  )
}

const MODE_STYLES: Record<string, { label: string; cls: string }> = {
  normal: { label: 'NORMAL', cls: 'text-term border-term/40 bg-term/10' },
  insert: { label: 'INSERT', cls: 'text-amber border-amber/40 bg-amber/10' },
  visual: { label: 'VISUAL', cls: 'text-cyan border-cyan/40 bg-cyan/10' },
  'visual-block': { label: 'V·BLOCK', cls: 'text-cyan border-cyan/40 bg-cyan/10' },
  'visual-line': { label: 'V·LINE', cls: 'text-cyan border-cyan/40 bg-cyan/10' },
  replace: { label: 'REPLACE', cls: 'text-magenta border-magenta/40 bg-magenta/10' },
}

/** The current Vim mode indicator — a filled pill per mode. */
export function ModeBadge({ mode }: { mode: string }) {
  const m = MODE_STYLES[mode] ?? MODE_STYLES.normal
  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-bold tracking-[0.2em] tabular-nums ${m.cls}`}
    >
      {m.label}
    </span>
  )
}

/** A keyboard keycap. */
export function KeyCap({ children }: { children: ReactNode }) {
  return <kbd className="keycap">{children}</kbd>
}

/**
 * Prose with the keys called out as keycaps: every `backtick-quoted` span
 * becomes a <KeyCap>, the rest renders as plain text. This is how authored
 * copy (briefs, hints) names a key without content files importing React —
 * they stay pure data. Odd indices of the split are the captures.
 */
export function KeyedText({ text }: { text: string }) {
  return (
    <>
      {text.split(/`([^`]+)`/g).map((part, i) => (i % 2 === 1 ? <KeyCap key={i}>{part}</KeyCap> : part))}
    </>
  )
}
