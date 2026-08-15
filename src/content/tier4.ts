import type { Challenge } from '../game/types'
import { allOf, bufferEquals, cursorLine, markSet } from '../game/verify'

/**
 * Tier 4 — "Seeker". Search, substitution and marks: moving by MEANING
 * instead of by distance. Scenarios: server logs, configs, version strings.
 *
 * Pars are optimal keydown counts (every dialog character counts — the
 * ex/search panel lives inside the editor, see authoring notes in tiers.ts),
 * each proven by a reference solution in tests/par.test.ts.
 */
export const tier4: Challenge[] = [
  {
    id: 't4-searchlight',
    tier: 4,
    title: 'Searchlight',
    brief: 'Eight lines of log, one ERROR. Find it with `/ERROR` and delete it.',
    taughtCommands: ['search', 'dd'],
    startText: [
      '[08:00:01] INFO boot sequence start',
      '[08:00:02] INFO loading modules',
      '[08:00:04] INFO cache warmed',
      '[08:00:05] INFO listening on :8080',
      '[08:00:07] ERROR disk quota exceeded',
      '[08:00:08] INFO heartbeat ok',
      '[08:00:09] INFO heartbeat ok',
      '[08:00:11] INFO metrics flushed',
    ].join('\n'),
    goal: {
      targetText: [
        '[08:00:01] INFO boot sequence start',
        '[08:00:02] INFO loading modules',
        '[08:00:04] INFO cache warmed',
        '[08:00:05] INFO listening on :8080',
        '[08:00:08] INFO heartbeat ok',
        '[08:00:09] INFO heartbeat ok',
        '[08:00:11] INFO metrics flushed',
      ].join('\n'),
      describe: 'The ERROR line is gone',
    },
    par: 9, // /ERROR<CR> dd — beats seven j's and scales to any file size
    hint: '`/` starts a search: type ERROR, press `Enter`, and the cursor lands on the match. Then `dd`. Never scroll for something you can name.',
  },
  {
    id: 't4-third-strike',
    tier: 4,
    title: 'Third Strike',
    brief: 'Only the THIRD WARN is mislabeled. Search `/WARN`, hop with `n` `n`, fix it with `ciw`.',
    taughtCommands: ['search', 'n', 'iw'],
    startText: [
      '[a] WARN retry scheduled',
      '[b] status ok',
      '[c] WARN retry scheduled',
      '[d] status ok',
      '[e] WARN false alarm, actually fine',
      '[f] status ok',
    ].join('\n'),
    goal: {
      targetText: [
        '[a] WARN retry scheduled',
        '[b] status ok',
        '[c] WARN retry scheduled',
        '[d] status ok',
        '[e] INFO false alarm, actually fine',
        '[f] status ok',
      ].join('\n'),
      describe: 'Line [e] reads INFO, the others keep WARN',
    },
    par: 16, // /WARN<CR> n n ciwINFO<Esc>
    hint: 'After a search, `n` jumps to the NEXT match (`N` goes back). Two hops from the first WARN puts you on the third — then `ciw`.',
  },
  {
    id: 't4-question',
    tier: 4,
    title: 'Look Behind',
    brief: "You're at the bottom of the file. The leaked secret is somewhere ABOVE — find it with `?sec` and delete the line.",
    taughtCommands: ['search-back', 'dd'],
    startText: ['db_host = localhost', 'secret = hunter2', 'retries = 3', 'timeout = 30', 'log_level = info'].join(
      '\n',
    ),
    startCursor: { line: 5, ch: 0 },
    goal: {
      targetText: ['db_host = localhost', 'retries = 3', 'timeout = 30', 'log_level = info'].join('\n'),
      describe: 'The secret line is gone',
    },
    par: 8, // ?sec<CR> dd
    hint: '`?` is `/` in reverse — it searches UP from the cursor. A short unique fragment like "sec" is enough. Then `dd`.',
  },
  {
    id: 't4-star-player',
    tier: 4,
    title: 'Star Player',
    brief: 'Cursor is on tmp in the comment. Press `*` to jump straight to its use in the code, then rename it to `rows` with `ciw`.',
    taughtCommands: ['star', 'iw'],
    startText: ['# tmp holds the parsed rows', 'result = transform(tmp)'].join('\n'),
    startCursor: { line: 1, ch: 2 }, // on "tmp" in the comment
    goal: {
      targetText: ['# tmp holds the parsed rows', 'result = transform(rows)'].join('\n'),
      describe: 'The code says transform(rows); the comment is left as history',
    },
    par: 9, // * ciwrows <Esc>
    hint: '`*` searches for the exact word under the cursor — no typing the query at all. One press lands you on the next tmp. Type `rows`, then `Esc`.',
  },
  {
    id: 't4-slice-args',
    tier: 4,
    title: 'First Course',
    brief: 'Remove the first argument (admin plus its comma) with `df,` then eat the space with `x`.',
    taughtCommands: ['till', 'f'],
    startText: 'login(admin, user, token)',
    startCursor: { line: 1, ch: 6 }, // on the 'a' of admin
    goal: { targetText: 'login(user, token)', describe: 'Buffer reads: login(user, token)' },
    par: 4, // df, x
    hint: '`df,` deletes THROUGH the comma (`f` includes the target). Its sibling `dt,` would stop just BEFORE it — know both.',
  },
  {
    id: 't4-repeat-find',
    tier: 4,
    title: 'Version Snip',
    brief: 'Cut "1.0.0.beta.7" down to "1.0.0": `f.` to the first dot, `;` `;` to repeat the find, then `dt"` to trim.',
    taughtCommands: ['semicolon', 'till', 'f'],
    startText: 'version = "1.0.0.beta.7"',
    goal: { targetText: 'version = "1.0.0"', describe: 'The version is bare 1.0.0 (quotes intact)' },
    par: 7, // f. ; ; dt"
    hint: '`;` repeats your last `f`/`t` find — never retype `f.` three times. From the third dot, `dt"` deletes up to (not including) the closing quote.',
  },
  {
    id: 't4-percent',
    tier: 4,
    title: 'Bracket Bounce',
    brief: 'A stray semicolon hides after the closing brace. Bounce there with `%` and `x` it.',
    taughtCommands: ['percent'],
    startText: ['if (ready) {', '  launch();', '};'].join('\n'),
    startCursor: { line: 1, ch: 11 }, // on the {
    goal: {
      targetText: ['if (ready) {', '  launch();', '}'].join('\n'),
      describe: 'The } has no trailing semicolon',
    },
    par: 3, // % l x
    hint: '`%` jumps between matching (), [] and {} — even across lines. From the opening brace, one press puts you on its partner.',
  },
  {
    id: 't4-sub-line',
    tier: 4,
    title: 'Spot Weld',
    brief: 'Fix Flase on THIS line only with `:s/Flase/False` — plain `:s` never touches other lines.',
    taughtCommands: ['sub'],
    startText: ['msg_a = "Flase positive"', 'msg_b = "Flase positive"'].join('\n'),
    goal: {
      targetText: ['msg_a = "False positive"', 'msg_b = "Flase positive"'].join('\n'),
      describe: 'Line 1 fixed; line 2 deliberately untouched',
    },
    par: 15, // :s/Flase/False<CR>
    hint: '`:s/old/new/` substitutes on the cursor line only. (Ranges like `:%s` reach further — next lesson.)',
  },
  {
    id: 't4-sub-global',
    tier: 4,
    title: 'Anglophile',
    brief: 'Six colours, one command: rename every colour to color with `:%s/colour/color/g`.',
    taughtCommands: ['sub-all'],
    startText: [
      'colour_primary = "#7c6bff"',
      'colour_accent = "#4cc9f0"',
      'text_colour = ink',
      'border_colour = colour_primary',
      '# colour palette v2',
    ].join('\n'),
    goal: {
      targetText: [
        'color_primary = "#7c6bff"',
        'color_accent = "#4cc9f0"',
        'text_color = ink',
        'border_color = color_primary',
        '# color palette v2',
      ].join('\n'),
      describe: 'All six occurrences read color',
    },
    par: 19, // :%s/colour/color/g<CR>
    hint: '`%` as a range means the whole file; the `/g` flag means every match on each line. Together: one command, six fixes.',
  },
  {
    id: 't4-sub-confirm',
    tier: 4,
    title: 'Sniper Sub',
    brief: 'Rename the count VARIABLE to `total` — but the strings must keep saying count. Add the `c` flag and answer `y`/`n` per match.',
    taughtCommands: ['sub-confirm'],
    startText: ['count = 0', 'print("count so far:", count)', 'log("final count")', 'count += 1'].join('\n'),
    goal: {
      targetText: ['total = 0', 'print("count so far:", total)', 'log("final count")', 'total += 1'].join('\n'),
      describe: 'Variables renamed; the two in-string counts survive',
    },
    par: 24, // :%s/count/total/gc<CR> then y n y n y
    hint: 'Run `:%s/count/total/gc` — the `c` flag makes `:s` pause on every match: `y` replaces, `n` skips (`a` = all the rest, `q` = quit). Surgical mass-edit.',
  },
  {
    id: 't4-marks',
    tier: 4,
    title: 'X Marks the Spot',
    brief: 'Drop mark a on the FIXME (`ma`), go fix the TODO at the top (`gg`, `dd`), then snap back with `{backtick}a`.',
    taughtCommands: ['marks', 'gg', 'dd'],
    startText: [
      '# TODO: rename this file',
      'config = load("app.yaml")',
      'flags = parse(config)',
      '# FIXME: flags ignore env overrides',
      'apply(flags)',
    ].join('\n'),
    startCursor: { line: 4, ch: 2 }, // on the FIXME
    goal: {
      predicate: allOf(
        bufferEquals(
          [
            'config = load("app.yaml")',
            'flags = parse(config)',
            '# FIXME: flags ignore env overrides',
            'apply(flags)',
          ].join('\n'),
        ),
        markSet('a'),
        cursorLine(3),
      ),
      describe: 'TODO line gone · mark a set · cursor back on the FIXME',
    },
    par: 8, // ma gg dd `a
    hint: '`ma` bookmarks this spot. After editing elsewhere, `{backtick}a` (backtick-a) teleports you back — the mark even survives the lines shifting.',
  },
]
