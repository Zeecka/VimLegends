import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Challenge, ChallengeResult, Stars } from './types'
import type { QualitySetting } from './quality'
import { levelFromXp, starsFor, xpForChallenge } from './xp'
import { COSMETIC_BY_ID, DEFAULTS, FREE_COSMETICS, LEGACY_DEFAULT_BACKGROUNDS, LEGACY_DEFAULT_THEMES } from './cosmetics'
import {
  DEFAULT_OWNED_FINISHES,
  FINISHES,
  INITIAL_HERO,
  LEGACY_AVATAR_IDS,
  finishSku,
  normalizeHero,
  type HeroCustom,
  type HeroFinish,
} from './heroParts'
import { CHARACTER_BY_ID, DEFAULT_OWNED_CHARACTERS, characterSku, type CharacterId } from './characters'

/** Reps of a command before it counts as "mastered" (fills the command belt). */
export const MASTERY_THRESHOLD = 3

export interface Equipped {
  theme: string
  background: string
}

export type { HeroCustom }

export interface CompleteOutcome {
  stars: Stars
  xpGained: number
  coinsGained: number
  leveledUp: boolean
  newLevel: number
  newlyMastered: string[]
  isPerfect: boolean
}

interface Persisted {
  xp: number
  coins: number
  completed: Record<string, ChallengeResult>
  mastery: Record<string, number>
  streak: { count: number; lastPlayed: string | null }
  soundOn: boolean
  arcadeBest: number
  /** Best number of correct answers in a single Quiz round. */
  quizBest: number
  owned: string[]
  equipped: Equipped
  hero: HeroCustom
  /** Graphics quality: 'auto' resolves per-device via detectQuality(). */
  quality: QualitySetting
  /** Whether the first-run "How to play" primer has been shown. It auto-opens
   *  once, on the player's first campaign level. */
  seenPrimer: boolean
}

interface GameStore extends Persisted {
  completeChallenge: (ch: Challenge, keystrokes: number) => CompleteOutcome
  recordArcade: (score: number, commands: string[]) => { isNewBest: boolean; coinsGained: number }
  /** Record a finished Quiz round: awards coins, tracks the best, bumps the streak. */
  recordQuiz: (correct: number, total: number) => { isNewBest: boolean; coinsGained: number }
  buyItem: (id: string) => boolean
  equipItem: (id: string) => void
  /** Buy a character (coins → `owned`). Returns false if unaffordable/owned. */
  buyCharacter: (id: CharacterId) => boolean
  /** Buy a body finish (coins → `owned`). Returns false if unaffordable/owned. */
  buyFinish: (id: HeroFinish) => boolean
  setHero: (partial: Partial<HeroCustom>) => void
  bumpStreak: () => void
  toggleSound: () => void
  setQuality: (q: QualitySetting) => void
  /** Mark the first-run primer as seen so it never auto-opens again. */
  markPrimerSeen: () => void
  resetProgress: () => void
}

function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`
}

function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000)
}

const initial: Persisted = {
  xp: 0,
  coins: 0,
  completed: {},
  mastery: {},
  streak: { count: 0, lastPlayed: null },
  soundOn: true,
  arcadeBest: 0,
  quizBest: 0,
  owned: [
    ...FREE_COSMETICS,
    ...DEFAULT_OWNED_CHARACTERS,
    ...DEFAULT_OWNED_FINISHES,
  ],
  equipped: { ...DEFAULTS },
  hero: INITIAL_HERO,
  quality: 'auto',
  seenPrimer: false,
}

// Forward-migrate the persisted save from the pre-rebrand key. VimLegends was
// formerly "Vimersion"; copy any existing save to the new key so players keep
// their progress across the rename, then drop the stale key. Runs once, before
// persist() reads storage below; a no-op after the first load. If setItem throws
// (quota/private mode) we bail before removing the old key, so nothing is lost.
function adoptLegacySave() {
  try {
    const NEXT = 'vimlegends-save'
    const PREV = 'vimersion-save'
    if (localStorage.getItem(NEXT) == null) {
      const legacy = localStorage.getItem(PREV)
      if (legacy != null) localStorage.setItem(NEXT, legacy)
    }
    localStorage.removeItem(PREV)
  } catch {
    /* no storage — persist() will start fresh */
  }
}
adoptLegacySave()

export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      ...initial,

      completeChallenge: (ch, keystrokes) => {
        const s = get()
        const stars = starsFor(keystrokes, ch.par)
        const prev = s.completed[ch.id]
        const prevStars: number = prev?.stars ?? 0
        const xpGained = xpForChallenge(stars, prevStars)

        const beforeLevel = levelFromXp(s.xp)
        const newXp = s.xp + xpGained
        const afterLevel = levelFromXp(newXp)
        const leveledUp = afterLevel > beforeLevel

        // Coins: reward first solves and improvements, plus a level-up bonus.
        let coinsGained = 0
        if (prevStars === 0) coinsGained = 5 + stars * 3
        else if (stars > prevStars) coinsGained = (stars - prevStars) * 3
        if (leveledUp) coinsGained += 25

        const mastery = { ...s.mastery }
        const newlyMastered: string[] = []
        for (const id of ch.taughtCommands) {
          const before = mastery[id] ?? 0
          mastery[id] = before + 1
          if (before < MASTERY_THRESHOLD && mastery[id] >= MASTERY_THRESHOLD) newlyMastered.push(id)
        }

        const keepStars = Math.max(stars, prevStars) as Stars
        const bestKeystrokes = prev ? Math.min(prev.keystrokes, keystrokes) : keystrokes
        const result: ChallengeResult = {
          keystrokes: bestKeystrokes,
          par: ch.par,
          stars: keepStars,
          xp: (prev?.xp ?? 0) + xpGained,
        }

        set({ xp: newXp, coins: s.coins + coinsGained, completed: { ...s.completed, [ch.id]: result }, mastery })
        get().bumpStreak()

        return { stars, xpGained, coinsGained, leveledUp, newLevel: afterLevel, newlyMastered, isPerfect: keystrokes <= ch.par }
      },

      recordArcade: (score, commands) => {
        const s = get()
        const mastery = { ...s.mastery }
        for (const id of commands) mastery[id] = (mastery[id] ?? 0) + 1
        const isNewBest = score > s.arcadeBest
        const coinsGained = Math.floor(score / 5)
        set({ mastery, arcadeBest: Math.max(score, s.arcadeBest), coins: s.coins + coinsGained })
        get().bumpStreak()
        return { isNewBest, coinsGained }
      },

      recordQuiz: (correct, total) => {
        const s = get()
        const isNewBest = correct > s.quizBest
        const perfect = total > 0 && correct === total
        const coinsGained = correct * 3 + (perfect ? 10 : 0)
        set({ quizBest: Math.max(correct, s.quizBest), coins: s.coins + coinsGained })
        get().bumpStreak()
        return { isNewBest, coinsGained }
      },

      buyItem: (id) => {
        const item = COSMETIC_BY_ID[id]
        const s = get()
        if (!item || s.owned.includes(id) || s.coins < item.price) return false
        set({ coins: s.coins - item.price, owned: [...s.owned, id] })
        return true
      },

      equipItem: (id) => {
        const item = COSMETIC_BY_ID[id]
        const s = get()
        if (!item || !s.owned.includes(id)) return
        set({ equipped: { ...s.equipped, [item.kind]: id } })
      },

      buyCharacter: (id) => {
        const cfg = CHARACTER_BY_ID[id]
        const sku = characterSku(id)
        const s = get()
        if (!cfg || s.owned.includes(sku) || s.coins < cfg.price) return false
        set({ coins: s.coins - cfg.price, owned: [...s.owned, sku] })
        return true
      },

      buyFinish: (id) => {
        const finish = FINISHES.find((f) => f.id === id)
        const sku = finishSku(id)
        const s = get()
        if (!finish || s.owned.includes(sku) || s.coins < finish.price) return false
        set({ coins: s.coins - finish.price, owned: [...s.owned, sku] })
        return true
      },

      setHero: (partial) => set((s) => ({ hero: { ...s.hero, ...partial } })),

      bumpStreak: () => {
        const s = get()
        const today = todayKey()
        const last = s.streak.lastPlayed
        if (last === today) return // already counted today — no double reward
        let count = 1
        if (last && daysBetween(last, today) === 1) count = s.streak.count + 1
        // Reward showing up: a few coins per active day, with milestone bonuses so a
        // long streak actually pays off (it was a purely cosmetic counter before).
        const MILESTONES: Record<number, number> = { 3: 15, 7: 40, 14: 80, 30: 200 }
        const coinsGained = 3 + (MILESTONES[count] ?? 0)
        set({ streak: { count, lastPlayed: today }, coins: s.coins + coinsGained })
      },

      toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),

      setQuality: (q) => set({ quality: q }),

      markPrimerSeen: () => set({ seenPrimer: true }),

      resetProgress: () => set({ ...initial, owned: [...initial.owned], equipped: { ...initial.equipped } }),
    }),
    {
      // The persisted save key. Pre-rebrand saves lived under 'vimersion-save';
      // adoptLegacySave() above copies them to this key on first load so no
      // progress is lost. See that helper for the one-time migration.
      name: 'vimlegends-save',
      version: 16,
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>
        const pe = (p.equipped ?? {}) as Record<string, unknown>
        const merged = {
          ...initial,
          ...p,
          // `...initial.owned` backfills the free default aura (and theme/bg) into
          // every legacy save (v11: auras became Shop purchases; v13: also the free
          // robot character sku; v14: the free finish + palette skus).
          owned: Array.from(new Set([...((p.owned as string[]) ?? []), ...initial.owned])),
          // v10: `equipped.avatar` was removed — keep only theme + background.
          equipped: {
            theme: typeof pe.theme === 'string' ? pe.theme : initial.equipped.theme,
            background: typeof pe.background === 'string' ? pe.background : initial.equipped.background,
          },
          // Hero customization: coerce the old {primary,secondary,effect} (pre-v10)
          // or the new shape to the canonical HeroCustom.
          hero: normalizeHero(p.hero),
        } as Persisted
        // v4: default became the side-scrolling "Pixel Kingdom". Move anyone still on
        // an older default onto it (their old background stays owned, so they can
        // re-equip it for free from the Shop if they prefer).
        if (version < 4 && LEGACY_DEFAULT_BACKGROUNDS.includes(merged.equipped.background)) {
          merged.equipped.background = DEFAULTS.background
        }
        // v5: added `quality` ('auto' | 'webgl' | 'lite') — the `...initial` spread
        // above already backfills it to 'auto' for older saves. The default theme
        // also became 'nightglass'; move anyone still on an old default theme onto
        // it (old themes are free in the Shop, so nothing is lost).
        if (version < 5 && LEGACY_DEFAULT_THEMES.includes(merged.equipped.theme)) {
          merged.equipped.theme = DEFAULTS.theme
        }
        // v7: the "Pixel Kingdom" (platform) background was removed.
        // v10: the fixed-avatar roster + block cursor were removed in favor of the
        // single customizable Hero. Drop 'platform' and all old avatar ids from
        // `owned`, and repair any now-unknown equipped background.
        merged.owned = merged.owned.filter(
          (id) =>
            id !== 'platform' &&
            !LEGACY_AVATAR_IDS.includes(id) &&
            // v16: the procedural aura/palette customizer was removed; drop its skus.
            !id.startsWith('aura:') &&
            !id.startsWith('palette:'),
        )
        if (!COSMETIC_BY_ID[merged.equipped.background]) {
          merged.equipped.background = DEFAULTS.background
        }
        // v9: default background reverted to 'crt' (CRT Scanlines). Move anyone
        // still on the previous default ('synthwave', the v8 default) onto it —
        // same pattern as past default changes. 'synthwave' stays free in the
        // Shop to re-equip.
        if (version < 9 && merged.equipped.background === 'synthwave') {
          merged.equipped.background = DEFAULTS.background
        }
        // v12: the first-run primer moved from Home to the first campaign level.
        // Existing players have already used the app, so don't nag them — mark it
        // seen for every migrating save. Only brand-new saves (which never run
        // migrate) keep seenPrimer=false and get the auto-open.
        if (version < 12) merged.seenPrimer = true
        // v13: selectable 3D characters. The `...initial.owned` backfill above grants
        // the free robot sku; normalizeHero(p.hero) defaults hero.character to 'robot'.
        // Paid characters still cost coins — nothing else to grant.
        // v14: body finishes + color palettes. normalizeHero backfills finish:'matte';
        // the `...initial.owned` union grants the free finish + palette skus. Paid
        // finishes/palettes still cost coins. No id renames → save-safe.
        // v15: the character roster was replaced with the Quaternius operative squad
        // (astronaut/swat/agent/soldier/engineer) and the procedural accessory/aura +
        // per-zone recolor were removed. normalizeHero coerces any old hero.character
        // (robot/brute/…) to the free 'astronaut'; the `...initial.owned` union grants
        // char:astronaut.
        // v16: the dead accessory/visor/aura/palette customizer was pruned entirely.
        // normalizeHero now returns just { finish, character }; the owned filter above
        // drops any lingering aura:/palette: skus. No id renames → save-safe.
        return merged
      },
      partialize: (s): Persisted => ({
        xp: s.xp,
        coins: s.coins,
        completed: s.completed,
        mastery: s.mastery,
        streak: s.streak,
        soundOn: s.soundOn,
        arcadeBest: s.arcadeBest,
        quizBest: s.quizBest,
        owned: s.owned,
        equipped: s.equipped,
        hero: s.hero,
        quality: s.quality,
        seenPrimer: s.seenPrimer,
      }),
    },
  ),
)
