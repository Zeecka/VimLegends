import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useAnimations, useGLTF, PresentationControls, ContactShadows, PerformanceMonitor } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import { getGradientMap } from './toon'
import { useHeroRig } from './useHeroRig'
import { useStage, type HeroReaction } from './stageState'
import { type HeroCustom } from '../game/heroParts'
import { characterFrom, CHARACTER_BY_ID, DEFAULT_CHARACTER } from '../game/characters'
import { HeroExtras } from './HeroExtras'

/** Material names kept natural (never take a glow/metallic finish) — faces stay skin. */
const SKIN_RE = /skin|hair|eye|brow|tooth|teeth|mouth|tongue|nail|face|beard/i

/**
 * The 3D hero portrait — a small dedicated canvas (HeroPanel + Shop studio).
 *
 * `interactive` (Shop preview only) turns it into a showcase: drag-to-rotate
 * (spring snap-back) + idle turntable + a pedestal & soft contact shadow. The
 * HeroPanel portrait passes `interactive={false}` and stays `pointer-events-none`
 * next to the sacred editor. Body finishes (glow/holo bloom; metallic is real PBR
 * with an inline studio Environment) are applied to the outfit materials in the re-shade.
 *
 * The characters are Quaternius CC0 (one shared rig). All are meshopt-compressed
 * in public/models/.
 */

function HeroModel({
  reaction,
  hero,
  accent,
  interactive,
}: {
  reaction: HeroReaction
  hero: HeroCustom
  accent: string
  interactive: boolean
}) {
  const group = useRef<THREE.Group>(null)
  const cfg = characterFrom(hero.character)
  const { scene, animations } = useGLTF(cfg.url)
  const { actions, mixer } = useAnimations(animations, group)
  // Outfit (non-skin) materials that the 'holo' finish animates each frame.
  const holoMats = useRef<THREE.MeshToonMaterial[]>([])

  // Re-shade every mesh with the shared toon ramp so the hero matches the
  // cel-shaded world, keeping each model's own designed colors. The chosen finish
  // (glow/holo/metallic) is applied to the OUTFIT/gear materials only — skin, hair
  // and eyes stay natural, so a metallic soldier still has a normal face.
  useMemo(() => {
    const finish = hero.finish
    holoMats.current = []
    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const convert = (m: THREE.Material): THREE.Material => {
        const src = m as THREE.MeshStandardMaterial
        const color = src.color?.clone() ?? new THREE.Color('#cfd6e4')
        const outfit = !SKIN_RE.test(src.name)
        // Metallic = real PBR (reflects the inline Environment); everything else
        // stays cel-shaded toon, with emissive outfit for glow/holo.
        if (outfit && finish === 'metallic') {
          const out = new THREE.MeshStandardMaterial({
            color,
            map: src.map ?? null,
            transparent: src.transparent,
            opacity: src.opacity,
            metalness: 0.78, // keeps some diffuse color → "painted metal", not black chrome
            roughness: 0.3,
            envMapIntensity: 1.7,
          })
          out.name = src.name
          return out
        }
        const out = new THREE.MeshToonMaterial({
          color,
          map: src.map ?? null,
          transparent: src.transparent,
          opacity: src.opacity,
          gradientMap: getGradientMap(),
        })
        if (outfit && (finish === 'glow' || finish === 'holo')) {
          out.emissive.copy(color)
          out.emissiveIntensity = finish === 'glow' ? 1.2 : 1.1
          if (finish === 'holo') holoMats.current.push(out)
        }
        out.name = src.name
        return out
      }
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(convert) : convert(mesh.material)
    })
  }, [scene, hero.finish])

  // 'holo' finish: cycle the emissive hue of the outfit materials.
  useFrame((state) => {
    if (hero.finish !== 'holo' || holoMats.current.length === 0) return
    const hue = (state.clock.elapsedTime * 0.08) % 1
    for (const mat of holoMats.current) mat.emissive.setHSL(hue, 0.7, 0.5)
  })

  useHeroRig(actions as Record<string, THREE.AnimationAction | null>, mixer, reaction, cfg.clipMap)

  const model = (
    <group ref={group} position={[0, cfg.yOffset, 0]} scale={cfg.scale}>
      <primitive object={scene} />
      {interactive && <HeroExtras accent={accent} landmarks={cfg.landmarks} scale={cfg.scale} />}
    </group>
  )

  // Non-interactive (HeroPanel): render the model directly — no pedestal.
  if (!interactive) return model

  // Interactive (Shop showcase): drag-to-rotate + idle turntable + contact shadow.
  const feetWorld = cfg.yOffset + cfg.landmarks.feet * cfg.scale
  return (
    <>
      <PresentationControls
        global={false}
        cursor
        snap
        speed={1.4}
        polar={[-0.2, 0.35]}
        azimuth={[-Math.PI / 2, Math.PI / 2]}
        config={{ mass: 1, tension: 170, friction: 26 }}
      >
        <TurntableGroup>{model}</TurntableGroup>
      </PresentationControls>
      <ContactShadows
        position={[0, feetWorld, 0]}
        opacity={0.42}
        scale={2.6}
        blur={2.6}
        far={1.8}
        resolution={256}
        color="#05070d"
      />
    </>
  )
}

/** Slowly rotates its children while idle; pauses during a drag and for a beat
 *  after release (listeners on the WebGL canvas). Used only in the interactive
 *  Shop preview. */
function TurntableGroup({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null)
  const paused = useRef(false)
  const resumeAt = useRef(0)
  const { gl, clock } = useThree()

  useEffect(() => {
    const el = gl.domElement
    const down = () => {
      paused.current = true
    }
    const up = () => {
      paused.current = false
      resumeAt.current = clock.elapsedTime + 1.6
    }
    el.addEventListener('pointerdown', down)
    el.addEventListener('pointerup', up)
    el.addEventListener('pointerleave', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      el.removeEventListener('pointerup', up)
      el.removeEventListener('pointerleave', up)
    }
  }, [gl, clock])

  useFrame((state, dt) => {
    if (!ref.current) return
    if (!paused.current && state.clock.elapsedTime >= resumeAt.current) {
      ref.current.rotation.y += dt * 0.35
    }
  })
  return <group ref={ref}>{children}</group>
}

/** A lightweight studio reflection for the metallic finish: a small canvas
 *  gradient (bright sky → dark floor) mapped equirectangular onto `scene.environment`.
 *  Only MeshStandardMaterial (the metallic body) samples it; toon materials ignore it.
 *  Deliberately avoids PMREM / drei <Environment> — those either blanked the alpha
 *  canvas or crashed software-GL; a plain CanvasTexture works everywhere. */
function makeStudioEnvTexture(accent: string): THREE.Texture {
  const c = document.createElement('canvas')
  c.width = 32
  c.height = 16
  const ctx = c.getContext('2d')!
  const g = ctx.createLinearGradient(0, 0, 0, c.height)
  g.addColorStop(0, '#f2f5fb') // bright top → strong metal highlight
  g.addColorStop(0.5, '#9fb0c8') // mid
  g.addColorStop(1, '#161b28') // dark floor
  ctx.fillStyle = g
  ctx.fillRect(0, 0, c.width, c.height)
  // a soft accent band on one side for a colored kick
  const gx = ctx.createLinearGradient(0, 0, c.width, 0)
  gx.addColorStop(0, 'rgba(0,0,0,0)')
  gx.addColorStop(0.5, accent)
  gx.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.globalAlpha = 0.25
  ctx.fillStyle = gx
  ctx.fillRect(0, 0, c.width, Math.floor(c.height * 0.6))
  ctx.globalAlpha = 1
  const tex = new THREE.CanvasTexture(c)
  tex.mapping = THREE.EquirectangularReflectionMapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  return tex
}

function StudioEnv({ accent }: { accent: string }) {
  const { scene } = useThree()
  useEffect(() => {
    const env = makeStudioEnvTexture(accent)
    const prev = scene.environment
    scene.environment = env
    return () => {
      scene.environment = prev
      env.dispose()
    }
  }, [scene, accent])
  return null
}

export default function Hero3D({
  reaction,
  hero,
  interactive = false,
}: {
  reaction: HeroReaction
  hero: HeroCustom
  interactive?: boolean
}) {
  const wrapper = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(true)
  const [hidden, setHidden] = useState(document.hidden)
  const [bloomOn, setBloomOn] = useState(true)
  const accent = useStage((s) => s.accent)

  // Pause rendering when the portrait is off-screen or the tab is hidden.
  useEffect(() => {
    const el = wrapper.current
    if (!el) return
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting))
    io.observe(el)
    const onVis = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => {
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  // Bloom only where there's something emissive to catch it, and only in the
  // interactive showcase (keeps the tiny HeroPanel portrait + its alpha simple).
  const wantsBloom = interactive && (hero.finish === 'glow' || hero.finish === 'holo')
  const isMetallic = hero.finish === 'metallic'

  return (
    <div ref={wrapper} aria-hidden className={interactive ? 'h-full w-full' : 'pointer-events-none h-full w-full'}>
      <Canvas
        dpr={[1, 1.75]}
        frameloop={visible && !hidden ? 'always' : 'never'}
        camera={{ position: [0, 0.25, 4.0], fov: 38 }}
        gl={{ antialias: true, alpha: true }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping
        }}
      >
        <PerformanceMonitor onDecline={() => setBloomOn(false)} />
        <hemisphereLight args={['#8a9bd4', '#141a2a', 1.1]} />
        <directionalLight position={[2, 3, 4]} intensity={1.4} />
        {/* subtle accent rim light for depth (keeps the flat toon banding gentle) */}
        <directionalLight position={[-3, 2, -4]} intensity={0.55} color={accent} />
        <HeroModel reaction={reaction} hero={hero} accent={accent} interactive={interactive} />
        {isMetallic && <StudioEnv accent={accent} />}
        {bloomOn && wantsBloom && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={1} radius={0.6} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  )
}

// Preload only the free default model; paid character GLBs fetch on demand.
useGLTF.preload(CHARACTER_BY_ID[DEFAULT_CHARACTER].url)
