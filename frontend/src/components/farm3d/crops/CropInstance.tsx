import { useMemo, useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { type CropPlot, type GrowthStage, CROP_TYPES } from '../farmStore'

const STAGE_SCALES: Record<GrowthStage, number> = {
  seedling: 0.2, vegetative: 0.45, flowering: 0.7, fruiting: 0.88, harvest: 1.0,
}

const MAX_PLANTS = 400

function getHealthColor(health: number, base: string): string {
  const c = new THREE.Color(base)
  if (health > 75) return c.getStyle()
  if (health > 50) return c.clone().lerp(new THREE.Color('#9B8B3A'), (75 - health) / 25).getStyle()
  if (health > 25) return new THREE.Color('#9B8B3A').lerp(new THREE.Color('#8B6914'), (50 - health) / 25).getStyle()
  return new THREE.Color('#8B6914').lerp(new THREE.Color('#6B4226'), (25 - health) / 25).getStyle()
}

interface PartDef {
  geo: THREE.BufferGeometry
  color: string
  offsetY: number
}

interface FruitDef extends PartDef {
  count: number
  spread: number
}

interface ConfigResult {
  stem: PartDef | null
  foliage: PartDef & { extraInstances?: number }
  fruit: FruitDef | null
}

function getConfig(crop: CropPlot, scale: number): ConfigResult {
  const cd = CROP_TYPES[crop.cropType] || CROP_TYPES.rice
  const hasFruit = crop.stage === 'fruiting' || crop.stage === 'harvest'
  const leafColor = getHealthColor(crop.health, cd.color || '#4CAF50')
  const stemColor = cd.stemColor || '#558B2F'
  const fruitColor = cd.fruitColor || '#FF6B6B'

  const leafColorVibrant = getHealthColor(crop.health, cd.color || '#4CAF50')
  const leafBrighter = new THREE.Color(leafColorVibrant).offsetHSL(0, 0.08, 0.06).getStyle()

  switch (crop.cropType) {
    case 'rice': {
      const h = 0.5 * scale
      return {
        stem: { geo: new THREE.CylinderGeometry(0.01, 0.015, h, 4), color: stemColor, offsetY: h / 2 },
        foliage: { geo: new THREE.ConeGeometry(0.04, 0.12 * scale, 4), color: leafBrighter, offsetY: h * 0.7 },
        fruit: hasFruit ? { geo: new THREE.SphereGeometry(0.015, 4, 4), color: fruitColor, offsetY: h, count: 3, spread: 0.04 } : null,
      }
    }
    case 'wheat': {
      const h = 0.55 * scale
      return {
        stem: { geo: new THREE.CylinderGeometry(0.008, 0.015, h, 4), color: stemColor, offsetY: h / 2 },
        foliage: { geo: new THREE.ConeGeometry(0.035, 0.1 * scale, 4), color: leafBrighter, offsetY: h * 0.7 },
        fruit: hasFruit ? { geo: new THREE.SphereGeometry(0.012, 4, 4), color: fruitColor, offsetY: h, count: 2, spread: 0.03 } : null,
      }
    }
    case 'corn': {
      const h = 0.7 * scale
      return {
        stem: { geo: new THREE.CylinderGeometry(0.02, 0.04, h, 5), color: stemColor, offsetY: h / 2 },
        foliage: { geo: new THREE.ConeGeometry(0.06, 0.25 * scale, 5), color: leafBrighter, offsetY: h * 0.6 },
        fruit: hasFruit ? { geo: new THREE.CylinderGeometry(0.035, 0.04, 0.12 * scale, 6), color: fruitColor, offsetY: h * 0.5, count: 1, spread: 0 } : null,
      }
    }
    case 'tomato': {
      const h = 0.4 * scale
      return {
        stem: { geo: new THREE.CylinderGeometry(0.012, 0.02, h, 4), color: stemColor, offsetY: h / 2 },
        foliage: { geo: new THREE.SphereGeometry(0.1 * scale, 6, 5), color: leafBrighter, offsetY: h * 0.7 },
        fruit: hasFruit ? { geo: new THREE.SphereGeometry(0.04 * scale, 6, 6), color: fruitColor, offsetY: h * 0.5, count: 2, spread: 0.06 } : null,
      }
    }
    case 'sugarcane': {
      const h = 0.8 * scale
      return {
        stem: { geo: new THREE.CylinderGeometry(0.02, 0.03, h, 5), color: leafBrighter, offsetY: h / 2 },
        foliage: { geo: new THREE.ConeGeometry(0.04, 0.1 * scale, 4), color: leafBrighter, offsetY: h },
        fruit: null,
      }
    }
    case 'fruits': {
      const h = 1.5 * scale
      return {
        stem: { geo: new THREE.CylinderGeometry(0.05, 0.09, h * 0.5, 6), color: stemColor, offsetY: h * 0.25 },
        foliage: { geo: new THREE.IcosahedronGeometry(0.5 * scale, 1), color: leafBrighter, offsetY: h * 0.6, extraInstances: 2 },
        fruit: hasFruit ? { geo: new THREE.SphereGeometry(0.05 * scale, 6, 6), color: fruitColor, offsetY: h * 0.65, count: 4, spread: 0.3 * scale } : null,
      }
    }
    default: {
      const h = 0.35 * scale
      return {
        stem: null,
        foliage: { geo: new THREE.IcosahedronGeometry(0.13 * scale, 0), color: leafBrighter, offsetY: h * 0.5, extraInstances: 3 },
        fruit: hasFruit ? { geo: new THREE.SphereGeometry(0.025 * scale, 5, 5), color: fruitColor, offsetY: h * 0.5, count: 2, spread: 0.08 } : null,
      }
    }
  }
}

interface PlantPos {
  x: number; z: number; rotY: number; scaleJitter: number
}

interface Transform {
  x: number; y: number; z: number; rotY: number; scale: number
}

function PlantField({ geo, color, transforms, roughness = 0.8 }: {
  geo: THREE.BufferGeometry
  color: string
  transforms: Transform[]
  roughness?: number
}) {
  const ref = useRef<THREE.InstancedMesh>(null)
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color, roughness }), [color, roughness])

  useEffect(() => {
    const m = ref.current
    if (!m) return
    const d = new THREE.Object3D()
    transforms.forEach((t, i) => {
      d.position.set(t.x, t.y, t.z)
      d.rotation.set(0, t.rotY, 0)
      d.scale.setScalar(t.scale)
      d.updateMatrix()
      m.setMatrixAt(i, d.matrix)
    })
    m.instanceMatrix.needsUpdate = true
  }, [transforms])

  return <instancedMesh ref={ref} args={[geo, mat, transforms.length]} />
}

function CropInstance({ crop, isSelected }: { crop: CropPlot; isSelected: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const cd = CROP_TYPES[crop.cropType] || CROP_TYPES.rice
  const scale = STAGE_SCALES[crop.stage]
  const spacing = cd.spacing || 0.4

  const plantPositions = useMemo(() => {
    const cols = Math.max(1, Math.floor(crop.width / spacing))
    const rows = Math.max(1, Math.floor(crop.depth / spacing))
    let total = cols * rows
    const arr: PlantPos[] = []
    if (total > MAX_PLANTS) {
      const step = total / MAX_PLANTS
      for (let i = 0; i < MAX_PLANTS; i++) {
        const idx = Math.floor(i * step)
        const col = Math.floor(idx / rows)
        const row = idx % rows
        arr.push({
          x: -crop.width / 2 + spacing / 2 + col * spacing + (Math.random() - 0.5) * 0.05,
          z: -crop.depth / 2 + spacing / 2 + row * spacing + (Math.random() - 0.5) * 0.05,
          rotY: Math.random() * Math.PI * 2,
          scaleJitter: 0.85 + Math.random() * 0.3,
        })
      }
    } else {
      for (let i = 0; i < total; i++) {
        const col = Math.floor(i / rows)
        const row = i % rows
        arr.push({
          x: -crop.width / 2 + spacing / 2 + col * spacing + (Math.random() - 0.5) * 0.05,
          z: -crop.depth / 2 + spacing / 2 + row * spacing + (Math.random() - 0.5) * 0.05,
          rotY: Math.random() * Math.PI * 2,
          scaleJitter: 0.85 + Math.random() * 0.3,
        })
      }
    }
    return arr
  }, [crop.width, crop.depth, spacing])

  useFrame((state) => {
    if (groupRef.current) {
      const wind = Math.sin(state.clock.elapsedTime * 0.5 + crop.x * 0.3 + crop.z * 0.2) * 0.012
      groupRef.current.rotation.z = wind
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.3 + crop.z) * 0.005
    }
  })

  const { stemTransforms, foliageTransforms, fruitTransforms, config } = useMemo(() => {
    const cfg = getConfig(crop, scale)
    const stem: Transform[] = []
    const foliage: Transform[] = []
    const fruit: Transform[] = []

    for (const pos of plantPositions) {
      if (cfg.stem) {
        stem.push({
          x: pos.x, y: cfg.stem.offsetY * pos.scaleJitter, z: pos.z,
          rotY: pos.rotY, scale: pos.scaleJitter,
        })
      }
      const extra = cfg.foliage.extraInstances || 0
      foliage.push({
        x: pos.x, y: cfg.foliage.offsetY * pos.scaleJitter, z: pos.z,
        rotY: pos.rotY, scale: pos.scaleJitter,
      })
      for (let k = 0; k < extra; k++) {
        foliage.push({
          x: pos.x + (Math.random() - 0.5) * 0.12,
          y: cfg.foliage.offsetY * pos.scaleJitter + (Math.random() - 0.5) * 0.05,
          z: pos.z + (Math.random() - 0.5) * 0.12,
          rotY: Math.random() * Math.PI * 2,
          scale: pos.scaleJitter * 0.6,
        })
      }
      if (cfg.fruit) {
        for (let k = 0; k < cfg.fruit.count; k++) {
          const a = (k / cfg.fruit.count) * Math.PI * 2 + Math.random() * 0.3
          const r = cfg.fruit.spread * (0.5 + Math.random() * 0.5)
          fruit.push({
            x: pos.x + Math.cos(a) * r,
            y: cfg.fruit.offsetY * pos.scaleJitter + (Math.random() - 0.5) * 0.04,
            z: pos.z + Math.sin(a) * r,
            rotY: 0, scale: pos.scaleJitter * (0.8 + Math.random() * 0.4),
          })
        }
      }
    }

    return { stemTransforms: stem, foliageTransforms: foliage, fruitTransforms: fruit, config: cfg }
  }, [plantPositions, crop.cropType, crop.stage, crop.health, scale])

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
          <ringGeometry args={[Math.max(crop.width, crop.depth) / 2 + 0.2, Math.max(crop.width, crop.depth) / 2 + 0.4, 32]} />
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.4} transparent opacity={0.4} />
        </mesh>
      )}

      {config.stem && <PlantField geo={config.stem.geo} color={config.stem.color} transforms={stemTransforms} roughness={0.85} />}
      <PlantField geo={config.foliage.geo} color={config.foliage.color} transforms={foliageTransforms} />
      {config.fruit && <PlantField geo={config.fruit.geo} color={config.fruit.color} transforms={fruitTransforms} roughness={0.5} />}

      {crop.waterStress > 80 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <planeGeometry args={[crop.width * 0.3, crop.depth * 0.3]} />
          <meshBasicMaterial color="#5DBF5D" transparent opacity={0.05} />
        </mesh>
      )}
    </group>
  )
}

export default CropInstance
