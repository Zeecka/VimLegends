import type { Challenge } from '../game/types'

type CMView = import('@codemirror/view').EditorView

function charUnderCursor(view: CMView): string {
  const pos = view.state.selection.main.head
  return view.state.doc.sliceString(pos, pos + 1)
}
function headAt(view: CMView, pos: number): boolean {
  return view.state.selection.main.head === pos
}

/**
 * Tier 2 — "Comfortable". Word motions (w/b/e), line motions (0/$), file jumps
 * (gg/G), find-char (f), and the first operator+motion combo (cw). Goals use
 * position predicates so a lazy line-jump (0/$) can't shortcut a word-motion lesson.
 */
export const tier2: Challenge[] = [
  {
    id: 't2-word-leap',
    tier: 2,
    title: 'Word Leap',
    brief: 'Hop across words with `w` to land on the E.',
    taughtCommands: ['w'],
    startText: 'a b c d E f g',
    startCursor: { line: 1, ch: 0 },
    goal: { predicate: (v) => charUnderCursor(v) === 'E', describe: 'Cursor sits on the E' },
    par: 4,
    hint: '`w` jumps to the start of the next word. Four hops from a → E.',
  },
  {
    id: 't2-end-word',
    tier: 2,
    title: 'Word’s End',
    brief: 'Use `e` to land on the last letter of "biggest".',
    taughtCommands: ['e'],
    startText: 'biggest word wins',
    startCursor: { line: 1, ch: 0 },
    goal: { predicate: (v) => headAt(v, 6), describe: 'Cursor on the final t of biggest' },
    par: 1,
    hint: '`e` jumps to the END of the current word — one press lands on the t.',
  },
  {
    id: 't2-back-word',
    tier: 2,
    title: 'Backtrack',
    brief: 'Jump backwards with `b` to the start of "three".',
    taughtCommands: ['b'],
    startText: 'one two three four',
    startCursor: { line: 1, ch: 17 }, // on the last letter of "four"
    goal: { predicate: (v) => headAt(v, 8), describe: 'Cursor on the t of three' },
    par: 2,
    hint: '`b` jumps back to the start of the previous word. Two hops: four → three.',
  },
  {
    id: 't2-line-ends',
    tier: 2,
    title: 'Trim the Ends',
    brief: 'Delete the leading X and trailing Y. Use `0`, `$` and `x`.',
    taughtCommands: ['0', '$'],
    startText: 'Xhello worldY',
    startCursor: { line: 1, ch: 6 },
    goal: { targetText: 'hello world', describe: 'Buffer reads: hello world' },
    par: 4,
    hint: '`0` jumps to the start of the line, `$` to the end. Delete each junk letter with `x`.',
  },
  {
    id: 't2-find-char',
    tier: 2,
    title: 'Seek & Destroy',
    brief: 'Delete the stray semicolon. Use `f` to find it.',
    taughtCommands: ['f'],
    startText: 'find the semicolon; and stop',
    startCursor: { line: 1, ch: 0 },
    goal: { targetText: 'find the semicolon and stop', describe: 'The semicolon is gone' },
    par: 3,
    hint: '`f{char}` jumps to the next occurrence of a character. Try `f;` then `x`.',
  },
  {
    id: 't2-change-word',
    tier: 2,
    title: 'Typo Fixer',
    brief: 'Fix the typo: change "teh" to `the`. Use `w` and `cw`.',
    taughtCommands: ['cw', 'w'],
    startText: 'fix teh typo',
    startCursor: { line: 1, ch: 0 },
    goal: { targetText: 'fix the typo', describe: 'Buffer reads: fix the typo' },
    par: 7,
    hint: 'Hop to teh with `w`, then `cw` deletes the word and drops you into insert. Type `the`, `Esc`.',
  },
  {
    id: 't2-file-ends',
    tier: 2,
    title: 'Top and Tail',
    brief: 'Delete the top and bottom lines. Use `gg`, `G` and `dd`.',
    taughtCommands: ['gg', 'G', 'dd'],
    startText: ['DELETE TOP', 'keep one', 'keep two', 'keep three', 'DELETE BOTTOM'].join('\n'),
    startCursor: { line: 3, ch: 0 },
    goal: {
      targetText: ['keep one', 'keep two', 'keep three'].join('\n'),
      describe: 'Only the three keep-lines remain',
    },
    par: 7,
    hint: '`gg` jumps to the top line, `G` to the bottom. `dd` deletes a line.',
  },
  {
    id: 't2-open-above',
    tier: 2,
    title: 'Prepend',
    brief: 'This module is missing its import. Open a line ABOVE with `O` and type `import sys`.',
    taughtCommands: ['O'],
    startText: 'def main():',
    goal: { targetText: ['import sys', 'def main():'].join('\n'), describe: 'An "import sys" line sits above def main()' },
    par: 12, // Oimport sys<Esc>
    hint: '`o` opens a line BELOW the cursor; its capital, `O`, opens one ABOVE — and drops you into insert mode there. Type `import sys`, then `Esc`.',
  },
  {
    id: 't2-capstone',
    tier: 2,
    title: 'Quick Refactor',
    brief: 'Change "cat" to `dog`, then delete the REMOVE ME line.',
    taughtCommands: ['w', 'cw', 'dd'],
    startText: ['the cat sat', 'REMOVE ME'].join('\n'),
    startCursor: { line: 1, ch: 0 },
    goal: { targetText: 'the dog sat', describe: 'Buffer reads: the dog sat' },
    par: 10,
    hint: '`w` to cat, `cw` → type `dog` → `Esc`. Then `j` down to the junk line and `dd`.',
  },
]
