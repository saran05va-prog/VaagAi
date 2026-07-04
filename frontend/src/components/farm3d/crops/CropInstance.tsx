import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFarmStore, type CropPlot, type GrowthStage, CROP_TYPES } from '../farmStore'

const STAGE_SCALES: Record<GrowthStage, number> = {
  seedling: 0.2,
  vegetative: 0.45,
  flowering: 0.7,
  fruiting: 0.88,
  harvest: 1.0,
}

function lerpColor(a: THREE.Color, b: THREE.Color, t: number) {
  return a.clone().lerp(b, t)
}

function getHealthColor(health: number, base: THREE.Color) {
  if (health > 75) return base
  if (health > 50) return lerpColor(base, new THREE.Color('#9B8B3A'), (75 - health) / 25)
  if (health > 25) return lerpColor(new THREE.Color('#9B8B3A'), new THREE.Color('#8B6914'), (50 - health) / 25)
  return lerpColor(new THREE.Color('#8B6914'), new THREE.Color('#6B4226'), (25 - health) / 25)
}

function RicePlant({ scale, health, stage }: { scale: number; health: number; stage: GrowthStage }) {
  const baseColor = new THREE.Color('#7CB342')
  const stemColor = new THREE.Color('#558B2F')
  const grainColor = new THREE.Color('#D4A843')
  const leafColor = getHealthColor(health, baseColor)

  const height = 0.5 * scale
  const stems = useMemo(() => {
    const arr: { angle: number; tilt: number; h: number }[] = []
    for (let i = 0; i < 5; i++) {
      arr.push({ angle: (i / 5) * Math.PI * 2, tilt: 0.15 + Math.random() * 0.1, h: height * (0.8 + Math.random() * 0.3) })
    }
    return arr
  }, [height])

  return (
    <group>
      {stems.map((s, i) => (
        <group key={i} rotation={[s.tilt * Math.cos(s.angle), s.angle, s.tilt * Math.sin(s.angle)]}>
          <mesh position={[0, s.h / 2, 0]}>
            <cylinderGeometry args={[0.008, 0.015, s.h, 4]} />
            <meshStandardMaterial color={stemColor} roughness={0.85} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} position={[0.04, s.h * (0.4 + k * 0.18), 0]} rotation={[0, 0, 0.6 + k * 0.15]}>
              <planeGeometry args={[0.12, 0.025]} />
              <meshStandardMaterial color={leafColor} roughness={0.8} side={THREE.DoubleSide} />
            </mesh>
          ))}
          {(stage === 'fruiting' || stage === 'harvest') && (
            <group position={[0, s.h + 0.05, 0]}>
              {Array.from({ length: 8 }).map((_, j) => {
                const a = (j / 8) * Math.PI * 2
                const r = 0.05
                return (
                  <mesh key={j} position={[Math.cos(a) * r, -j * 0.012, Math.sin(a) * r]}>
                    <sphereGeometry args={[0.012, 4, 4]} />
                    <meshStandardMaterial color={grainColor} roughness={0.5} />
                  </mesh>
                )
              })}
            </group>
          )}
        </group>
      ))}
    </group>
  )
}

function WheatPlant({ scale, health, stage }: { scale: number; health: number; stage: GrowthStage }) {
  const baseColor = new THREE.Color('#A8B84A')
  const stemColor = new THREE.Color('#8B7D3B')
  const grainColor = new THREE.Color('#D4B860')
  const leafColor = getHealthColor(health, baseColor)

  const height = 0.55 * scale
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <group key={i} rotation={[0.08, (i / 3) * Math.PI * 2, 0.08]}>
          <mesh position={[0, height / 2, 0]}>
            <cylinderGeometry args={[0.01, 0.02, height, 4]} />
            <meshStandardMaterial color={stemColor} roughness={0.85} />
          </mesh>
          <mesh position={[0.06, height * 0.45, 0]} rotation={[0, 0, 0.8]}>
            <planeGeometry args={[0.15, 0.02]} />
            <meshStandardMaterial color={leafColor} roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          {(stage === 'fruiting' || stage === 'harvest') && (
            <group position={[0, height + 0.02, 0]}>
              {Array.from({ length: 12 }).map((_, j) => (
                <mesh key={j} position={[0, -j * 0.015, 0]} rotation={[0, 0, (j % 2 ? 1 : -1) * 0.5]}>
                  <planeGeometry args={[0.04, 0.02]} />
                  <meshStandardMaterial color={grainColor} roughness={0.5} side={THREE.DoubleSide} />
                </mesh>
              ))}
            </group>
          )}
          {stage === 'flowering' && (
            <mesh position={[0, height + 0.02, 0]}>
              <coneGeometry args={[0.02, 0.06, 4]} />
              <meshStandardMaterial color="#F0E68C" roughness={0.6} />
            </mesh>
          )}
        </group>
      ))}
    </group>
  )
}

function CornPlant({ scale, health, stage }: { scale: number; health: number; stage: GrowthStage }) {
  const baseColor = new THREE.Color('#4CAF50')
  const stemColor = new THREE.Color('#33691E')
  const earColor = new THREE.Color('#FFD54F')
  const silkColor = new THREE.Color('#BF360C')
  const leafColor = getHealthColor(health, baseColor)

  const height = 0.7 * scale
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.04, height, 6]} />
        <meshStandardMaterial color={stemColor} roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i / 6) * Math.PI * 2
        const yOffset = height * (0.3 + (i % 3) * 0.2)
        return (
          <group key={i} position={[0, yOffset, 0]} rotation={[0.4, angle, 0]}>
            <mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.3]}>
              <planeGeometry args={[0.35, 0.08]} />
              <meshStandardMaterial color={leafColor} roughness={0.75} side={THREE.DoubleSide} />
            </mesh>
          </group>
        )
      })}
      {(stage === 'fruiting' || stage === 'harvest') && (
        <group position={[0.06, height * 0.5, 0]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.05, 0.18, 8]} />
            <meshStandardMaterial color={earColor} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.12, 0]}>
            <coneGeometry args={[0.015, 0.06, 4]} />
            <meshStandardMaterial color={silkColor} roughness={0.7} />
          </mesh>
        </group>
      )}
    </group>
  )
}

function TomatoPlant({ scale, health, stage }: { scale: number; health: number; stage: GrowthStage }) {
  const baseColor = new THREE.Color('#2E7D32')
  const stemColor = new THREE.Color('#1B5E20')
  const fruitColor = stage === 'harvest' ? new THREE.Color('#E53935') : new THREE.Color('#FF8F00')
  const leafColor = getHealthColor(health, baseColor)

  const height = 0.4 * scale
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.015, 0.025, height, 5]} />
        <meshStandardMaterial color={stemColor} roughness={0.8} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2 + 0.3
        const y = height * (0.4 + (i % 2) * 0.3)
        return (
          <group key={i} position={[Math.cos(angle) * 0.08, y, Math.sin(angle) * 0.08]} rotation={[0.3, angle, 0.2]}>
            <mesh>
              <sphereGeometry args={[0.08, 6, 5]} />
              <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
            </mesh>
          </group>
        )
      })}
      {(stage === 'fruiting' || stage === 'harvest') && (
        <>
          <mesh position={[0.1, height * 0.5, 0.05]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color={fruitColor} roughness={0.3} metalness={0.05} />
          </mesh>
          <mesh position={[-0.08, height * 0.65, -0.06]}>
            <sphereGeometry args={[0.045, 8, 8]} />
            <meshStandardMaterial color={fruitColor} roughness={0.3} metalness={0.05} />
          </mesh>
          <mesh position={[0.05, height * 0.35, -0.1]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshStandardMaterial color={fruitColor} roughness={0.3} metalness={0.05} />
          </mesh>
        </>
      )}
      {stage === 'flowering' && (
        <mesh position={[0, height * 0.8, 0]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#FFD54F" emissive="#FFD54F" emissiveIntensity={0.2} />
        </mesh>
      )}
    </group>
  )
}

function SugarcanePlant({ scale, health, stage }: { scale: number; health: number; stage: GrowthStage }) {
  const stemColor = new THREE.Color('#558B2F')
  const leafColor = getHealthColor(health, new THREE.Color('#7CB342'))
  const height = 0.8 * scale
  return (
    <group>
      {[0, 1, 2].map((i) => {
        const angle = (i / 3) * Math.PI * 2
        const r = 0.04
        return (
          <group key={i} position={[Math.cos(angle) * r, 0, Math.sin(angle) * r]} rotation={[0.05, 0, 0.05]}>
            <mesh position={[0, height / 2, 0]}>
              <cylinderGeometry args={[0.025, 0.035, height, 6]} />
              <meshStandardMaterial color={stemColor} roughness={0.7} />
            </mesh>
            {[0, 1, 2, 3].map((k) => (
              <mesh key={k} position={[0.04, height * (0.3 + k * 0.18), 0]} rotation={[0, 0, 1.2]}>
                <planeGeometry args={[0.25, 0.03]} />
                <meshStandardMaterial color={leafColor} roughness={0.75} side={THREE.DoubleSide} />
              </mesh>
            ))}
            <mesh position={[0, height, 0]}>
              <coneGeometry args={[0.02, 0.1, 4]} />
              <meshStandardMaterial color={leafColor} roughness={0.8} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function GenericBush({ scale, health, stage, fruitColor }: { scale: number; health: number; stage: GrowthStage; fruitColor: string }) {
  const leafColor = getHealthColor(health, new THREE.Color('#388E3C'))
  const height = 0.35 * scale
  return (
    <group>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(angle) * 0.06, height * 0.5, Math.sin(angle) * 0.06]}>
            <sphereGeometry args={[0.1, 8, 7]} />
            <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
          </mesh>
        )
      })}
      <mesh position={[0, height * 0.3, 0]}>
        <sphereGeometry args={[0.12, 8, 7]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      {(stage === 'fruiting' || stage === 'harvest') && (
        <>
          <mesh position={[0.06, height * 0.4, 0.05]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={fruitColor} roughness={0.3} />
          </mesh>
          <mesh position={[-0.05, height * 0.6, -0.04]}>
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshStandardMaterial color={fruitColor} roughness={0.3} />
          </mesh>
        </>
      )}
    </group>
  )
}

function TreePlant({ scale, health, stage, fruitColor }: { scale: number; health: number; stage: GrowthStage; fruitColor: string }) {
  const trunkColor = new THREE.Color('#5D4037')
  const leafColor = getHealthColor(health, new THREE.Color('#2E7D32'))
  const fColor = new THREE.Color(fruitColor)
  const height = 1.5 * scale

  return (
    <group>
      <mesh position={[0, height * 0.25, 0]}>
        <cylinderGeometry args={[0.05, 0.09, height * 0.5, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      <mesh position={[0, height * 0.55, 0]}>
        <icosahedronGeometry args={[0.5 * scale, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.2, height * 0.7, 0.1]}>
        <icosahedronGeometry args={[0.35 * scale, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.15, height * 0.5, -0.15]}>
        <icosahedronGeometry args={[0.3 * scale, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      {(stage === 'fruiting' || stage === 'harvest') && (
        Array.from({ length: 6 }).map((_, i) => {
          const a = (i / 6) * Math.PI * 2
          const r = 0.35 * scale
          return (
            <mesh key={i} position={[Math.cos(a) * r, height * (0.5 + Math.random() * 0.2), Math.sin(a) * r]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color={fColor} roughness={0.3} />
            </mesh>
          )
        })
      )}
    </group>
  )
}

function CropInstance({ crop, isSelected, showLabel }: { crop: CropPlot; isSelected: boolean; showLabel: boolean }) {
  const groupRef = useRef<THREE.Group>(null)
  const cropData = CROP_TYPES[crop.cropType] || CROP_TYPES.rice
  const scale = STAGE_SCALES[crop.stage]

  useFrame((state) => {
    if (groupRef.current) {
      const wind = Math.sin(state.clock.elapsedTime * 0.7 + crop.x * 0.4 + crop.z * 0.3) * 0.05
      groupRef.current.rotation.z = wind
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + crop.z) * 0.02
    }
  })

  const spacing = cropData.spacing || 0.4
  const cols = Math.max(1, Math.floor(crop.width / spacing))
  const rows = Math.max(1, Math.floor(crop.depth / spacing))
  const positions = useMemo(() => {
    const arr: { x: number; z: number }[] = []
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        arr.push({
          x: -crop.width / 2 + spacing / 2 + i * spacing + (Math.random() - 0.5) * 0.05,
          z: -crop.depth / 2 + spacing / 2 + j * spacing + (Math.random() - 0.5) * 0.05,
        })
      }
    }
    return arr
  }, [crop.width, crop.depth, spacing, cols, rows])

  const renderPlant = () => {
    const props = { scale, health: crop.health, stage: crop.stage }
    switch (crop.cropType) {
      case 'rice': return <RicePlant {...props} />
      case 'wheat': return <WheatPlant {...props} />
      case 'corn': return <CornPlant {...props} />
      case 'tomato': return <TomatoPlant {...props} />
      case 'sugarcane': return <SugarcanePlant {...props} />
      case 'fruits': return <TreePlant {...props} fruitColor={cropData.fruitColor || '#FF6B6B'} />
      case 'chili': return <GenericBush {...props} fruitColor="#DC143C" />
      case 'potato': return <GenericBush {...props} fruitColor="#DAA520" />
      case 'groundnut': return <GenericBush {...props} fruitColor="#CD853F" />
      case 'cotton': return <GenericBush {...props} fruitColor="#FFFAF0" />
      default: return <GenericBush {...props} fruitColor={cropData.fruitColor || '#4CAF50'} />
    }
  }

  return (
    <group ref={groupRef} position={[crop.x, 0, crop.z]}>
      {/* Soil bed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <planeGeometry args={[crop.width + 0.15, crop.depth + 0.15]} />
        <meshStandardMaterial color={crop.health > 60 ? '#4E342E' : '#6D4C41'} roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[crop.width, crop.depth]} />
        <meshStandardMaterial color="#5D4037" roughness={1} />
      </mesh>

      {/* Selection ring */}
      {isSelected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.08, 0]}>
          <ringGeometry args={[Math.max(crop.width, crop.depth) / 2 + 0.1, Math.max(crop.width, crop.depth) / 2 + 0.3, 48]} />
          <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.4} transparent opacity={0.5} />
        </mesh>
      )}

      {/* Furrows */}
      {Array.from({ length: Math.max(1, Math.floor(rows)) }).map((_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, -crop.depth / 2 + spacing / 2 + i * spacing]}>
          <planeGeometry args={[crop.width, 0.03]} />
          <meshStandardMaterial color="#3E2723" roughness={1} transparent opacity={0.4} />
        </mesh>
      ))}

      {/* Plants */}
      {positions.map((pos, idx) => (
        <group key={idx} position={[pos.x, 0.05, pos.z]}>
          {renderPlant()}
        </group>
      ))}

      {/* Water stress indicator */}
      {crop.waterStress > 50 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
          <planeGeometry args={[crop.width * 0.3, crop.depth * 0.3]} />
          <meshBasicMaterial color="#8B4513" transparent opacity={0.12} />
        </mesh>
      )}
    </group>
  )
}

export default CropInstance