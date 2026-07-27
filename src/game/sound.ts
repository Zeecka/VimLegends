/**
 * Tiny chiptune SFX synthesized with the Web Audio API — no audio assets required,
 * works offline, and matches the retro-terminal aesthetic. All sounds are short
 * oscillator blips with a fast gain envelope. Respects a global mute flag.
 */

let ctx: AudioContext | null = null
let muted = false

export function setSoundMuted(m: boolean) {
  muted = m
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      ctx = new Ctor()
    }
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

type Wave = 'square' | 'triangle' | 'sawtooth' | 'sine'

function blip(freq: number, dur: number, opts: { type?: Wave; vol?: number; delay?: number } = {}) {
  if (muted) return
  const ac = audio()
  if (!ac) return
  const { type = 'square', vol = 0.05, delay = 0 } = opts
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + dur + 0.02)
}

// Note frequencies (equal temperament) for small melodies.
const N = { C4: 261.6, E4: 329.6, G4: 392.0, C5: 523.3, E5: 659.3, G5: 784.0, A5: 880.0 }

export const sfx = {
  /** A soft mechanical-keyboard tick on each keystroke. */
  key() {
    blip(180 + Math.random() * 60, 0.03, { type: 'square', vol: 0.02 })
  },
  /** Rising arpeggio on challenge success. */
  success() {
    blip(N.C5, 0.09, { vol: 0.05 })
    blip(N.E5, 0.09, { vol: 0.05, delay: 0.09 })
    blip(N.G5, 0.14, { vol: 0.055, delay: 0.18 })
  },
  /** Bright triad for a level-up. */
  levelUp() {
    blip(N.G4, 0.1, { type: 'triangle', vol: 0.06 })
    blip(N.C5, 0.1, { type: 'triangle', vol: 0.06, delay: 0.1 })
    blip(N.E5, 0.1, { type: 'triangle', vol: 0.06, delay: 0.2 })
    blip(N.G5, 0.22, { type: 'triangle', vol: 0.07, delay: 0.3 })
  },
  /** One ping per star earned. */
  star(index = 0) {
    blip([N.C5, N.E5, N.G5][index] ?? N.A5, 0.12, { type: 'sine', vol: 0.06, delay: index * 0.14 })
  },
  /** A bright two-note tick — reward coins landing. */
  coin() {
    blip(N.E5, 0.06, { type: 'square', vol: 0.05 })
    blip(N.A5, 0.09, { type: 'square', vol: 0.05, delay: 0.06 })
  },
  /** Cha-ching for a Shop purchase — distinct from the level-up triad. */
  purchase() {
    blip(N.G5, 0.08, { type: 'triangle', vol: 0.055 })
    blip(N.C5, 0.14, { type: 'triangle', vol: 0.06, delay: 0.09 })
    blip(N.E5, 0.16, { type: 'sine', vol: 0.05, delay: 0.16 })
  },
  /** Triumphant fanfare for a boss defeat — bigger + lower-to-higher than levelUp. */
  boss() {
    const seq = [N.C4, N.G4, N.C5, N.E5, N.G5]
    seq.forEach((f, i) =>
      blip(f, i === seq.length - 1 ? 0.34 : 0.12, { type: 'sawtooth', vol: 0.06, delay: i * 0.11 }),
    )
    blip(N.G5 * 1.5, 0.5, { type: 'sine', vol: 0.04, delay: seq.length * 0.11 }) // high shimmer
  },
  /** Ascending combo pitch — higher as the combo grows. */
  combo(step: number) {
    blip(440 + Math.min(step, 12) * 45, 0.05, { type: 'square', vol: 0.045 })
  },
  /** Low buzz on a miss / wrong action. */
  error() {
    blip(140, 0.14, { type: 'sawtooth', vol: 0.05 })
  },
  /** Short click for UI navigation. */
  ui() {
    blip(520, 0.035, { type: 'triangle', vol: 0.035 })
  },
}
