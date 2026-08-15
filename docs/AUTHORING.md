# ✍️ Authoring challenges

Everything you need to add levels, bosses, and whole worlds. Challenges are **pure data**
(`src/content/tierN.ts`) — no UI work required.

## 🧬 Anatomy of a challenge

```ts
{
  id: 't4-percent',                    // ⚠️ immutable once shipped (saves key on it)
  tier: 4,                             // which world it belongs to
  title: 'Bracket Bounce',
  brief: 'A stray semicolon hides after the closing brace. Bounce there with % and x it.',
  taughtCommands: ['percent'],         // ids from src/game/commands.ts → mastery + belt
  startText: ['if (ready) {', '  launch();', '};'].join('\n'),
  startCursor: { line: 1, ch: 11 },    // 1-based line, 0-based column (optional)
  goal: {
    targetText: ['if (ready) {', '  launch();', '}'].join('\n'),
    describe: 'The } has no trailing semicolon',   // shown in the HUD
  },
  par: 3,                              // ⭐⭐⭐ threshold — must be PROVEN (see below)
  hint: '% jumps between matching (), [] and {} — even across lines.',
  lang: 'html',                        // optional: syntax tree for it/at tag objects
}
```

### Copy conventions (brief / hint / describe)

Wrap the keys the player presses in backticks — `KeyedText` (src/ui/atoms.tsx) renders
every backtick-quoted span as a keycap. Two special spellings:

- **Adjacent keycaps** chain with back-to-back spans: `` `j``.` `` renders the j and .
  keycaps side by side.
- **The backtick key itself** can't be spelled with the delimiter — write `{backtick}`
  inside the span: `` `{backtick}a` `` renders one keycap reading `` `a `` (vim's mark jump).

`tests/content.test.ts` fails on unbalanced backticks in any brief/hint/describe or
locale string, so a broken span can't ship.

## 🎯 Two kinds of goals

**1 · Exact text** — `goal.targetText`. Simple, self-verifying: the wrong method usually
produces the wrong buffer.

**2 · Vim-state predicates** — compose checkers from `src/game/verify.ts`:

| Checker | Verifies |
|---|---|
| `bufferEquals(text)` / `bufferMatches(re)` / `lineCount(n)` | buffer content |
| `cursorAt(line, ch)` / `cursorLine(line)` / `charUnder(c)` | cursor position |
| `registerEquals(name, text, {linewise})` / `registerNonEmpty(name)` | register contents |
| `markSet(name)` / `markAt(name, line)` | marks |
| `inMode('visual' \| 'visualBlock' \| …)` | current mode |
| `recordedMacro(reg)` | a macro exists in a register |
| `allOf(…)` / `anyOf(…)` / `not(…)` | combinators |

```ts
goal: {
  predicate: allOf(bufferEquals(fixed), markSet('a'), cursorLine(3)),
  describe: 'TODO gone · mark a set · cursor back on the FIXME',
}
```

State checks re-run after every completed vim command (`vim-command-done`), so goals
about registers/marks/macros trigger even when the buffer never changes.

## 🧮 Par math — the three rules

> [!IMPORTANT]
> 1. **Par = optimal raw keydown count.** Every non-modifier keydown counts: `Esc`,
>    `Enter`, every character typed into the `/` or `:` panel. OS key auto-repeat counts
>    per repeat (holding `j` is exactly what we teach players *not* to do).
> 2. **Exact-text goals win early.** The buffer matches while you're *still in insert
>    mode* — the closing `Esc` never lands. Budget the par as if `Esc` **is** pressed;
>    the proven optimal will come in one below it. Players who Esc still hit par.
> 3. **Stars:** ≤ par → ⭐⭐⭐ · ≤ 1.75 × par → ⭐⭐ · else ⭐.

## 👾 Bosses

A boss is a challenge with extra fields — stages fight in the **same buffer**, no editor
remount, and the goals **ratchet** (undo can't rewind a cleared stage):

```ts
{
  id: 'boss-grepgut',
  kind: 'boss',
  goal:   { … },                        // stage 1
  stages: [ { brief, goal }, … ],       // stages 2..n
  par: 36,
  keystrokeBudget: 80,                  // the HP bar ≈ ceil(par · 2.2)
  …
}
```

Budget just past `1.75 × par` means any win earns ≥ ⭐, but ⭐⭐⭐ demands real economy.
Failing shows a zero-penalty retry overlay — never gate progress behind a boss
(`tierUnlocked` already excludes them).

## 🔒 Prove the par — mandatory

Add a **reference solution** to `SOLUTIONS` in `tests/par.test.ts`. It is driven through
the real vim keymap and must solve the challenge at ≤ par:

```ts
't4-sub-confirm': ':%s/count/total/gc<CR>ynyny',
```

| Notation | Meaning |
|---|---|
| plain chars | one keydown each (incl. inside `/` and `:` panels) |
| `<CR>` `<Esc>` | Enter / Escape |
| `<C-v>` `<C-r>` | Ctrl-chords |

The driver handles normal mode (`Vim.handleKey`), insert mode (literal typing), **and
the vim dialogs** — search, ex commands, and the interactive `:s///c` confirm all work.

## 🗺️ Wiring a new world

1. Challenges → `src/content/tierN.ts`; boss → `src/content/bosses.ts`
2. Register in `src/content/tiers.ts`: `WORLDS` metadata + spread into `CHALLENGES`
   (boss goes *after* its tier's spread)
3. New command ids → `src/game/commands.ts` (they appear in the Command Belt **and the
   downloadable cheatsheet** by category — `commands.ts` is the single source of truth for both)
4. Reference solutions → `tests/par.test.ts`

## ✅ Ship checklist

- [ ] Every `taughtCommands` id exists in the catalog (`npm run test` enforces)
- [ ] Reference solution proves par (`npm run test`)
- [ ] `npm run typecheck` green
- [ ] Play it by hand — pars feel fair, hint teaches the *why*
- [ ] Tag-object levels set `lang: 'html'` (without it, `it`/`at` are silent no-ops)

## 🕳️ Known traps

> [!WARNING]
> - **Never `.click()` the editor in Playwright tests** — it moves the vim cursor and
>   invalidates `startCursor`. The editor auto-focuses on mount; just type.
> - `ci(` from *before* the parens is undefined in vanilla vim — frame it with `f(`.
>   (`ci"` does seek forward on the line; parens don't.)
> - `daw` eats the trailing space; `diw` leaves a double space. Pick per lesson.
> - The `"+` clipboard register is async/permission-gated — never a scored goal.
> - These absent features must never appear in a challenge: surround (`ys/cs/ds`),
>   commentary (`gc`), folds, `:move`/`:copy`/`:put`, `:q`/`:wq`, insert completion,
>   `g_`, the `*` register, and nearly all `:set` options.
