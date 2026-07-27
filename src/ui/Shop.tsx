import { Suspense, lazy, useState, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import { useGame } from '../game/store'
import { THEMES, BACKGROUNDS, type Cosmetic } from '../game/cosmetics'
import { finishSku, FINISHES } from '../game/heroParts'
import { CHARACTERS, characterSku } from '../game/characters'
import { effectiveQuality } from '../game/quality'
import { useStage } from '../three/stageState'
import { sfx } from '../game/sound'
import { CharacterMark } from './Avatar'
import { useT } from '../game/i18n'

// Local Suspense boundary — the 3D hero preview never blocks the rest of the Shop.
const Hero3D = lazy(() => import('../three/Hero3D'))

type TabKey = 'characters' | 'theme' | 'background'
const TABS: { key: TabKey }[] = [{ key: 'characters' }, { key: 'theme' }, { key: 'background' }]

/**
 * Static thumbnail for each background — a faithful, cheap snapshot of what the
 * live <Background/> scene renders (no canvas/parallax in the grid). CRT & Matrix
 * are theme-tinted with var(--color-term) so their swatches recolor exactly like
 * the real scenes do. Keep these in sync when a scene's look changes.
 */
function bgPreviewStyle(bg?: string): CSSProperties {
  switch (bg) {
    case 'synthwave':
      // sunset gradient + glowing striped sun
      return {
        background:
          'radial-gradient(circle at 50% 46%, #ffe66d, rgba(255,106,193,0.9) 24%, transparent 46%), linear-gradient(180deg, #180b2e 0%, #2d1b4e 34%, #6b2d5c 60%, #c94b7b 80%, #ff9e64 100%)',
      }
    case 'aurora':
      // drifting green/blue/violet light over deep navy
      return {
        background:
          'radial-gradient(circle at 24% 26%, #3ddc84, transparent 52%), radial-gradient(circle at 76% 36%, #59c2ff, transparent 52%), radial-gradient(circle at 52% 96%, #b78cff, transparent 56%), linear-gradient(180deg, #060a16, #0a0e14)',
      }
    case 'starfield':
      // warp: faint center glow with stars streaming outward
      return {
        background:
          'radial-gradient(circle at 50% 50%, rgba(89,194,255,0.16), transparent 42%), radial-gradient(1.4px 1.4px at 30% 42%, #fff, transparent), radial-gradient(1.4px 1.4px at 68% 58%, #59c2ff, transparent), radial-gradient(1px 1px at 44% 30%, #fff, transparent), radial-gradient(1px 1px at 60% 74%, #fff, transparent), radial-gradient(1px 1px at 82% 40%, #fff, transparent), #06080d',
      }
    case 'nebula':
      // deep-space color clouds + a bright core
      return {
        background:
          'radial-gradient(circle at 30% 26%, #7c3aed, transparent 55%), radial-gradient(circle at 74% 68%, #db2777, transparent 55%), radial-gradient(circle at 56% 48%, #0ea5e9, transparent 60%), radial-gradient(ellipse at 28% 18%, #1e1b4b, #0a0e14 70%)',
      }
    case 'cyber':
      // moon glow + dark skyline band over a violet city gradient
      return {
        background:
          'radial-gradient(circle at 78% 22%, rgba(89,194,255,0.5), transparent 40%), linear-gradient(180deg, transparent 62%, #0e0722 62%), linear-gradient(180deg, #0a0e14 0%, #101a2e 52%, #2a0e3a 100%)',
      }
    case 'matrix':
      // digital rain: theme-tinted glyph columns falling from the top
      return {
        background:
          'repeating-linear-gradient(90deg, transparent 0 6px, color-mix(in srgb, var(--color-term) 24%, transparent) 6px 7px, transparent 7px 13px), linear-gradient(180deg, color-mix(in srgb, var(--color-term) 16%, transparent), transparent 58%), #04120a',
      }
    case 'crt':
    default:
      // terminal glow at the top + scanlines, theme-tinted like the live scene
      return {
        background:
          'radial-gradient(ellipse at 50% -20%, color-mix(in srgb, var(--color-term) 30%, transparent), transparent 62%), repeating-linear-gradient(0deg, transparent 0 2px, rgba(0,0,0,0.28) 3px, transparent 4px), radial-gradient(ellipse at 50% -15%, #10161f, #070a11 72%)',
      }
  }
}

/**
 * The Hero customizer — pick a character model + a body finish. A live 3D preview
 * of the equipped Hero (the character PNG via <Avatar/> in the lite tier) plus a
 * finish picker (matte/glow/holo/metallic).
 */
function CharacterStudio() {
  const hero = useGame((s) => s.hero)
  const setHero = useGame((s) => s.setHero)
  const owned = useGame((s) => s.owned)
  const coins = useGame((s) => s.coins)
  const buyCharacter = useGame((s) => s.buyCharacter)
  const buyFinish = useGame((s) => s.buyFinish)
  const quality = useGame((s) => s.quality)
  const contextLost = useStage((s) => s.contextLost)
  const tier = contextLost ? 'lite' : effectiveQuality(quality)
  const t = useT()

  return (
    <div className="panel mt-5 p-4 sm:p-5">
      {/* character roster — pick which base model to wear */}
      <div className="text-[10px] uppercase tracking-widest text-ink-dim">{t('shop.character')}</div>
      <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {CHARACTERS.map((c) => {
          const isEquipped = hero.character === c.id
          const isOwned = owned.includes(characterSku(c.id))
          const canAfford = coins >= c.price
          const locked = !isOwned && !canAfford
          const cname = t(`character.${c.id}.name`, undefined, c.name)
          return (
            <button
              key={c.id}
              disabled={locked}
              onClick={() => {
                if (isEquipped) return
                if (isOwned) {
                  setHero({ character: c.id })
                  sfx.ui()
                } else if (buyCharacter(c.id)) {
                  setHero({ character: c.id }) // auto-equip on purchase
                  sfx.purchase()
                } else {
                  sfx.error()
                }
              }}
              title={isOwned ? t('shop.equipName', { name: cname }) : t('shop.buyName', { name: cname, price: c.price })}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors ${
                isEquipped
                  ? 'border-term text-term'
                  : locked
                    ? 'cursor-not-allowed border-border text-ink-dim opacity-60'
                    : 'border-border text-ink-dim hover:text-ink'
              }`}
            >
              <div className="grid h-16 w-full place-items-center overflow-hidden rounded-lg bg-panel-2">
                <img src={c.thumb.url} alt="" className="h-14 w-14 object-contain" />
              </div>
              <span className="text-xs font-medium text-ink">{cname}</span>
              {isEquipped ? (
                <span className="text-[11px] font-bold text-term">✓ {t('shop.equipped')}</span>
              ) : isOwned ? (
                <span className="text-[11px]">{t('shop.equip')}</span>
              ) : (
                <span className="inline-flex items-center gap-0.5 text-[11px] tabular-nums">
                  <span className="coin" style={{ width: '0.85em', height: '0.85em' }} /> {c.price}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="mt-4 text-sm text-ink-dim">{t('shop.pickHint')}</p>

      {/* live preview — interactive: drag to rotate, idle turntable, pedestal + shadow */}
      <div
        className="relative mx-auto mt-3 h-72 w-full max-w-xs overflow-hidden rounded-xl border border-border"
        style={{ background: 'radial-gradient(ellipse at 50% 15%, color-mix(in srgb, var(--color-term) 12%, #0b0f18), #080b11 78%)' }}
      >
        {tier === 'webgl' ? (
          <Suspense
            fallback={
              <div className="grid h-full place-items-center">
                <CharacterMark hero={hero} size={140} />
              </div>
            }
          >
            <Hero3D reaction="idle" hero={hero} interactive />
          </Suspense>
        ) : (
          <div className="grid h-full place-items-center">
            <CharacterMark hero={hero} size={140} />
          </div>
        )}
        {tier === 'webgl' && (
          <span className="pointer-events-none absolute bottom-1.5 left-0 right-0 text-center text-[10px] text-ink-dim/70">
            {t('shop.dragRotate')}
          </span>
        )}
      </div>

      {/* body finish — matte is free; glow/holo/metallic are coin purchases */}
      <div className="mt-4">
        <div className="text-[10px] uppercase tracking-widest text-ink-dim">{t('shop.finish')}</div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {FINISHES.map((f) => {
            const isOwned = owned.includes(finishSku(f.id))
            const isActive = hero.finish === f.id
            const canAfford = coins >= f.price
            const locked = !isOwned && !canAfford
            const fname = t(`finish.${f.id}.name`, undefined, f.name)
            return (
              <button
                key={f.id}
                disabled={locked}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  if (isOwned) {
                    setHero({ finish: f.id })
                    sfx.ui()
                  } else if (buyFinish(f.id)) {
                    setHero({ finish: f.id }) // auto-equip on purchase
                    sfx.purchase()
                  } else {
                    sfx.error()
                  }
                }}
                title={isOwned ? t('shop.equipName', { name: fname }) : t('shop.buyName', { name: fname, price: f.price })}
                className={`rounded-md border px-2.5 py-1.5 text-xs transition-colors ${
                  isActive
                    ? 'border-term text-term'
                    : isOwned
                      ? 'border-border text-ink-dim hover:text-ink'
                      : canAfford
                        ? 'border-amber/50 text-amber hover:bg-amber/10'
                        : 'cursor-not-allowed border-border text-ink-dim opacity-60'
                }`}
              >
                {fname}
                {!isOwned && (
                  <span className="ml-1 inline-flex items-center gap-0.5 tabular-nums">
                    <span className="coin" style={{ width: '0.85em', height: '0.85em' }} /> {f.price}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

    </div>
  )
}

function ItemPreview({ c }: { c: Cosmetic }) {
  if (c.kind === 'theme') {
    return <div className="h-20 rounded" style={{ background: `linear-gradient(135deg, ${c.accent}, ${c.accentDim})` }} />
  }
  return <div className="h-20 overflow-hidden rounded" style={bgPreviewStyle(c.bg)} />
}

export function Shop() {
  const coins = useGame((s) => s.coins)
  const owned = useGame((s) => s.owned)
  const equipped = useGame((s) => s.equipped)
  const buy = useGame((s) => s.buyItem)
  const equip = useGame((s) => s.equipItem)
  const t = useT()
  const [tab, setTab] = useState<TabKey>('characters')
  const items = tab === 'theme' ? THEMES : tab === 'background' ? BACKGROUNDS : []

  const onBuy = (c: Cosmetic) => {
    if (buy(c.id)) {
      sfx.purchase()
      equip(c.id) // auto-equip on purchase
    } else sfx.error()
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="screen-title font-terminal text-4xl">{t('shop.title')}</h2>
          <p className="mt-1 text-ink-dim">{t('shop.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="coin" style={{ width: '1.4em', height: '1.4em' }} />
          <span className="font-terminal text-3xl tabular-nums text-amber">{coins}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => {
              setTab(tb.key)
              sfx.ui()
            }}
            className={`rounded border px-4 py-1.5 text-sm transition-colors ${
              tab === tb.key ? 'border-term text-term' : 'border-border text-ink-dim hover:text-ink'
            }`}
          >
            {t(`shop.tab.${tb.key}`)}
          </button>
        ))}
      </div>

      {tab === 'characters' ? (
        <CharacterStudio />
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((c) => {
            const isOwned = owned.includes(c.id)
            const isEquipped = equipped[c.kind] === c.id
            const canAfford = coins >= c.price
            return (
              <motion.div key={c.id} layout className="panel flex flex-col p-3">
                <ItemPreview c={c} />
                <div className="mt-2 flex-1">
                  <p className="text-sm font-medium text-ink">{t(`cosmetic.${c.id}.name`, undefined, c.name)}</p>
                  {c.blurb && (
                    <p className="text-[11px] leading-snug text-ink-dim">
                      {t(`cosmetic.${c.id}.blurb`, undefined, c.blurb)}
                    </p>
                  )}
                </div>
                <div className="mt-3">
                  {isEquipped ? (
                    <div className="rounded py-1.5 text-center text-xs font-bold text-term" style={{ background: 'color-mix(in srgb, var(--color-term) 15%, transparent)' }}>
                      ✓ {t('shop.equipped')}
                    </div>
                  ) : isOwned ? (
                    <button
                      onClick={() => {
                        equip(c.id)
                        sfx.ui()
                      }}
                      className="w-full rounded border border-term py-1.5 text-xs font-bold text-term transition-colors hover:bg-term/10"
                    >
                      {t('shop.equip')}
                    </button>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => onBuy(c)}
                      className={`flex w-full items-center justify-center gap-1.5 rounded py-1.5 text-xs font-bold transition-transform ${
                        canAfford ? 'btn-accent hover:scale-[1.03]' : 'cursor-not-allowed bg-panel-2 text-ink-dim'
                      }`}
                    >
                      <span className="coin" /> {c.price}
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
