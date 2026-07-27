import { describe, expect, it } from 'vitest'
import { INITIAL_HERO, LEGACY_AVATAR_IDS, normalizeHero } from '../src/game/heroParts'
import { COSMETIC_BY_ID, COSMETICS, DEFAULTS, FREE_COSMETICS } from '../src/game/cosmetics'
import {
  CHARACTERS,
  CHARACTER_IDS,
  DEFAULT_OWNED_CHARACTERS,
  characterSku,
} from '../src/game/characters'

/**
 * The Hero customization is now just { finish, character } — the per-zone recolor
 * + procedural accessory/visor/aura system was pruned (v16). These cover the
 * migration path a legacy save takes: any older blob is coerced to the reduced
 * canonical shape and nothing dangles.
 */
describe('hero customization', () => {
  it('defaults to a matte finish + the free astronaut', () => {
    expect(INITIAL_HERO).toEqual({ finish: 'matte', character: 'astronaut' })
  })

  it('normalizes a legacy hero blob, dropping removed fields', () => {
    // Older saves carried per-zone colors + accessory/visor/aura; all ignored now.
    const hero = normalizeHero({
      primary: '#123456',
      secondary: '#abcdef',
      effect: 'fire',
      accessory: 'tophat',
      visorStyle: 'goggles',
      aura: { color: '#ffffff', style: 'rings', intensity: 0.25 },
      finish: 'metallic',
      character: 'swat',
    })
    expect(hero).toEqual({ finish: 'metallic', character: 'swat' })
  })

  it('falls back to defaults on garbage input', () => {
    expect(normalizeHero(null)).toEqual(INITIAL_HERO)
    expect(normalizeHero({ finish: 'nope', character: 'jetpack' })).toEqual(INITIAL_HERO)
  })

  it('validates the body finish, defaulting to matte', () => {
    expect(normalizeHero({ finish: 'glow' }).finish).toBe('glow')
    expect(normalizeHero({ finish: 'metallic' }).finish).toBe('metallic')
    expect(normalizeHero({ finish: 'nope' }).finish).toBe('matte')
    expect(normalizeHero({}).finish).toBe('matte')
  })
})

describe('legacy avatars', () => {
  it('LEGACY_AVATAR_IDS is an array of retired avatar ids (incl. robot)', () => {
    expect(Array.isArray(LEGACY_AVATAR_IDS)).toBe(true)
    expect(LEGACY_AVATAR_IDS).toContain('robot')
  })

  it('no longer sells avatars', () => {
    expect((COSMETICS as { kind: string }[]).some((c) => c.kind === 'avatar')).toBe(false)
  })

  it('defaults are free and therefore owned from the first launch', () => {
    expect(FREE_COSMETICS).toContain(DEFAULTS.theme)
    expect(FREE_COSMETICS).toContain(DEFAULTS.background)
    expect(COSMETIC_BY_ID[DEFAULTS.theme]).toBeTruthy()
  })
})

describe('character catalog', () => {
  const REACTIONS = ['idle', 'typing', 'win', 'levelup', 'fail'] as const

  it('leads with the free default character', () => {
    expect(CHARACTERS[0].id).toBe('astronaut')
    expect(CHARACTERS[0].price).toBe(0)
  })

  it('has unique character ids', () => {
    expect(new Set(CHARACTER_IDS).size).toBe(CHARACTER_IDS.length)
  })

  it('every config is fully specified for the 3D rig', () => {
    for (const c of CHARACTERS) {
      for (const r of REACTIONS) {
        expect(typeof c.clipMap[r], `${c.id}.clipMap.${r}`).toBe('string')
        expect(c.clipMap[r].length, `${c.id}.clipMap.${r} empty`).toBeGreaterThan(0)
      }
      expect(c.url.endsWith('.glb'), `${c.id} url`).toBe(true)
      expect(c.landmarks, `${c.id} has no landmarks`).toBeTruthy()
      expect(typeof c.landmarks.feet).toBe('number')
      expect(typeof c.scale).toBe('number')
      expect(c.thumb.kind).toBe('image')
    }
  })

  it('namespaces ownership skus and owns the default for free', () => {
    expect(characterSku('astronaut')).toBe('char:astronaut')
    expect(DEFAULT_OWNED_CHARACTERS).toContain(characterSku('astronaut'))
  })

  it('normalizeHero coerces the character field', () => {
    expect(normalizeHero({ character: 'nope' }).character).toBe('astronaut')
    expect(normalizeHero({ character: 'swat' }).character).toBe('swat')
  })
})
