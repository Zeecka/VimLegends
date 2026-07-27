import type { Challenge } from '../game/types'

/**
 * Tier 3 — "Faster". The Vim grammar epiphany: operators × motions × text
 * objects, plus the three visual modes. Scenarios are small, real-feeling
 * code edits, never abstract puzzles.
 *
 * Pars are optimal keydown counts (see authoring notes in tiers.ts) and every
 * one is proven by a reference solution in tests/par.test.ts.
 */
export const tier3: Challenge[] = [
  {
    id: 't3-cut-word',
    tier: 3,
    title: 'Double Take',
    brief: 'Someone awaited twice. Delete one await with `dw`.',
    taughtCommands: ['d-motion'],
    startText: 'const data = await await fetchUsers()',
    startCursor: { line: 1, ch: 13 }, // on the first "await"
    goal: { targetText: 'const data = await fetchUsers()', describe: 'Only one await remains' },
    par: 2,
    hint: '`dw` = delete + word motion. From the start of a word it eats the word AND the space after it.',
  },
  {
    id: 't3-shear',
    tier: 3,
    title: 'Shear the Tail',
    brief: 'Cut the noise after the semicolon: jump with `f;` then delete to line end with `D`.',
    taughtCommands: ['D', 'f'],
    startText: 'return total; // TODO tmp hack???',
    goal: { targetText: 'return total;', describe: 'Line ends at the semicolon' },
    par: 4, // f; l D
    hint: '`f;` jumps onto the semicolon, `l` steps one right, and `D` (shift-d) deletes from the cursor to the end of the line.',
  },
  {
    id: 't3-ciw',
    tier: 3,
    title: 'Inside Job',
    brief: 'Rename cnt to `count` — your cursor is already INSIDE the word. Use `ciw`.',
    taughtCommands: ['iw', 'c-motion'],
    startText: 'let cnt = items.length',
    startCursor: { line: 1, ch: 5 }, // mid-word, on the 'n' of cnt
    goal: { targetText: 'let count = items.length', describe: 'Buffer reads: let count = items.length' },
    par: 9, // ciw (3) + "count" (5) + Esc (1); the match lands on the final 't'
    hint: '`ciw` = change inner word — it works from ANYWHERE inside the word, no need to move to its start. Type `count`, then `Esc`.',
  },
  {
    id: 't3-ci-paren',
    tier: 3,
    title: 'Parenthetical',
    brief: 'Nobody wants a 99999ms sleep. Jump to the paren with `f(` and rewrite the inside with `ci(`.',
    taughtCommands: ['i(', 'f'],
    startText: 'await sleep(99999)',
    goal: { targetText: 'await sleep(250)', describe: 'Buffer reads: await sleep(250)' },
    par: 9, // f( (2) ci( (3) 250 (3) + Esc
    hint: '`ci(` changes everything INSIDE the parentheses — but the cursor must be on or inside them, so `f(` first. Type `250`, then `Esc`.',
  },
  {
    id: 't3-ci-quote',
    tier: 3,
    title: 'String Theory',
    brief: 'Fix the greeting: change "hola" to `hello` with `ci"`.',
    taughtCommands: ['i"', 'c-motion'],
    startText: 'console.log("hola", user.name)',
    goal: { targetText: 'console.log("hello", user.name)', describe: 'Buffer reads: console.log("hello", …)' },
    par: 9, // ci" (3) hello (5) + Esc — quotes are found FORWARD on the line
    hint: '`ci"` changes inside the next quotes on the line — you don\'t even need to move the cursor first. Type `hello`, then `Esc`.',
  },
  {
    id: 't3-daw',
    tier: 3,
    title: 'Word Surgeon',
    brief: 'Delete the duplicated the cleanly with `daw` — no leftover double space.',
    taughtCommands: ['aw'],
    startText: 'the quick brown fox jumps over the the lazy dot',
    startCursor: { line: 1, ch: 36 }, // inside the second "the"
    goal: {
      targetText: 'the quick brown fox jumps over the lazy dot',
      describe: 'One "the" gone, single spaces everywhere',
    },
    par: 3,
    hint: '`daw` = delete A word — the word PLUS its trailing space. (`diw` would leave an ugly double space behind.)',
  },
  {
    id: 't3-counts',
    tier: 3,
    title: 'Triple Threat',
    brief: 'Three junk words, one command: delete them all with `d3w`.',
    taughtCommands: ['count', 'd-motion'],
    startText: 'const result = TODO FIXME LATER computeTotal()',
    startCursor: { line: 1, ch: 15 }, // on TODO
    goal: { targetText: 'const result = computeTotal()', describe: 'The three junk words are gone' },
    par: 3,
    hint: 'Counts multiply anything: `d3w` = delete three words. (`dw` `dw` `dw` works too — but costs twice the keystrokes.)',
  },
  {
    id: 't3-dupe-line',
    tier: 3,
    title: 'Copy That',
    brief: 'Expose port 443 too: duplicate the port line with `yy` then `p`.',
    taughtCommands: ['y-motion', 'p'],
    startText: ['ports:', '  - "8080:80"'].join('\n'),
    startCursor: { line: 2, ch: 0 },
    goal: {
      targetText: ['ports:', '  - "8080:80"', '  - "8080:80"'].join('\n'),
      describe: 'The port line appears twice',
    },
    par: 3,
    hint: '`yy` yanks (copies) the whole line, `p` pastes it below the cursor. Copy-paste without ever touching Ctrl.',
  },
  {
    id: 't3-transplant',
    tier: 3,
    title: 'Organ Donor',
    brief: 'Give limit the same value: yank 3000 with `yiw`, then paste OVER the TODO with `viwp`.',
    taughtCommands: ['y-motion', 'iw', 'v', 'p'],
    startText: ['retries = 3000', 'limit = TODO'].join('\n'),
    startCursor: { line: 1, ch: 10 }, // on 3000
    goal: {
      targetText: ['retries = 3000', 'limit = 3000'].join('\n'),
      describe: 'Both lines end in 3000',
    },
    par: 9, // yiw j $ viwp
    hint: '`yiw` yanks the word under the cursor. On the target word: `viw` selects it, `p` pastes right over the selection.',
  },
  {
    id: 't3-visual-snip',
    tier: 3,
    title: 'Freehand',
    brief: 'Select the [skip ci] tag with `v` + `f]` (grab the space too with `l`), then delete it.',
    taughtCommands: ['v', 'f'],
    startText: 'deploy [skip ci] now',
    startCursor: { line: 1, ch: 7 }, // on the [
    goal: { targetText: 'deploy now', describe: 'Buffer reads: deploy now' },
    par: 5, // v f] l x
    hint: '`v` starts a character selection that GROWS with every motion: `f]` stretches it to the bracket, `l` one more for the space, `x` deletes the selection.',
  },
  {
    id: 't3-visual-line',
    tier: 3,
    title: 'Line Item Veto',
    brief: 'Delete the three commented-out steps in one stroke: `V`, stretch with `jj`, then `d`.',
    taughtCommands: ['V'],
    startText: [
      'run_migrations()',
      '// legacy_step_one()',
      '// legacy_step_two()',
      '// legacy_step_three()',
      'start_server()',
    ].join('\n'),
    startCursor: { line: 2, ch: 0 },
    goal: {
      targetText: ['run_migrations()', 'start_server()'].join('\n'),
      describe: 'Only the two live calls remain',
    },
    par: 4, // V j j d
    hint: '`V` (shift-v) selects whole LINES. `j` `j` stretches the selection down, `d` deletes it. (`3dd` works too!)',
  },
  {
    id: 't3-visual-block',
    tier: 3,
    title: 'Column Cutter',
    brief: 'Strip the "> " quote prefix from all four lines at once with `Ctrl-v`.',
    taughtCommands: ['ctrl-v'],
    startText: ['> vim is a language', '> operators act on motions', '> practice daily', '> escape is your friend'].join(
      '\n',
    ),
    startCursor: { line: 1, ch: 0 },
    goal: {
      targetText: ['vim is a language', 'operators act on motions', 'practice daily', 'escape is your friend'].join(
        '\n',
      ),
      describe: 'No more "> " prefixes',
    },
    par: 6, // Ctrl-v j j j l x
    hint: '`Ctrl-v` starts a rectangular BLOCK selection: `jjj` takes it down all four lines, `l` widens it to two columns, `x` cuts the whole block out.',
  },
  {
    id: 't3-tag-change',
    tier: 3,
    title: 'Tag Team',
    brief: 'Fix the heading typo with `cit` — from anywhere inside the <h1> element.',
    taughtCommands: ['it', 'c-motion'],
    lang: 'html',
    startText: ['<section>', '  <h1>Wellcome</h1>', '  <p>Learn Vim by playing.</p>', '</section>'].join('\n'),
    startCursor: { line: 2, ch: 8 }, // mid-word inside the heading text
    goal: {
      targetText: ['<section>', '  <h1>Welcome</h1>', '  <p>Learn Vim by playing.</p>', '</section>'].join('\n'),
      describe: 'The heading reads: Welcome',
    },
    par: 11, // cit (3) + Welcome (7) + Esc (1)
    hint: '`cit` = change inner tag — it empties everything between <h1> and </h1>, wherever your cursor is inside the element. Type `Welcome`, then `Esc`.',
  },
  {
    id: 't3-change-tail',
    tier: 3,
    title: 'Rewrite the Tail',
    brief: 'The log level is wrong. From the value, `C` wipes to the end of the line so you can retype it.',
    taughtCommands: ['C'],
    startText: 'log.level = verbose',
    startCursor: { line: 1, ch: 12 }, // on the 'v' of verbose
    goal: { targetText: 'log.level = info', describe: 'The level reads info' },
    par: 6, // Cinfo<Esc>
    hint: '`C` is `D`’s changing cousin: it deletes from the cursor to the end of the line AND drops you into insert. Type `info`, then `Esc`.',
  },
  {
    id: 't3-bracket',
    tier: 3,
    title: 'Inside the Brackets',
    brief: 'Collapse the whole list to one value. `ci[` changes everything between [ and ] — just like `ci(` and `ci"`.',
    taughtCommands: ['i[', 'c-motion'],
    startText: 'colors = [red, green, blue]',
    startCursor: { line: 1, ch: 10 }, // inside the brackets
    goal: { targetText: 'colors = [mono]', describe: 'The brackets hold just: mono' },
    par: 8, // ci[mono<Esc>
    hint: 'The [ ] pair is a text object too. `ci[` (or `ci]`) empties it wherever you are inside. Type `mono`, then `Esc`.',
  },
  {
    id: 't3-transpose',
    tier: 3,
    title: 'Fat Finger',
    brief: 'A classic typo: the i and e are swapped. Fix "recieve" with the two-key transpose `xp`.',
    taughtCommands: ['x', 'p'],
    startText: 'recieve the goods',
    startCursor: { line: 1, ch: 3 }, // on the misplaced 'i'
    goal: { targetText: 'receive the goods', describe: 'It reads receive' },
    par: 2, // xp
    hint: '`x` deletes the character (holding it), and `p` drops it back down AFTER the next one — so `xp` swaps two neighbours. The muscle-memory fix for transposed letters.',
  },
  {
    id: 't3-indent',
    tier: 3,
    title: 'Step In',
    brief: 'The function body sits flush left. Indent both statements one level with `>` over a motion.',
    taughtCommands: ['indent'],
    startText: ['def totals():', 'sum = a + b', 'return sum'].join('\n'),
    startCursor: { line: 2, ch: 0 }, // on the first body line
    goal: {
      targetText: ['def totals():', '  sum = a + b', '  return sum'].join('\n'),
      describe: 'Both body lines are indented under def',
    },
    par: 2, // >j
    hint: '`>>` indents the current line; `>{motion}` indents a range. `>j` indents this line and the one below. (Its mirror, `<<`, dedents.)',
  },
]
