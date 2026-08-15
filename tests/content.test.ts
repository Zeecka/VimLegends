import { describe, expect, it } from 'vitest'
import { CHALLENGES, WORLDS, challengesForTier, tierUnlocked } from '../src/content/tiers'
import { COMMANDS, COMMANDS_BY_ID } from '../src/game/commands'
import { stagesOf } from '../src/game/types'
import { createEditor, goalMet } from './driver'
import { en } from '../src/game/locales/en'
import { fr } from '../src/game/locales/fr'
import { es } from '../src/game/locales/es'
import { ru } from '../src/game/locales/ru'
import { zh } from '../src/game/locales/zh'

describe('content integrity', () => {
  it('challenge ids are unique', () => {
    const ids = CHALLENGES.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every taughtCommand resolves to a catalog entry', () => {
    for (const ch of CHALLENGES) {
      for (const cmd of ch.taughtCommands) {
        expect(COMMANDS_BY_ID[cmd], `${ch.id} teaches unknown command '${cmd}'`).toBeDefined()
      }
    }
  })

  it('every challenge has a positive par and at least one goal mechanism per stage', () => {
    for (const ch of CHALLENGES) {
      expect(ch.par, ch.id).toBeGreaterThan(0)
      for (const stage of stagesOf(ch)) {
        const hasGoal = stage.goal.targetText !== undefined || stage.goal.predicate !== undefined
        expect(hasGoal, `${ch.id}: stage without targetText or predicate`).toBe(true)
        expect(stage.goal.describe, `${ch.id}: stage without describe`).toBeTruthy()
      }
    }
  })

  it('startCursor is within startText bounds', () => {
    for (const ch of CHALLENGES) {
      if (!ch.startCursor) continue
      const lines = ch.startText.split('\n')
      expect(ch.startCursor.line, `${ch.id}: cursor line out of range`).toBeLessThanOrEqual(lines.length)
      expect(ch.startCursor.ch, `${ch.id}: cursor col out of range`).toBeLessThanOrEqual(
        lines[ch.startCursor.line - 1].length,
      )
    }
  })

  it('bosses have a keystroke budget past the 1★ threshold', () => {
    for (const ch of CHALLENGES.filter((c) => c.kind === 'boss')) {
      expect(ch.keystrokeBudget, ch.id).toBeDefined()
      expect(ch.keystrokeBudget!, `${ch.id}: budget must exceed 1★ threshold`).toBeGreaterThan(
        Math.ceil(ch.par * 1.75),
      )
    }
  })

  it('every challenge tier has world metadata', () => {
    const worldTiers = new Set(WORLDS.map((w) => w.tier))
    for (const ch of CHALLENGES) {
      expect(worldTiers.has(ch.tier), `${ch.id}: no world for tier ${ch.tier}`).toBe(true)
    }
  })

  it('command ids are unique', () => {
    const ids = COMMANDS.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  // Regression: W1 "Second Thoughts" once had targetText === startText and won
  // by itself. No first-stage goal may be satisfied by the untouched buffer.
  it('no challenge auto-wins on its pristine start state', () => {
    for (const ch of CHALLENGES) {
      const view = createEditor(ch)
      try {
        const first = stagesOf(ch)[0]
        expect(goalMet(view, first.goal), `${ch.id}: stage 1 goal met before any keystroke`).toBe(false)
      } finally {
        view.destroy()
      }
    }
  })
})

// KeyedText renders `backtick-quoted` spans as keycaps; the backtick KEY itself
// is written `{backtick}a`. An odd backtick count means a span never closed and
// the copy renders broken (regression: t4-marks once ended in a bare `a).
describe('copy markup (KeyedText backticks)', () => {
  const evenBackticks = (s: string) => ((s.match(/`/g) ?? []).length) % 2 === 0

  it('challenge copy has balanced backticks', () => {
    for (const ch of CHALLENGES) {
      const copies: Array<[string, string]> = [
        ['title', ch.title],
        ['brief', ch.brief],
        ['hint', ch.hint],
      ]
      stagesOf(ch).forEach((stage, i) => {
        copies.push([`stage ${i + 1} describe`, stage.goal.describe])
        if (stage.brief) copies.push([`stage ${i + 1} brief`, stage.brief])
      })
      for (const [what, text] of copies) {
        expect(evenBackticks(text), `${ch.id} ${what}: unbalanced backticks in "${text}"`).toBe(true)
      }
    }
  })

  it('locale strings have balanced backticks', () => {
    for (const [lang, dict] of Object.entries({ en, fr, es, ru, zh })) {
      for (const [key, text] of Object.entries(dict)) {
        expect(evenBackticks(text), `${lang} ${key}: unbalanced backticks in "${text}"`).toBe(true)
      }
    }
  })
})

describe('world/tier wiring', () => {
  const standardForTier = (tier: number) =>
    challengesForTier(tier as (typeof WORLDS)[number]['tier']).filter((c) => (c.kind ?? 'standard') !== 'boss')

  it('tier 1 is unlocked from a clean save; tier 2 is not', () => {
    expect(tierUnlocked(1, {})).toBe(true)
    expect(tierUnlocked(2, {})).toBe(false)
  })

  it('clearing tier 1 standard levels unlocks tier 2', () => {
    const completed = Object.fromEntries(standardForTier(1).map((c) => [c.id, true]))
    expect(tierUnlocked(2, completed)).toBe(true)
  })
})
