import { useRef, useMemo, useState, useEffect } from 'react'
import { Canvas, useFrame, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Sky, Html, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useFarmStore, CROP_TYPES, type CropPlot, type GrowthStage, type WeatherCondition } from './farmStore'

function getWeatherMode(condition?: WeatherCondition, isNight?: boolean): { mode: 'clear' | 'cloudy' | 'rainy' | 'night'; intensity: number } {
  if (isNight) return { mode: 'night', intensity: 0 }
  const c = condition || 'clear'
  if (c === 'heavy_rain' || c === 'thunderstorm') return { mode: 'rainy', intensity: 1 }
  if (c === 'light_rain') return { mode: 'rainy', intensity: 0.5 }
  if (c === 'cloudy' || c === 'fog' || c === 'hazy') return { mode: 'cloudy', intensity: 1 }
  if (c === 'partly_cloudy') return { mode: 'cloudy', intensity: 0.4 }
  if (c === 'windy') return { mode: 'cloudy', intensity: 0.3 }
  return { mode: 'sunny' as any, intensity: 1 }
}

function CropPlant({ crop, isSelected, onClick, onPointerDown, showResizeHandles, onResizeHandleActivate }: {
  crop: CropPlot; isSelected: boolean; onClick: () => void; onPointerDown: (e: ThreeEvent<PointerEvent>) => void
  showResizeHandles: boolean; onResizeHandleActivate: (dir: 'north' | 'south' | 'west' | 'east') => void
}) {
  const groupRef = useRef<THREE.Group>(null)
  const [hovered, setHovered] = useState(false)
  const cropData = CROP_TYPES[crop.cropType] || CROP_TYPES.rice
  const leafColor = new THREE.Color(cropData.color)
  const fruitColor = cropData.fruitColor ? new THREE.Color(cropData.fruitColor) : leafColor
  const stemColor = new THREE.Color(cropData.stemColor)

  const stageScale = useMemo(() => {
    switch (crop.stage) {
      case 'seedling': return 0.25
      case 'vegetative': return 0.5
      case 'flowering': return 0.72
      case 'fruiting': return 0.9
      case 'harvest': return 1.0
      default: return 0.4
    }
  }, [crop.stage])

  const healthColor = useMemo(() => {
    if (crop.health > 80) return leafColor
    if (crop.health > 50) return leafColor.clone().lerp(new THREE.Color('#8B4513'), 0.25)
    if (crop.health > 25) return leafColor.clone().lerp(new THREE.Color('#A0522D'), 0.55)
    return new THREE.Color('#8B4513')
  }, [crop.health, leafColor])

  useFrame((state) => {
    if (groupRef.current) {
      const wind = Math.sin(state.clock.elapsedTime * 0.8 + crop.x * 0.3 + crop.z * 0.2) * 0.08
      groupRef.current.rotation.z = wind
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.6 + crop.z * 0.4) * 0.04
    }
  })

  const isTree = crop.cropType === 'fruits'
  const cols = Math.max(1, Math.floor(crop.width / cropData.spacing))
  const rows = Math.max(1, Math.floor(crop.depth / cropData.spacing))

  const plantPositions = useMemo(() => {
    const positions: { x: number; z: number }[] = []
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        positions.push({
          x: -crop.width / 2 + cropData.spacing / 2 + i * cropData.spacing + (Math.random() - 0.5) * 0.1,
          z: -crop.depth / 2 + cropData.spacing / 2 + j * cropData.spacing + (Math.random() - 0.5) * 0.1,
        })
      }
    }
    return positions
  }, [crop.width, crop.depth, cropData.spacing])

  const healthColorHex = `#${healthColor.getHexString()}`
  const alertColor = crop.health > 80 ? '#10B981' : crop.health > 50 ? '#F59E0B' : '#EF4444'

  return (
    <group
      ref={groupRef}
      position={[crop.x, 0, crop.z]}
      onPointerDown={(e) => { e.stopPropagation(); onPointerDown(e) }}
      onClick={(e) => { e.stopPropagation(); onClick() }}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[crop.width + 0.2, crop.depth + 0.2]} />
        <meshStandardMaterial color={crop.health > 60 ? '#5D4037' : '#8D6E63'} roughness={0.95} metalness={0} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
        <planeGeometry args={[crop.width, crop.depth]} />
        <meshStandardMaterial color="#6D4C41" roughness={1} metalness={0} />
      </mesh>

      {(isSelected || hovered) && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
          <ringGeometry args={[Math.max(crop.width, crop.depth) / 2 + 0.1, Math.max(crop.width, crop.depth) / 2 + 0.35, 48]} />
          <meshStandardMaterial color={isSelected ? '#10B981' : '#3B82F6'} emissive={isSelected ? '#10B981' : '#3B82F6'} emissiveIntensity={isSelected ? 0.6 : 0.15} transparent opacity={0.5} />
        </mesh>
      )}

      {isSelected && showResizeHandles && (
        <group position={[0, 0.2, 0]}>
          {[
            { dir: 'north' as const, pos: [0, 0, -crop.depth / 2 - 0.55], ry: 0 },
            { dir: 'south' as const, pos: [0, 0, crop.depth / 2 + 0.55], ry: Math.PI },
            { dir: 'west' as const, pos: [-crop.width / 2 - 0.55, 0, 0], ry: -Math.PI / 2 },
            { dir: 'east' as const, pos: [crop.width / 2 + 0.55, 0, 0], ry: Math.PI / 2 },
          ].map((h) => (
            <group key={h.dir} position={h.pos as [number, number, number]} rotation={[0, h.ry, 0]}>
              <mesh position={[0, 0.08, 0]} onClick={(e) => { e.stopPropagation(); onResizeHandleActivate(h.dir) }}>
                <cylinderGeometry args={[0.025, 0.04, 0.5, 8]} />
                <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.3} metalness={0.4} roughness={0.4} />
              </mesh>
              <mesh position={[0, 0.35, 0]}>
                <coneGeometry args={[0.06, 0.15, 12]} />
                <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.3} metalness={0.3} roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      )}

      {plantPositions.map((pos, idx) => (
        <group key={idx} position={[pos.x, 0, pos.z]}>
          {isTrees ? (
            <TreeModel stageScale={stageScale} healthColor={healthColor} fruitColor={fruitColor} stage={crop.stage} />
          ) : (
            <CropPlantModel stageScale={stageScale} healthColor={healthColor} fruitColor={fruitColor} stemColor={stemColor} stage={crop.stage} cropType={crop.cropType} />
          )}
        </group>
      ))}

      {crop.waterStress > 50 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
          <planeGeometry args={[crop.width * 0.4, crop.depth * 0.4]} />
          <meshBasicMaterial color="#8B4513" transparent opacity={0.15} />
        </mesh>
      )}

      <Billboard position={[0, (isTrees ? 2.5 : 1.0) * stageScale + 0.5, 0]}>
        <Html center>
          <div className="flex flex-col items-center">
            <div className={`px-2 py-0.5 rounded-t-lg text-[10px] font-semibold whitespace-nowrap`}
              style={{ background: isSelected ? '#10B981' : '#333', color: 'white' }}>
              {crop.notes || (crop.stage === 'harvest' ? 'Harvest' : 'Monitor')}
            </div>
            <div className="px-2 py-1 rounded-b-lg text-xs font-medium whitespace-nowrap"
              style={{ background: isSelected ? 'rgba(16,185,129,0.9)' : 'rgba(0,0,0,0.75)', color: 'white' }}>
              {crop.name} · {cropData.icon ?? ''}
            </div>
          </div>
        </Html>
      </Billboard>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[crop.width / 2 + 0.3, 0.12, -crop.depth / 2 - 0.3]}>
        <planeGeometry args={[0.5, 0.5]} />
        <meshStandardMaterial color={alertColor} />
      </mesh>
    </group>
  )
}

function CropPlantModel({ stageScale, healthColor, fruitColor, stemColor, stage, cropType }: {
  stageScale: number; healthColor: THREE.Color; fruitColor: THREE.Color; stemColor: THREE.Color; stage: GrowthStage; cropType: string
}) {
  const height = stageScale * 0.6
  const leafCount = stageScale > 0.5 ? 6 : 4
  const isTallCrop = cropType === 'rice' || cropType === 'wheat' || cropType === 'corn' || cropType === 'sugarcane'

  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.035, height, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.8} />
      </mesh>

      {cropType === 'sugarcane' ? (
        [...Array(3)].map((_, i) => (
          <mesh key={i} position={[0.04 * (i - 1), height * (0.3 + i * 0.2), 0]}>
            <boxGeometry args={[0.32, 0.015, 0.08]} />
            <meshStandardMaterial color={healthColor} roughness={0.7} />
          </mesh>
        ))
      ) : isTallCrop ? (
        [...Array(leafCount)].map((_, k) => (
          <mesh key={k} position={[0.06 * (k % 2 === 0 ? 1 : -1), height * (0.2 + k * 0.12), 0]}
            rotation={[0.2, k * Math.PI / 3, 0.15]}>
            <boxGeometry args={[0.25, 0.015, 0.08]} />
            <meshStandardMaterial color={healthColor} roughness={0.7} />
          </mesh>
        ))
      ) : (
        [...Array(leafCount)].map((_, k) => (
          <group key={k}>
            <mesh position={[0.1, height * (0.2 + k * 0.12), 0]}
              rotation={[0.4, k * Math.PI / 3, 0.2]}>
              <boxGeometry args={[0.22, 0.015, 0.1]} />
              <meshStandardMaterial color={healthColor} roughness={0.7} />
            </mesh>
          </group>
        ))
      )}

      {(stage === 'fruiting' || stage === 'harvest') && cropType !== 'sugarcane' && (
        <mesh position={[0.06, height * 0.55, 0.06]}>
          <sphereGeometry args={[0.08 * stageScale * 2, 8, 8]} />
          <meshStandardMaterial color={fruitColor} roughness={0.4} metalness={0.1} />
        </mesh>
      )}

      {stage === 'flowering' && (
        <mesh position={[0, height * 0.75, 0]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#FFD700" emissive="#FFD700" emissiveIntensity={0.2} />
        </mesh>
      )}

      {cropType === 'corn' && stage === 'fruiting' && (
        <mesh position={[0.05, height * 0.45, 0]}>
          <sphereGeometry args={[0.06, 6, 6]} />
          <meshStandardMaterial color="#DAA520" roughness={0.6} />
        </mesh>
      )}
    </group>
  )
}

function TreeModel({ stageScale, healthColor, fruitColor, stage }: {
  stageScale: number; healthColor: THREE.Color; fruitColor: THREE.Color; stage: GrowthStage
}) {
  const height = stageScale * 2.5
  const canopyRadius = stageScale * 1.2

  return (
    <group>
      <mesh position={[0, height * 0.15, 0]}>
        <cylinderGeometry args={[0.04, 0.1, height * 0.3, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>

      <mesh position={[0, height * 0.5, 0]}>
        <sphereGeometry args={[canopyRadius, 12, 12]} />
        <meshStandardMaterial color={healthColor} roughness={0.8} />
      </mesh>

      <mesh position={[0.2, height * 0.35, 0.15]}>
        <sphereGeometry args={[canopyRadius * 0.7, 10, 10]} />
        <meshStandardMaterial color={healthColor} roughness={0.8} />
      </mesh>

      {(stage === 'fruiting' || stage === 'harvest') && (
        [...Array(5)].map((_, i) => (
          <mesh key={i} position={[(Math.random() - 0.5) * canopyRadius, height * (0.3 + Math.random() * 0.3), (Math.random() - 0.5) * canopyRadius]}>
            <sphereGeometry args={[0.06, 6, 6]} />
            <meshStandardMaterial color={fruitColor} roughness={0.4} />
          </mesh>
        ))
      )}
    </group>
  )
}

function Terrain() {
  const isNight = useFarmStore((s) => s.isNight)

  const grassCount = 800
  const grassRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const grassPositions = useMemo(() => {
    const arr: { x: number; z: number; scale: number; phase: number }[] = []
    for (let i = 0; i < grassCount; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 44,
        z: (Math.random() - 0.5) * 44,
        scale: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return arr
  }, [])

  useFrame((state) => {
    if (grassRef.current) {
      for (let i = 0; i < grassCount; i++) {
        const g = grassPositions[i]
        const wave = Math.sin(state.clock.elapsedTime * 1.5 + g.phase) * 0.08
        dummy.position.set(g.x, 0.04, g.z)
        dummy.scale.setScalar(g.scale * (1 + wave * 0.3))
        dummy.rotation.set(wave * 0.5, g.phase, 0)
        dummy.updateMatrix()
        grassRef.current.setMatrixAt(i, dummy.matrix)
      }
      grassRef.current.instanceMatrix.needsUpdate = true
    }
  })

  const groundColor = isNight ? '#1a3a0a' : '#4A7C23'

  const farmBoundary = useMemo(() => {
    const points: [number, number][] = []
    for (let i = 0; i <= 64; i++) {
      const t = (i / 64) * Math.PI * 2
      const rx = 13 + Math.sin(t * 2) * 0.3
      const rz = 13 + Math.cos(t * 1.5) * 0.3
      points.push([Math.cos(t) * rx, Math.sin(t) * rz])
    }
    return points
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={groundColor} roughness={1} metalness={0} />
      </mesh>

      <instancedMesh ref={grassRef} args={[undefined, undefined, grassCount]}>
        <coneGeometry args={[0.02, 0.12, 4]} />
        <meshStandardMaterial color={isNight ? '#1a4a10' : '#3D6B1E'} roughness={0.9} />
      </instancedMesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 6]}>
        <planeGeometry args={[2.5, 22]} />
        <meshStandardMaterial color="#8B7355" roughness={0.95} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.5, 0.03, -5]}>
        <planeGeometry args={[1.5, 8]} />
        <meshStandardMaterial color="#A0896A" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -6]}>
        <planeGeometry args={[14, 2.5]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>

      {[...Array(8)].map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        const [r, s] = farmBoundary[i * 8] || [13, 12]
        const x = Math.cos(angle) * r
        const z = Math.sin(angle) * s
        const nx = Math.cos(angle)
        const nz = Math.sin(angle)
        return (
          <mesh key={i} position={[x, 0.5, z]} rotation={[0, -Math.atan2(nx, nz), 0]}>
            <boxGeometry args={[0.12, 0.8, 0.12]} />
            <meshStandardMaterial color="#4E342E" roughness={0.9} />
          </mesh>
        )
      })}

      {[...Array(4)].map((_, i) => [
        { x: 0, z: 13 }, { x: 0, z: -13 }, { x: 13, z: 0 }, { x: -13, z: 0 }
      ].map((p, j) => (
        <mesh key={`post-${i}-${j}`} position={[p.x + (i - 1.5) * 6 * (p.x === 0 ? 0.95 : 0), 0.5, p.z + (i - 1.5) * 6 * (p.z === 0 ? 0.95 : 0)]}
          rotation={p.x === 0 ? [0, Math.PI / 2, 0] : [0, 0, 0]}>
          <boxGeometry args={[0.1, 0.7, 0.1]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
      )))}
    </group>
  )
}

function IrrigationSystem() {
  const { crops } = useFarmStore()
  const activePipes = crops.filter(c => c.irrigationEnabled)

  return (
    <group>
      {activePipes.map((crop) => (
        <group key={`irr-${crop.id}`} position={[crop.x, 0.08, crop.z]}>
          {['east', 'west'].map((dir) => (
            <mesh key={dir} position={[dir === 'east' ? crop.width / 2 + 0.15 : -crop.width / 2 - 0.15, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.02, 0.02, crop.depth, 6]} />
              <meshStandardMaterial color={crop.waterStress > 40 ? '#3B82F6' : '#60A5FA'} emissive={crop.waterStress > 40 ? '#3B82F6' : undefined} emissiveIntensity={crop.waterStress > 40 ? 0.3 : 0} transparent opacity={0.7} />
            </mesh>
          ))}
          <mesh position={[0, 0, crop.depth / 2 + 0.1]} rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.15, 6]} />
            <meshStandardMaterial color="#2563EB" />
          </mesh>
          <mesh position={[0, 0.08, crop.depth / 2 + 0.15]}>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color="#60A5FA" emissive="#60A5FA" emissiveIntensity={0.2} transparent opacity={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function FarmStructures() {
  return (
    <group>
      <mesh position={[-11, 0, -9]} castShadow>
        <boxGeometry args={[1.5, 0.15, 1.2]} />
        <meshStandardMaterial color="#666" roughness={0.8} />
      </mesh>

      <mesh position={[-10.2, 0.5, -8.5]}>
        <boxGeometry args={[0.5, 0.8, 0.5]} />
        <meshStandardMaterial color="#888" roughness={0.7} />
      </mesh>

      <mesh position={[-11.8, 0.6, -10.2]}>
        <boxGeometry args={[0.4, 1.0, 0.4]} />
        <meshStandardMaterial color="#FF8C00" roughness={0.5} />
      </mesh>

      <mesh position={[8.5, 0, 8.5]} castShadow>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshStandardMaterial color="#555" roughness={0.8} />
      </mesh>

      <mesh position={[8.5, 0.4, 8.5]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 6]} />
        <meshStandardMaterial color="#777" metalness={0.3} roughness={0.5} />
      </mesh>

      <mesh position={[8.5, 0.8, 8.5]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#3B82F6" emissive="#3B82F6" emissiveIntensity={0.3} />
      </mesh>
    </group>
  )
}

function FarmAnimals() {
  const animals = useMemo(() => {
    return [...Array(3)].map((_, i) => ({
      x: -7 + i * 3.5 + Math.random(),
      z: -10 + (Math.random() - 0.5) * 2,
      scale: 0.06 + Math.random() * 0.05,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.2,
    }))
  }, [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    animals.forEach((animal, i) => {
      const group = animalRefs.current[i]
      if (group) {
        group.position.x = animal.x + Math.sin(time * animal.speed + animal.phase) * 2
        group.position.z = animal.y + Math.cos(time * animal.speed * 0.7 + animal.phase) * 1.5
        group.rotation.y = Math.sin(time * animal.speed + animal.phase) * 0.5
      }
    })
  })

  const animalRefs = useRef<THREE.Group[]>([])

  return (
    <group>
      {animals.map((animal, i) => (
        <group key={i} ref={(ref) => { if (ref) animalRefs.current[i] = ref }} position={[animal.x, 0.05, animal.y]} scale={animal.scale}>
          <mesh position={[0, 0.2, -0.15]}>
            <sphereGeometry args={[0.2, 12, 12]} />
            <meshStandardMaterial color="#F5F5DC" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0.15, 0.15]}>
            <sphereGeometry args={[0.15, 10, 10]} />
            <meshStandardMaterial color="#F5F5DC" roughness={0.8} />
          </mesh>
          {[...Array(4)].map((_, j) => (
            <mesh key={j} position={[
              (j % 2 === 0 ? 0.12 : -0.12),
              0.05,
              (j < 2 ? -0.25 : 0.2)
            ]}>
              <cylinderGeometry args={[0.02, 0.03, 0.12, 6]} />
              <meshStandardMaterial color="#D2B48C" />
            </mesh>
          ))}
          <mesh position={[0.15, 0.3, -0.15]}>
            <coneGeometry args={[0.04, 0.15, 6]} />
            <meshStandardMaterial color="#D2B48C" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function WeatherEffects() {
  const weather = useFarmStore((s) => s.weather)
  const isNight = useFarmStore((s) => s.isNight)
  const { mode, intensity } = getWeatherMode(weather?.condition, isNight)
  const rainRef = useRef<THREE.LineSegments>(null)
  const cloudRef = useRef<THREE.Group>(null)

  const rainCount = useMemo(() => Math.floor(400 * intensity * (mode === 'rainy' ? 1 : 0)), [mode, intensity])
  const rainPositions = useMemo(() => {
    const positions = new Float32Array(rainCount * 6)
    const speeds = new Float32Array(rainCount)
    for (let i = 0; i < rainCount; i++) {
      const x = (Math.random() - 0.5) * 48
      const y = 10 + Math.random() * 18
      const z = (Math.random() - 0.5) * 48
      const len = 0.3 + Math.random() * 0.4
      const base = i * 6
      positions[base] = x; positions[base + 1] = y; positions[base + 2] = z
      positions[base + 3] = x + 0.01; positions[base + 4] = y - len; positions[base + 5] = z + 0.01
      speeds[i] = 0.12 + Math.random() * 0.14
    }
    return { positions, speeds }
  }, [rainCount])

  useFrame(() => {
    if (rainRef.current && mode === 'rainy' && rainCount > 0) {
      const pos = rainRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < rainCount; i++) {
        const base = i * 6
        pos[base + 1] -= rainPositions.speeds[i]; pos[base + 4] -= rainPositions.speeds[i]
        if (pos[base + 1] < 0) {
          pos[base] = (Math.random() - 0.5) * 48; pos[base + 1] = 14 + Math.random() * 12
          pos[base + 2] = (Math.random() - 0.5) * 48
          pos[base + 3] = pos[base] + 0.01; pos[base + 4] = pos[base + 1] - (0.4 + Math.random() * 0.5); pos[base + 5] = pos[base + 2] + 0.01
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true
    }
    if (cloudRef.current && mode !== 'night') {
      cloudRef.current.children.forEach((child) => {
        child.position.x += 0.003; if (child.position.x > 25) child.position.x = -25
      })
    }
  })

  const cloudCount = mode === 'rainy' ? 12 : mode === 'cloudy' ? 10 : mode === 'sunny' ? 3 : 0
  const cloudScale = mode === 'rainy' ? 1.8 : mode === 'cloudy' ? 2.0 : 1.0

  if (mode === 'night') return null

  return (
    <group>
      {mode === 'rainy' && rainCount > 0 && (
        <lineSegments ref={rainRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={rainCount * 2} array={rainPositions.positions} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial color="#B0D4FF" transparent opacity={Math.min(0.7, intensity)} />
        </lineSegments>
      )}
      <group ref={cloudRef} position={[0, 11, 0]}>
        {[...Array(cloudCount)].map((_, i) => {
          const angle = (i / cloudCount) * Math.PI * 2
          return (
            <group key={i} position={[Math.cos(angle) * 14 + (Math.random() - 0.5) * 2, Math.sin(i * 1.3) * 1.5 + 10 + Math.random() * 2, Math.sin(angle) * 13 + (Math.random() - 0.5) * 2]}
              scale={cloudScale * (0.7 + Math.random() * 0.6)}>
              {[[-1, 0, 0], [0, 0.3, 0], [1, 0, 0], [-0.3, 0.7, 0.1], [0.7, 0.6, -0.1]].map((p, j) => (
                <mesh key={j} position={[p[0], p[1], p[2]]}>
                  <sphereGeometry args={[1.5 + j * 0.05, 14, 14]} />
                  <meshStandardMaterial color={mode === 'rainy' ? '#B0C4DE' : '#D9E2EA'} transparent opacity={0.85} roughness={1} />
                </mesh>
              ))}
            </group>
          )
        })}
      </group>
    </group>
  )
}

function DynamicLighting() {
  const isNight = useFarmStore((s) => s.isNight)
  const weather = useFarmStore((s) => s.weather)
  const dayPhase = useFarmStore((s) => s.dayPhase)
  const { mode, intensity } = getWeatherMode(weather?.condition, isNight)

  const ambientLevel = isNight ? 0.08 : mode === 'rainy' ? 0.3 * intensity : mode === 'cloudy' ? 0.5 * (0.5 + intensity * 0.5) : 0.6
  const sunLevel = isNight ? 0.02 : mode === 'rainy' ? 0.3 * intensity : mode === 'cloudy' ? 0.5 * (0.4 + intensity * 0.6) : 1.0

  const sunHeight = dayPhase === 'dawn' || dayPhase === 'dusk' ? 8 : dayPhase === 'noon' ? 26 : 18
  const sunTemp = dayPhase === 'dawn' || dayPhase === 'dusk' ? '#FF8C42' : '#FFE08A'

  return (
    <>
      <ambientLight intensity={ambient} color={mode === 'sunny' ? '#FFE4B5' : '#C8D8E8'} />
      <directionalLight
        position={[sunHeight * 0.7, sunHeight, sunHeight * 0.6]}
        intensity={sunLevel}
        color={sunTemp}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
      />
      {isNight && (
        <>
          <pointLight position={[0, 6, 0]} intensity={0.25} color="#FDE68A" />
          <pointLight position={[-3, 3, -4]} intensity={0.15} color="#FCD34D" />
        </>
      )}
    </>
  )
}

const cloudScale = 1

function CameraController() {
  const cameraMode = useFarmStore((s) => s.cameraMode)
  const { camera } = useThree()

  return (
    <OrbitControls
      enablePan={cameraMode !== 'top'}
      enableRotate={cameraMode !== 'top'}
      enableZoom={true}
      minDistance={3}
      maxDistance={45}
      maxPolarAngle={cameraMode === 'top' ? 0.1 : Math.PI / 2 - 0.05}
      target={[0, 0, 0]}
      makeDefault
    />
  )
}

export function FarmScene() {
  const {
    crops, selectedCrop, selectCrop, showGrid, editMode, selectedTool,
    updateCrop, addCrop, removeCrop,
  } = useFarmStore()
  const weather = useFarmStore((s) => s.weather)
  const isNight = useFarmStore((s) => s.isNight)
  const dayPhase = useFarmStore((s) => s.dayPhase)
  const { mode } = getWeatherMode(weather?.condition, isNight)

  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef<null | { cropId: string; startPoint: { x: number; z: number }; initial: { x: number; z: number; width: number; depth: number } }>(null)

  const clamp = (v: number) => Math.max(-11, Math.min(11, v))
  const clampSize = (v: number) => Math.max(0.5, Math.min(10, v))

  const handleCropClick = (cropId: string) => {
    if (editMode && selectedTool === 'delete') {
      removeCrop(cropId); if (selectedCrop === cropId) selectCrop(null)
      return
    }
    selectCrop(cropId === selectedCrop ? null : cropId)
  }

  const handleCropPointerDown = (crop: CropPlot, event: ThreeEvent<PointerEvent>) => {
    if (!editMode || selectedTool !== 'move') return
    dragState.current = {
      cropId: crop.id,
      startPoint: { x: event.point.x, z: event.point.z },
      initial: { x: crop.x, z: crop.z },
    }
    setIsDragging(true); selectCrop(crop.id)
  }

  const handleDragMove = (event: ThreeEvent<PointerEvent>) => {
    const drag = dragState.current
    if (!drag) return
    updateCrop(drag.cropId, {
      x: clamp(drag.initial.x + event.point.x - drag.startPoint.x),
      z: clamp(drag.initial.z + event.point.z - drag.startPoint.z),
    })
  }

  const stopDragging = () => { dragState.current = null; setIsDragging(false) }

  const handleResizeActivate = (crop: CropPlot, dir: 'north' | 'south' | 'west' | 'east') => {
    const step = 0.5
    const next = { x: crop.x, z: crop.z, width: crop.width, depth: crop.depth }
    if (dir === 'east' || dir === 'west') {
      next.width = clampSize(crop.width + step)
      if (dir === 'west') next.x = clamp(crop.x - step / 2)
    } else {
      next.depth = clampSize(crop.depth + step)
      if (dir === 'north') next.z = clampPos(crop.z - step / 2)
    }
    updateCrop(crop.id, next); selectCrop(crop.id)
  }

  const handleGroundClick = (point: { x: number; z: number }) => {
    if (!editMode || selectedTool !== 'add') { if (!editMode) selectCrop(null); return }
    const newId = `plot_${Date.now()}`
    const now = new Date(); const harvest = new Date(now); harvest.setDate(harvest.getDate() + 90)
    addCrop({
      id: newId, name: `New Plot ${crops.length + 1}`, cropType: 'rice',
      x: clamp(point.x), z: clamp(point.z), width: 3, depth: 3,
      stage: 'seedling', health: 90, plantedDate: now.toISOString().slice(0, 10),
      expectedHarvest: harvest.toISOString().slice(0, 10),
      irrigationEnabled: true, irrigationMethod: 'drip', yieldEstimate: 2000,
      pestRisk: 10, waterStress: 5, nutrientDeficiency: [],
      taskHistory: [],
    })
    selectCrop(newId)
  }

  const clampPos = (v: number) => Math.max(-11, Math.min(11, v))

  const skyColor = isNight ? '#0a0a1a' : mode === 'rainy' ? '#6B7B8D' : mode === 'cloudy' ? '#8CA8C0' : '#4A90D9'

  return (
    <Canvas
      shadows
      camera={{ position: [16, 15, 16], fov: 50 }}
      style={{ background: skyColor }}
      gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0 }}
    >
      <DynamicLighting />
      <fog attach="fog" args={[skyColor, isNight ? 18 : mode === 'rainy' ? 20 : mode === 'cloudy' ? 24 : 30, 45]} />
      <Sky
        sunPosition={dayPhase === 'dawn' ? [50, 8, 60] : dayPhase === 'dusk' ? [-50, 8, -60] : [100, 24, 90]}
        turbidity={mode === 'rainy' ? 8 : mode === 'cloudy' ? 4 : 0.5}
        rayleigh={dayPhase === 'dawn' || dayPhase === 'dusk' ? 4 : 1.2}
        mieCoefficient={mode === 'rainy' ? 0.05 : 0.006}
        mieDirectionalG={0.9}
      />
      <WeatherEffects />
      <Terrain />
      <IrrigationSystem />
      <FarmStructures />
      <FarmAnimals />

      {showGrid && (
        <gridHelper args={[50, 25, '#2D5016', '#2D5016']} position={[0, 0.01, 0]} />
      )}

      {crops.map((crop) => (
        <CropPlant
          key={crop.id}
          crop={crop}
          isSelected={selectedCrop === crop.id}
          onClick={() => handleCropClick(crop.id)}
          onPointerDown={(event) => handleCropPointerDown(crop, event)}
          showResizeHandles={selectedTool === 'resize' && editMode}
          onResizeHandleActivate={(dir) => handleResizeActivate(crop, dir)}
        />
      ))}

      {isDragging && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.15, 0]}
          onPointerMove={handleDragMove} onPointerUp={stopDragging} onPointerLeave={stopDragging}>
          <planeGeometry args={[60, 60]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      )}

      <CameraController />
    </Canvas>
  )
}

export default FarmScene