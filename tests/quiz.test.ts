import { describe, expect, it } from 'vitest'
import { QUIZ, quizForTier } from '../src/content/quiz'
import { WORLDS } from '../src/content/tiers'

/** The per-world question floor. Every world ships a full drill of this many
 *  questions; a thinner world (the bug this suite guards against) is a gap. */
const MIN_PER_WORLD = 6

describe('quiz integrity', () => {
  it('question ids are unique', () => {
    const ids = QUIZ.map((q) => q.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every question is well-formed (>=2 choices, in-range integer answer)', () => {
    for (const q of QUIZ) {
      expect(q.choices.length, `${q.id}: needs at least two choices`).toBeGreaterThanOrEqual(2)
      expect(Number.isInteger(q.answer), `${q.id}: answer must be an integer index`).toBe(true)
      expect(q.answer, `${q.id}: answer index out of range`).toBeGreaterThanOrEqual(0)
      expect(q.answer, `${q.id}: answer index out of range`).toBeLessThan(q.choices.length)
    }
  })

  it('every question tier has world metadata', () => {
    const worldTiers = new Set(WORLDS.map((w) => w.tier))
    for (const q of QUIZ) {
      expect(worldTiers.has(q.tier as (typeof WORLDS)[number]['tier']), `${q.id}: no world for tier ${q.tier}`).toBe(
        true,
      )
    }
  })

  it('every world has a full drill of questions', () => {
    for (const w of WORLDS) {
      expect(quizForTier(w.tier).length, `world ${w.tier} has too few quiz questions`).toBeGreaterThanOrEqual(
        MIN_PER_WORLD,
      )
    }
  })
})
