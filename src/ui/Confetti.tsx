import { useEffect, useRef } from 'react'

/**
 * A dependency-free confetti burst on a full-screen canvas — no external libs, no
 * bundle cost beyond this file. One-shot: it animates for ~1.5s then calls onDone
 * so the caller can unmount it. Decorative only: pointer-events-none, aria-hidden,
 * z-30 (overlay tier per the z-stack contract). Renders nothing when the user
 * prefers reduced motion (the celebration audio still fires).
 *
 * Colours are pulled from the live Nightglass accent tokens, so the burst matches
 * the equipped theme (Vim violet vs tmux green) and this file stays identical
 * across both games.
 */
export function Confetti({ boss = false, onDone }: { boss?: boolean; onDone?: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const done = useRef(onDone)
  done.current = onDone

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      done.current?.()
      return
    }
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const W = (canvas.width = window.innerWidth * dpr)
    const H = (canvas.height = window.innerHeight * dpr)

    const css = getComputedStyle(document.documentElement)
    const tok = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
    const COLORS = [
      tok('--color-amber', '#ffc24b'),
      tok('--color-term', '#7c6bff'),
      tok('--color-cyan', '#4cc9f0'),
      tok('--color-magenta', '#ff6ac1'),
      tok('--color-ink', '#e2e6f0'),
    ]

    const count = Math.round((boss ? 150 : 90) * Math.min(1, window.innerWidth / 900))
    const parts = Array.from({ length: count }, () => ({
      x: W / 2 + (Math.random() - 0.5) * W * 0.25,
      y: H * 0.42 + (Math.random() - 0.5) * H * 0.1,
      vx: (Math.random() - 0.5) * 16 * dpr,
      vy: (Math.random() * -13 - 4) * dpr,
      g: (0.28 + Math.random() * 0.16) * dpr,
      size: (4 + Math.random() * 5) * dpr,
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.32,
      color: COLORS[(Math.random() * COLORS.length) | 0],
    }))

    let raf = 0
    const start = performance.now()
    const DURATION = boss ? 1900 : 1500
    const tick = (now: number) => {
      const elapsed = now - start
      const fade = Math.max(0, 1 - elapsed / DURATION)
      ctx.clearRect(0, 0, W, H)
      for (const p of parts) {
        p.vy += p.g
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.99
        p.rot += p.vr
        ctx.save()
        ctx.globalAlpha = fade
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rot)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6)
        ctx.restore()
      }
      if (elapsed < DURATION) raf = requestAnimationFrame(tick)
      else done.current?.()
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [boss])

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 z-30 h-screen w-screen" />
}
