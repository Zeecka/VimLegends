/**
 * English — the source of truth and the fallback for every other language.
 *
 * Conventions for translators (fr/es/ru/zh mirror these keys):
 * - Keep each value a COMPLETE phrase/sentence; never split a sentence across
 *   keys (word order varies by language).
 * - `{name}` placeholders are interpolated at runtime — keep them verbatim.
 * - Text in `backticks` renders as a keycap (e.g. `x`, `Esc`, `Ctrl-b`). NEVER
 *   translate what is inside backticks — those are literal Vim keys.
 * - Keep glyphs like ★, ☠, →, ▶ as-is.
 * - Vim itself, mode names shown as keycaps, and command mnemonics stay English.
 */
export const en: Record<string, string> = {
  // ── Language switcher ───────────────────────────────────────────────
  'lang.label': 'Language',
  'lang.auto': 'Auto-detected',

  // ── Common ──────────────────────────────────────────────────────────
  'common.cancel': 'Cancel',
  'common.backHome': 'back home',
  'common.close': 'Close',

  // ── Home ────────────────────────────────────────────────────────────
  'home.tagline': 'Learn Vim by playing. Real editor, real keystrokes, real muscle memory.',
  'home.customize': 'customize your character',
  'home.customizeTitle': 'Customize your character',
  'home.continueCampaign': 'Continue Campaign',
  'home.startCampaign': 'Start Campaign',
  'home.motionRush': 'Motion Rush',
  'home.quizMode': 'Quiz Mode',
  'home.resetProgress': 'reset progress',
  'home.resetTitle': 'Reset everything?',
  'home.resetBody':
    "This erases all progress — levels, XP, coins, streak and cosmetics — and can't be undone.",
  'home.resetConfirm': 'Reset everything',
  'home.freeOss': 'free & open source',
  'home.donate': 'donate',
  'home.sisterApp': 'try {name}',
  'home.sisterTitle': 'Learn tmux too — try our companion game TmuxLegends',
  'stats.level': 'LEVEL',
  'stats.coins': 'COINS',
  'stats.solved': 'SOLVED',
  'stats.mastered': 'MASTERED',
  'stats.rush': 'RUSH',

  // ── HUD (top bar) ───────────────────────────────────────────────────
  'hud.customize': 'customize',
  'hud.maps': 'maps',
  'hud.mapsTitle': 'World map',
  'hud.quiz': 'quiz',
  'hud.quizTitle': 'Quiz mode — tap-to-answer trainer',
  'hud.cheatsheet': 'cheatsheet',
  'hud.share': 'share my score',
  'hud.shareTitle': 'Share my score',
  'hud.dayStreak': 'day streak',
  'hud.streakActive': '{n}-day streak — play daily to keep it alive',
  'hud.streakInactive': 'Play daily to build a streak',
  'hud.shopTitle': 'Shop',
  'hud.shopAria': 'Shop — {n} coins',
  'hud.mute': 'Mute sound',
  'hud.unmute': 'Unmute sound',
  'hud.shared': 'Shared! 🎉',
  'hud.scoreCopied': 'Score copied to clipboard!',
  'hud.shareFailed': 'Could not share — try again',
  'hud.signInNote': 'Sign in first and your share link shows a verified, server-stored score.',

  // ── World map ───────────────────────────────────────────────────────
  'map.title': 'Campaign',
  'map.subtitle': 'Clear a world to unlock the next. Fewer keystrokes = more stars.',
  'map.worldLabel': 'World {n} · {name}',
  'map.comingSoon': 'Coming soon',
  'map.cleared': 'Cleared',
  'map.locked': 'Locked',
  'map.stub': 'Curriculum stub — {subtitle}. Landing in a future update.',
  'map.lockedHint': 'Locked — clear World {prev} to unlock these {count} challenges.',

  // ── Campaign (playing a level) ──────────────────────────────────────
  'campaign.bossFight': 'Boss Fight',
  'campaign.worldLabel': 'World {n} · {title}',
  'campaign.goalPar': 'goal {par}',
  'campaign.needHint': 'Need a hint?',
  'campaign.howToPlay': 'How to play',
  'campaign.cheatsheet': 'Cheatsheet',
  'campaign.restart': 'Restart',
  'campaign.restartTitle': 'Restart this level from the beginning',
  'campaign.quit': 'Quit',
  'campaign.quitTitle': 'Leave this level and return to the world map',
  'campaign.hintLabel': 'Hint',
  'campaign.needsKeyboard': 'This level needs a physical keyboard — it plays best on a computer.',
  'campaign.tryQuiz': 'Try the Quiz →',
  'campaign.bossIntegrity': 'Keystroke budget',
  'campaign.keystrokesLeft': '{n} keystrokes left',
  'campaign.repelled': 'REPELLED!',
  'campaign.repelledBody':
    '{title} shrugged off your {n} keystrokes — the budget was {budget}. Reload and clear it in {par} keystrokes or fewer to earn ★★★.',
  'campaign.retryFor3': 'Retry for 3 ★',
  'campaign.backToMap': 'Back to map',

  // ── Result screen ───────────────────────────────────────────────────
  'result.bossDefeated': 'BOSS DEFEATED!',
  'result.perfect': 'PERFECT!',
  'result.solved': 'SOLVED!',
  'result.keystrokesLabel': 'keystrokes',
  'result.goalLabel': 'goal',
  'result.improveHint': 'solve in {par} keystrokes or fewer to earn ★★★',
  'result.alreadyMastered': 'already mastered — replaying for practice',
  'result.levelUp': 'LEVEL UP → {n}',
  'result.commandMastered': 'command mastered:',
  'result.retryFor3': 'Retry for 3 ★',
  'result.replay': 'Replay',
  'result.map': 'Map',
  'result.next': 'Next',
  'result.nextWorld': 'Next world',
  'result.pressEnter': 'press `Enter` to continue',
  'result.shareMyScore': 'share my score',
  'result.shared': 'Shared! 🎉',
  'result.copied': 'Copied to clipboard!',
  'result.shareFailed': 'Could not share',

  // ── Arcade (Motion Rush) ────────────────────────────────────────────
  'arcade.title': 'Motion Rush',
  'arcade.tagline': 'Whack the `@` using `h` `j` `k` `l`. Chain fast for combos.',
  'arcade.best': 'best',
  'arcade.score': 'SCORE',
  'arcade.combo': 'COMBO',
  'arcade.time': 'TIME',
  'arcade.timeUp': 'TIME!',
  'arcade.scoreLabel': 'Score',
  'arcade.newBest': 'new best!',
  'arcade.readyHint': 'Move the cursor onto the `@` before it moves. Speed builds your combo.',
  'arcade.playAgain': 'Play Again',
  'arcade.start': 'Start',

  // ── Shop ────────────────────────────────────────────────────────────
  'shop.title': 'Shop',
  'shop.subtitle': 'Earn coins by playing. Spend them on your look.',
  'shop.tab.characters': 'Characters',
  'shop.tab.theme': 'Themes',
  'shop.tab.background': 'Backgrounds',
  'shop.character': 'Character',
  'shop.finish': 'Finish',
  'shop.pickHint': 'Pick your character, then a finish — it appears everywhere you play.',
  'shop.dragRotate': 'drag to rotate',
  'shop.equipped': 'Equipped',
  'shop.equip': 'Equip',
  'shop.equipName': 'Equip {name}',
  'shop.buyName': 'Buy {name} for {price} coins',

  // ── Hero panel ──────────────────────────────────────────────────────
  'hero.yourHero': 'Your Hero',
  'hero.level': 'Level {n}',
  'hero.loadout': 'Loadout',
  'hero.trophy.worlds': 'worlds cleared',
  'hero.trophy.perfects': 'perfect solves',
  'hero.trophy.mastered': 'commands mastered',
  'hero.trophy.solved': 'levels solved',
  'hero.trophy.rush': 'rush best',
  'hero.coins': 'Coins',
  'hero.earnMore': '· earn more to unlock gear in the Shop',
  'rank.0': 'Rookie',
  'rank.1': 'Operator',
  'rank.2': 'Coder',
  'rank.3': 'Hacker',
  'rank.4': 'Wizard',
  'rank.5': 'Legend',

  // ── XP bar ──────────────────────────────────────────────────────────
  'xp.lvl': 'LVL',

  // ── GitHub button ───────────────────────────────────────────────────
  'github.title': 'Star this project on GitHub',
  'github.star': 'Star',

  // ── How to play ─────────────────────────────────────────────────────
  'howto.title': 'How to play',
  'howto.dialogLabel': 'How to play VimLegends',
  'howto.intro':
    "VimLegends teaches Vim in a real editor — the skills transfer straight to your terminal. Sixty seconds and you're playing:",
  'howto.step1.title': 'Two modes',
  'howto.step1.body':
    "Vim starts in NORMAL mode — keys move and run commands, they don't type. Press `i` to enter INSERT mode and type text; press `Esc` to snap back to NORMAL. The badge above the editor always shows where you are.",
  'howto.step2.title': 'Move without arrows',
  'howto.step2.body':
    'In NORMAL mode, `h` `j` `k` `l` move left / down / up / right. It feels strange for a day, then your hands never leave the home row. No mouse needed — ever.',
  'howto.step3.title': 'Every keystroke counts',
  'howto.step3.body':
    "Each level has a task and a goal — the fewest keystrokes a pro would use. Match or beat the goal for ★★★. It's golf: think, don't mash.",
  'howto.step4.title': 'Never stuck',
  'howto.step4.body':
    'Below the editor: "Need a hint?" spells out the move, "Cheatsheet" lists every command, and "Restart" resets the level if you tangle it up. You can\'t break anything.',
  'howto.letsGo': "Let's go",

  // ── Cheatsheet ──────────────────────────────────────────────────────
  'cheatsheet.label': 'Cheatsheet',
  'cheatsheet.buttonTitle': 'Vim cheatsheet — every command, downloadable',
  'cheatsheet.buttonAria': 'Open the Vim cheatsheet',
  'cheatsheet.title': 'Vim Cheatsheet',
  'cheatsheet.dialogLabel': 'Vim cheatsheet',
  'cheatsheet.summary': '{n} commands · {m} mastered',
  'cheatsheet.close': 'Close cheatsheet',
  'cheatsheet.filter': 'Filter commands...',
  'cheatsheet.filterAria': 'Filter commands',
  'cheatsheet.clearFilter': 'Clear filter',
  'cheatsheet.mastered': 'mastered',
  'cheatsheet.noMatch': 'Nothing matches “{q}”.',
  'cheatsheet.world': 'World {n}',
  'cheatsheet.takeItWithYou': 'Take it with you:',
  'cheatsheet.markdown': 'Markdown',
  'cheatsheet.html': 'HTML',
  'cheatsheet.printPdf': 'Download PDF',
  'cheatsheet.downloadedMd': 'Downloaded Markdown ✓',
  'cheatsheet.downloadedHtml': 'Downloaded HTML ✓',
  'cheatsheet.downloadedPdf': 'Downloaded PDF ✓',
  'cheatsheet.downloadPdfTitle': 'Download the full cheatsheet as a PDF',

  // ── Account ─────────────────────────────────────────────────────────
  'account.dialogLabel': 'Sign in',
  'account.title': 'Save your progress',
  'account.body':
    'No account is needed to play. Sign in to keep your XP, coins and gear across devices — and to share a verified score backed by the server, not just text anyone could edit.',
  'account.continueWith': 'Continue with {provider}',
  'account.shareWithout': 'share without an account',
  'account.mergedNote': 'Your local progress is merged when you sign in.',
  'account.close': 'close',
  'account.signIn': 'Sign in',
  'account.saving': 'Saving…',
  'account.saved': 'Progress saved to your account',
  'account.notSaved': 'Not saved yet',
  'account.viaSaved': 'via {provider} · progress saved',
  'account.viaNotSaved': 'via {provider} · not saved yet',
  'account.signOut': 'Sign out',

  // ── Profile (shared score page) ─────────────────────────────────────
  'profile.notExist': 'This score link does not exist (or was deleted).',
  'profile.loadError': 'Could not load this score right now.',
  'profile.loading': 'Loading verified score…',
  'profile.verified': 'verified score · stored server-side',
  'profile.streak': '{n}-day streak',
  'profile.lastPlayed': 'last played {date}',
  'profile.cta': 'Think you can beat it? Play VimLegends',
  'profile.ctaSub': 'Learn Vim by playing — real editor, real keystrokes. Free, no account needed.',

  // ── Quiz mode ───────────────────────────────────────────────────────
  'quiz.title': 'Quiz',
  'quiz.subtitle': 'Tap the right answer — no keyboard needed. Perfect on the go.',
  'quiz.best': 'best',
  'quiz.mixedRound': 'Mixed round',
  'quiz.mixedDesc': '{n} questions from every world',
  'quiz.orDrill': 'Or drill one world',
  'quiz.complete': 'Quiz complete',
  'quiz.pctCorrect': '{pct}% correct',
  'quiz.newBest': 'new best!',
  'quiz.retry': 'Retry',
  'quiz.chooseTopic': 'Choose topic',
  'quiz.question': 'Question {n} / {total}',
  'quiz.seeResults': 'See results',
  'quiz.nextQuestion': 'Next question',

  // ── Command Belt ────────────────────────────────────────────────────
  'belt.title': 'Command Belt',
  'belt.mastered': '{n}/{total} mastered',
  'belt.cat.modes': 'Modes',
  'belt.cat.motion': 'Motion',
  'belt.cat.edit': 'Edits',
  'belt.cat.operator': 'Operators',
  'belt.cat.text-object': 'Text objects',
  'belt.cat.ex': 'Ex commands',
  'belt.cat.power': 'Power',

  // ── Worlds (content) ────────────────────────────────────────────────
  'content.world.1.name': 'Survive',
  'content.world.1.subtitle': 'Modes, motion & first edits',
  'content.world.2.name': 'Comfortable',
  'content.world.2.subtitle': 'Words, lines & jumps',
  'content.world.3.name': 'Faster',
  'content.world.3.subtitle': 'Operators, objects & visual',
  'content.world.4.name': 'Seeker',
  'content.world.4.subtitle': 'Search, substitute & marks',
  'content.world.5.name': 'Superpowers',
  'content.world.5.subtitle': 'Registers, macros & the dot',
  'content.world.6.name': 'Legend',
  'content.world.6.subtitle': 'Global commands & power idioms',
}
