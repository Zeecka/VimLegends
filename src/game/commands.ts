import type { Tier } from './types'

/** A Vim command the game teaches. Powers the "command belt" and mastery display. */
export interface VimCommand {
  id: string
  keys: string
  label: string
  tier: Tier
  category: string
}

/**
 * Catalog of commands, grouped by the tier that introduces them. This is the
 * canonical curriculum spine — challenges credit `taughtCommands` by `id`.
 */
export const COMMANDS: VimCommand[] = [
  // Tier 1 — Survive
  { id: 'i', keys: 'i', label: 'insert before cursor', tier: 1, category: 'modes' },
  { id: 'esc', keys: 'Esc', label: 'back to normal mode', tier: 1, category: 'modes' },
  { id: 'h', keys: 'h', label: 'move left', tier: 1, category: 'motion' },
  { id: 'j', keys: 'j', label: 'move down', tier: 1, category: 'motion' },
  { id: 'k', keys: 'k', label: 'move up', tier: 1, category: 'motion' },
  { id: 'l', keys: 'l', label: 'move right', tier: 1, category: 'motion' },
  { id: 'x', keys: 'x', label: 'delete char', tier: 1, category: 'edit' },
  { id: 'dd', keys: 'dd', label: 'delete line', tier: 1, category: 'edit' },
  { id: 'u', keys: 'u', label: 'undo', tier: 1, category: 'edit' },
  { id: 'a', keys: 'a', label: 'insert after cursor', tier: 1, category: 'modes' },
  { id: 'o', keys: 'o', label: 'open line below', tier: 1, category: 'modes' },

  // Tier 2 — Comfortable
  { id: 'w', keys: 'w', label: 'next word', tier: 2, category: 'motion' },
  { id: 'b', keys: 'b', label: 'previous word', tier: 2, category: 'motion' },
  { id: 'e', keys: 'e', label: 'end of word', tier: 2, category: 'motion' },
  { id: '0', keys: '0', label: 'start of line', tier: 2, category: 'motion' },
  { id: '$', keys: '$', label: 'end of line', tier: 2, category: 'motion' },
  { id: 'gg', keys: 'gg', label: 'top of file', tier: 2, category: 'motion' },
  { id: 'G', keys: 'G', label: 'bottom of file', tier: 2, category: 'motion' },
  { id: 'f', keys: 'f{c}', label: 'find char', tier: 2, category: 'motion' },
  { id: 'cw', keys: 'cw', label: 'change word', tier: 2, category: 'edit' },
  { id: 'O', keys: 'O', label: 'open line above', tier: 2, category: 'modes' },
  { id: 'I', keys: 'I', label: 'insert at line start', tier: 2, category: 'modes' },
  { id: 'A', keys: 'A', label: 'append at line end', tier: 2, category: 'modes' },

  // Tier 3 — Faster
  { id: 'd-motion', keys: 'd{m}', label: 'delete + motion', tier: 3, category: 'operator' },
  { id: 'c-motion', keys: 'c{m}', label: 'change + motion', tier: 3, category: 'operator' },
  { id: 'y-motion', keys: 'y{m}', label: 'yank + motion', tier: 3, category: 'operator' },
  { id: 'iw', keys: 'ciw', label: 'inner word', tier: 3, category: 'text-object' },
  { id: 'i(', keys: 'ci(', label: 'inner parens', tier: 3, category: 'text-object' },
  { id: 'i"', keys: 'ci"', label: 'inner quotes', tier: 3, category: 'text-object' },
  { id: 'aw', keys: 'daw', label: 'a word + space', tier: 3, category: 'text-object' },
  { id: 'it', keys: 'cit', label: 'inner tag', tier: 3, category: 'text-object' },
  { id: 'D', keys: 'D', label: 'delete to line end', tier: 3, category: 'operator' },
  { id: 'C', keys: 'C', label: 'change to line end', tier: 3, category: 'operator' },
  { id: 'i[', keys: 'ci[', label: 'inner brackets', tier: 3, category: 'text-object' },
  { id: 'indent', keys: '>> / >{m}', label: 'indent lines', tier: 3, category: 'edit' },
  { id: 'count', keys: '{n}{cmd}', label: 'count prefix', tier: 3, category: 'motion' },
  { id: 'p', keys: 'p', label: 'paste', tier: 3, category: 'edit' },
  { id: 'V', keys: 'V', label: 'visual line', tier: 3, category: 'modes' },
  { id: 'ctrl-v', keys: 'Ctrl-v', label: 'visual block', tier: 3, category: 'modes' },
  { id: 'v', keys: 'v', label: 'visual mode', tier: 3, category: 'modes' },

  // Tier 4 — Seeker
  // (re-tiered from 3: search belongs with n/N/*/:s in the search world.
  //  Re-tiering is save-safe — mastery is keyed by id, never by tier.)
  { id: 'search', keys: '/', label: 'search forward', tier: 4, category: 'motion' },
  { id: 'search-back', keys: '?', label: 'search backward', tier: 4, category: 'motion' },
  { id: 'n', keys: 'n/N', label: 'next / prev match', tier: 4, category: 'motion' },
  { id: 'star', keys: '*', label: 'search word under cursor', tier: 4, category: 'motion' },
  { id: 'till', keys: 't{c}', label: 'till before char', tier: 4, category: 'motion' },
  { id: 'semicolon', keys: ';', label: 'repeat find', tier: 4, category: 'motion' },
  { id: 'percent', keys: '%', label: 'matching bracket', tier: 4, category: 'motion' },
  { id: 'sub', keys: ':s//', label: 'substitute (line)', tier: 4, category: 'ex' },
  { id: 'sub-all', keys: ':%s//g', label: 'substitute (file)', tier: 4, category: 'ex' },
  { id: 'sub-confirm', keys: ':s//gc', label: 'confirm each match', tier: 4, category: 'ex' },
  { id: 'marks', keys: 'm{r}', label: 'set mark / jump back', tier: 4, category: 'power' },

  // Tier 5 — Superpowers (macro re-tiered from 4)
  { id: 'macro', keys: 'q{r}', label: 'record macro', tier: 5, category: 'power' },
  { id: 'macro-replay', keys: '@{r} / @@', label: 'play macro', tier: 5, category: 'power' },
  { id: 'dot', keys: '.', label: 'repeat last change', tier: 5, category: 'power' },
  { id: 'gn', keys: 'cgn', label: 'change next match', tier: 5, category: 'operator' },
  { id: 'incr', keys: 'Ctrl-a / Ctrl-x', label: 'increment / decrement', tier: 5, category: 'edit' },
  { id: 'registers', keys: '"{a-z}', label: 'named registers', tier: 5, category: 'power' },
  { id: 'reg-zero', keys: '"0p', label: 'yank register', tier: 5, category: 'power' },
  { id: 'reg-append', keys: '"{A-Z}', label: 'append to register', tier: 5, category: 'power' },
  { id: 'blackhole', keys: '"_d', label: 'blackhole register', tier: 5, category: 'power' },

  // Tier 6 — Legend
  { id: 'J', keys: 'J', label: 'join lines', tier: 6, category: 'edit' },
  { id: 'gJ', keys: 'gJ', label: 'join, no space', tier: 6, category: 'edit' },
  { id: 'case-upper', keys: 'gU{m}', label: 'uppercase', tier: 6, category: 'operator' },
  { id: 'case-toggle', keys: 'g~{m}', label: 'toggle case', tier: 6, category: 'operator' },
  { id: 'replace', keys: 'r{c}', label: 'replace char', tier: 6, category: 'edit' },
  { id: 'ip', keys: 'ip / ap', label: 'paragraph object', tier: 6, category: 'text-object' },
  { id: 'block-i', keys: 'Ctrl-v I', label: 'block insert', tier: 6, category: 'edit' },
  { id: 'block-a', keys: 'Ctrl-v $A', label: 'block append', tier: 6, category: 'edit' },
  { id: 'gq', keys: 'gqip', label: 'reflow paragraph', tier: 6, category: 'operator' },
  { id: 'sort', keys: ':sort', label: 'sort lines', tier: 6, category: 'ex' },
  { id: 'global', keys: ':g//', label: 'global command', tier: 6, category: 'ex' },
  { id: 'vglobal', keys: ':v//', label: 'inverse global', tier: 6, category: 'ex' },
  { id: 'normal', keys: ':normal', label: 'run normal cmds', tier: 6, category: 'ex' },
]

export const COMMANDS_BY_ID: Record<string, VimCommand> = Object.fromEntries(
  COMMANDS.map((c) => [c.id, c]),
)

export function commandsForTier(tier: Tier): VimCommand[] {
  return COMMANDS.filter((c) => c.tier === tier)
}
