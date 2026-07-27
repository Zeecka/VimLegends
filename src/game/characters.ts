/**
 * The selectable character roster. The first (astronaut) is free; the rest are
 * Shop unlocks (coins → `owned`, keyed by characterSku() so they never collide
 * with theme/background/finish ids). Equipping is just setHero({ character }).
 *
 * All five are from Quaternius's "Ultimate Animated Characters" pack (CC0,
 * quaternius.com / poly.pizza) — a SINGLE shared rig, so every character is the
 * same scale/proportions (24 shared animations). Meshopt-compressed in
 * public/models/. The player picks a character and a body finish (see heroParts
 * FINISHES); there is no per-zone recolor or procedural accessory/aura anymore.
 */
import type { HeroReaction } from '../three/stageState'

export type CharacterId = 'astronaut' | 'swat' | 'agent' | 'soldier' | 'engineer'

/** Model-local landmarks (pre-group-scale) for the display pedestal + aura extents. */
export interface Landmarks {
  feet: number
  torso: number
  headC: number
  headTop: number
  headR: number
}

/** 2D fallback (lite tier / Suspense / context loss) — a static PNG rendered from the GLB. */
export type CharacterThumb = { kind: 'image'; url: string }

export interface CharacterConfig {
  id: CharacterId
  name: string
  price: number // 0 = free
  url: string // drei public path, e.g. 'models/astronaut.glb'
  blurb: string
  scale: number // parent <group> scale — normalizes rendered height
  yOffset: number // parent <group> y — feet near the portrait bottom
  clipMap: Record<HeroReaction, string>
  landmarks: Landmarks
  thumb: CharacterThumb
}

// Every operative shares the same rig → identical transform + clip map.
const OP_SCALE = 1.0338
const OP_Y = -1.2796
const OP_LANDMARKS: Landmarks = { feet: 0, torso: 0.943, headC: 1.622, headTop: 1.886, headR: 0.23 }
const OP_CLIPS: Record<HeroReaction, string> = {
  idle: 'CharacterArmature|Idle',
  typing: 'CharacterArmature|Punch_Right', // the hero fights the bug while you type
  win: 'CharacterArmature|Wave',
  levelup: 'CharacterArmature|Roll',
  fail: 'CharacterArmature|HitRecieve',
}
const op = (id: CharacterId, name: string, price: number, blurb: string): CharacterConfig => ({
  id,
  name,
  price,
  url: `models/${id}.glb`,
  blurb,
  scale: OP_SCALE,
  yOffset: OP_Y,
  clipMap: OP_CLIPS,
  landmarks: OP_LANDMARKS,
  thumb: { kind: 'image', url: `characters/${id}.png` },
})

export const CHARACTERS: CharacterConfig[] = [
  op('astronaut', 'Nova', 0, 'Deep-space explorer in a powered suit.'),
  op('swat', 'Breach', 90, 'Tactical operator with a visor HUD.'),
  op('agent', 'Sable', 130, 'A sharp-dressed field agent.'),
  op('soldier', 'Ranger', 160, 'Front-line trooper, always ready.'),
  op('engineer', 'Rigg', 200, 'High-vis engineer who keeps it running.'),
]

export const CHARACTER_BY_ID = Object.fromEntries(CHARACTERS.map((c) => [c.id, c])) as Record<
  CharacterId,
  CharacterConfig
>
export const CHARACTER_IDS: CharacterId[] = CHARACTERS.map((c) => c.id)
export const DEFAULT_CHARACTER: CharacterId = 'astronaut'

/** Ownership key for a character — namespaced (like finishSku()) so it never
 *  collides with a theme/background/finish id inside the shared `owned` array. */
export const characterSku = (id: CharacterId): string => `char:${id}`

/** The character skus a fresh save owns for free (just the astronaut). */
export const DEFAULT_OWNED_CHARACTERS: string[] = CHARACTERS.filter((c) => c.price === 0).map((c) =>
  characterSku(c.id),
)

/** Resolve an id (possibly stale/garbage) to a config, falling back to the default. */
export function characterFrom(id: CharacterId | string): CharacterConfig {
  return CHARACTER_BY_ID[id as CharacterId] ?? CHARACTER_BY_ID[DEFAULT_CHARACTER]
}
