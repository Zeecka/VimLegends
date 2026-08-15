// Capture the social-preview images (og:image / twitter:image) for BOTH games:
// a 1200×630 viewport @2x of each home screen, seeded with the same "showcase"
// save as scripts/shots.mjs, written to each project's public/og.png.
//
//   node scripts/og.mjs        # against the dev containers (ports below);
//                              # override with VIM_BASE / TMUX_BASE for preview builds
//
// Playwright lives only in this project — the sibling TmuxLegends is captured
// from here (same pattern as the cross-checked showcase saves).
import { chromium } from 'playwright'

const T1 = ['t1-first-blood', 't1-navigate', 't1-insert', 't1-append', 't1-delete-line', 't1-undo', 't1-open-line', 't1-capstone']
const T2 = ['t2-word-leap', 't2-end-word', 't2-back-word', 't2-line-ends', 't2-find-char', 't2-change-word', 't2-file-ends', 't2-capstone']
const solved = (ids) => Object.fromEntries(ids.map((id) => [id, { keystrokes: 4, par: 5, stars: 3, xp: 75 }]))

const VIM_SAVE = {
  version: 10,
  state: {
    xp: 1480,
    coins: 260,
    completed: solved([...T1, 'boss-gatekeeper', ...T2, 't3-cut-word', 't3-shear', 't3-ciw']),
    mastery: Object.fromEntries(
      ['x', 'i', 'a', 'o', 'dd', 'u', 'h', 'j', 'k', 'l', 'w', 'b', 'e', '0', '$', 'gg', 'G', 'ciw', 'cw', 'f'].map((k) => [k, 6]),
    ),
    streak: { count: 7, lastPlayed: '2026-8-6' },
    soundOn: true,
    arcadeBest: 320,
    owned: ['nightglass', 'crt', 'synthwave', 'aurora', 'phosphor'],
    equipped: { theme: 'nightglass', background: 'crt' },
    hero: { body: null, trim: null, visor: null, accessory: 'none', visorStyle: 'bar', aura: { color: null, style: 'sparkles', intensity: 0.6 } },
    quality: 'webgl',
    seenPrimer: true,
  },
}

const TMUX_T1 = ['t1-prefix', 't1-split-v', 't1-navigate', 't1-zoom', 't1-kill', 't1-capstone']
const TMUX_T2 = ['t2-new-window', 't2-rename', 't2-switch', 't2-prev-window', 't2-jump', 't2-kill-window', 't2-capstone']
const TMUX_SAVE = {
  version: 9,
  state: {
    xp: 1480,
    coins: 430,
    completed: solved([...TMUX_T1, 'b1-workspace', ...TMUX_T2, 't3-detach', 't3-rename-session', 't3-new-session']),
    mastery: Object.fromEntries(
      ['prefix', 'split-h', 'split-v', 'select-pane', 'zoom', 'kill-pane', 'new-window', 'rename-window', 'next-window', 'prev-window', 'select-window', 'kill-window', 'detach'].map((k) => [k, 6]),
    ),
    streak: { count: 7, lastPlayed: '2026-8-6' },
    soundOn: true,
    arcadeBest: 268,
    quality: 'webgl',
    seenPrimer: true,
  },
}

const GAMES = [
  { base: process.env.VIM_BASE ?? 'http://127.0.0.1:8971', key: 'vimlegends-save', lang: 'vimlegends-lang', save: VIM_SAVE, out: 'public/og.png', scrollY: Number(process.env.VIM_SCROLL ?? 0) },
  { base: process.env.TMUX_BASE ?? 'http://127.0.0.1:8974', key: 'tmuxlegends-save', lang: 'tmuxlegends-lang', save: TMUX_SAVE, out: '../TmuxLegends/public/og.png', scrollY: Number(process.env.TMUX_SCROLL ?? 0) },
]

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader'] })
for (const g of GAMES) {
  const ctx = await browser.newContext({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  page.setDefaultTimeout(60000)
  // Dev server: HMR socket keeps the network busy — never wait for networkidle.
  await page.goto(g.base, { waitUntil: 'domcontentloaded' })
  await page.evaluate(({ key, lang, save }) => {
    localStorage.setItem(key, JSON.stringify(save))
    localStorage.setItem(lang, 'en')
  }, { key: g.key, lang: g.lang, save: g.save })
  await page.reload({ waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(4000) // lazy 3D chunk compile + first paint
  if (g.scrollY) {
    await page.evaluate((y) => window.scrollTo(0, y), g.scrollY)
    await page.waitForTimeout(400)
  }
  await page.mouse.move(10, 620)
  await page.waitForTimeout(500)
  await page.screenshot({ path: g.out })
  console.log(`✓ ${g.out}`)
  await ctx.close()
}
await browser.close()
console.log('done')
