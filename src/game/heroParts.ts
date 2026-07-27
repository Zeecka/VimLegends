/**
 * The player's Hero customization: which base character model they wear (see
 * characters.ts) and its body-surface finish. The old per-zone recolor +
 * procedural accessory/visor/aura system was removed — it was never surfaced in
 * the Shop nor rendered on the 3D model. Characters + finishes are the whole
 * customization surface today.
 */

import { CHARACTER_IDS, DEFAULT_CHARACTER, type CharacterId } from './characters'

/** Body-surface material finish. matte = flat toon (default); glow/holo are
 *  emissive toon (they bloom); metallic is real PBR (metalness + reflections). */
export type HeroFinish = 'matte' | 'glow' | 'holo' | 'metallic'

/** Persisted Hero customization. */
export interface HeroCustom {
  /** Body material finish (matte/glow/holo/metallic). */
  finish: HeroFinish
  /** Which base model the player is wearing (see characters.ts). */
  character: CharacterId
}

export const INITIAL_HERO: HeroCustom = {
  finish: 'matte',
  character: DEFAULT_CHARACTER,
}

/**
 * Body finishes — a Shop purchase axis. matte is the free default; glow/holo/
 * metallic cost coins. Owned via `finishSku()` in the shared `owned` set.
 */
export const FINISHES: { id: HeroFinish; name: string; price: number }[] = [
  { id: 'matte', name: 'Matte', price: 0 },
  { id: 'glow', name: 'Glow', price: 40 },
  { id: 'metallic', name: 'Metallic', price: 60 },
  { id: 'holo', name: 'Holo', price: 80 },
]
export const finishSku = (id: HeroFinish): string => `finish:${id}`
export const DEFAULT_OWNED_FINISHES: string[] = FINISHES.filter((f) => f.price === 0).map((f) => finishSku(f.id))

const FINISH_IDS = FINISHES.map((f) => f.id) as string[]

/** Old avatar cosmetic ids (removed in v10) — stripped from `owned` on migrate. */
export const LEGACY_AVATAR_IDS = [
  'cursor', 'ninja', 'robot', 'cat', 'sprite', 'alien', 'ghost', 'fox', 'pixelpal', 'wizard', 'knight', 'glitch', 'dragon',
]

/**
 * Coerce any persisted/legacy hero blob to the canonical shape. Older saves may
 * carry extra fields (per-zone colors, accessory/visor/aura from the removed
 * customizer) — they're ignored. Unknown/garbage finish or character fall back
 * to the defaults.
 */
export function normalizeHero(raw: unknown): HeroCustom {
  const h = (raw ?? {}) as Record<string, unknown>
  return {
    finish: FINISH_IDS.includes(h.finish as string) ? (h.finish as HeroFinish) : 'matte',
    character: CHARACTER_IDS.includes(h.character as CharacterId) ? (h.character as CharacterId) : DEFAULT_CHARACTER,
  }
}
