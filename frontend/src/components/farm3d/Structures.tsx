import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Farmhouse() {
  return (
    <group position={[-9.5, 0, -8.5]} rotation={[0, 0.4, 0]}>
      <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 1.2, 1.6]} />
        <meshStandardMaterial color="#E8D5B7" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[1.6, 0.8, 4]} />
        <meshStandardMaterial color="#8B4513" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.15, 0.85]}><boxGeometry args={[0.4, 0.5, 0.05]} /><meshStandardMaterial color="#4A2E1A" roughness={0.7} /></mesh>
      <mesh position={[-0.5, 0.35, 0.85]}><boxGeometry args={[0.5, 0.5, 0.05]} /><meshStandardMaterial color="#87CEEB" roughness={0.3} metalness={0.1} transparent opacity={0.7} /></mesh>
      <mesh position={[0.5, 0.35, 0.85]}><boxGeometry args={[0.5, 0.5, 0.05]} /><meshStandardMaterial color="#87CEEB" roughness={0.3} metalness={0.1} transparent opacity={0.7} /></mesh>
      <mesh position={[0, 0.2, 0.81]}><boxGeometry args={[0.6, 0.3, 0.02]} /><meshStandardMaterial color="#5D4037" roughness={0.8} /></mesh>
    </group>
  )
}

function Barn() {
  return (
    <group position={[-11, 0, -6]} rotation={[0, -0.3, 0]}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.5, 2]} />
        <meshStandardMaterial color="#A0522D" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2.5, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.8} />
      </mesh>
      <group rotation={[0, 0, Math.PI / 2]} position={[0, 1.5, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 2, 6]} />
          <meshStandardMaterial color="#5D4037" roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.8, 0]}><boxGeometry args={[1.8, 0.05, 0.1]} /><meshStandardMaterial color="#3E2723" roughness={0.9} /></mesh>
      </group>
      <mesh position={[0, 0.4, 1.05]}><boxGeometry args={[1.4, 0.8, 0.05]} /><meshStandardMaterial color="#3E2723" roughness={0.8} /></mesh>
    </group>
  )
}

function WaterTank() {
  return (
    <group position={[7.5, 0, -7]}>
      <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.6, 0.7, 0.2, 12]} /><meshStandardMaterial color="#616161" roughness={0.8} metalness={0.3} /></mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.55, 0.55, 1.4, 12]} />
        <meshStandardMaterial color="#42A5F5" roughness={0.3} metalness={0.1} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 1.5, 0]}><coneGeometry args={[0.55, 0.2, 12]} /><meshStandardMaterial color="#424242" roughness={0.6} metalness={0.4} /></mesh>
    </group>
  )
}

function SolarPanels() {
  return (
    <group position={[9, 0, 7]}>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[i * 1.2 - 1.2, 0, 0]}>
          <mesh position={[0, 0.5, 0]} rotation={[-0.4, 0, 0]}>
            <boxGeometry args={[1, 0.04, 0.6]} />
            <meshStandardMaterial color="#1E1E1E" roughness={0.2} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.25, 0.15]}><cylinderGeometry args={[0.03, 0.03, 0.5, 6]} /><meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.1, 0]}><boxGeometry args={[3.8, 0.15, 0.8]} /><meshStandardMaterial color="#424242" roughness={0.8} /></mesh>
    </group>
  )
}

function WeatherStation() {
  const anemometerRef = useRef<THREE.Group>(null)
  const frameSkip = useRef(0)
  useFrame((state) => {
    frameSkip.current++
    if (frameSkip.current % 3 !== 0) return
    if (anemometerRef.current) anemometerRef.current.rotation.y = state.clock.elapsedTime * 3
  })

  return (
    <group position={[6, 0, 8.5]}>
      <mesh position={[0, 1, 0]}><cylinderGeometry args={[0.03, 0.03, 2, 6]} /><meshStandardMaterial color="#666" metalness={0.5} roughness={0.4} /></mesh>
      <group ref={anemometerRef} position={[0, 2.1, 0]}>
        <mesh><boxGeometry args={[0.5, 0.02, 0.04]} /><meshStandardMaterial color="#E53935" /></mesh>
        <mesh position={[0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.15, 0.3, 0.02]} /><meshStandardMaterial color="#E53935" /></mesh>
        <mesh position={[-0.28, 0, 0]} rotation={[0, 0, Math.PI / 2]}><boxGeometry args={[0.15, 0.3, 0.02]} /><meshStandardMaterial color="#E53935" /></mesh>
      </group>
      <mesh position={[0, 1.8, 0.15]}><boxGeometry args={[0.15, 0.1, 0.1]} /><meshStandardMaterial color="#FFF" roughness={0.3} /></mesh>
      <mesh position={[0, 0, 0]}><cylinderGeometry args={[0.2, 0.25, 0.1, 12]} /><meshStandardMaterial color="#424242" roughness={0.8} /></mesh>
    </group>
  )
}

function Well() {
  return (
    <group position={[5.5, 0, -9]}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.4, 0.45, 0.6, 12]} />
        <meshStandardMaterial color="#795548" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0]}><cylinderGeometry args={[0.35, 0.35, 0.05, 12]} /><meshStandardMaterial color="#1565C0" roughness={0.1} metalness={0.2} transparent opacity={0.7} /></mesh>
      <mesh position={[0, 1.2, 0]}><boxGeometry args={[0.05, 0.8, 0.05]} /><meshStandardMaterial color="#5D4037" /></mesh>
      <mesh position={[0.3, 1.55, 0]}><boxGeometry args={[0.6, 0.05, 0.05]} /><meshStandardMaterial color="#5D4037" /></mesh>
      <mesh position={[0.3, 1.2, 0]}><cylinderGeometry args={[0.08, 0.1, 0.4, 8]} /><meshStandardMaterial color="#8B4513" roughness={0.8} /></mesh>
    </group>
  )
}

function Tractor() {
  const ref = useRef<THREE.Group>(null)
  const frameSkip = useRef(0)
  useFrame((state) => {
    frameSkip.current++
    if (frameSkip.current % 4 !== 0) return
    if (ref.current) {
      ref.current.position.x = -6 + Math.sin(state.clock.elapsedTime * 0.15) * 3
      ref.current.position.z = 7 + Math.cos(state.clock.elapsedTime * 0.15) * 1.5
      ref.current.rotation.y = state.clock.elapsedTime * 0.15 + Math.PI / 2
    }
  })

  return (
    <group ref={ref} position={[-6, 0, 7]}>
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.8, 0.5, 1.2]} />
        <meshStandardMaterial color="#D32F2F" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0.75, 0.3]}><boxGeometry args={[0.6, 0.4, 0.6]} /><meshStandardMaterial color="#1B5E20" roughness={0.6} transparent opacity={0.4} /></mesh>
      <mesh position={[0.35, 0.2, -0.5]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.35, 0.35, 0.15, 12]} /><meshStandardMaterial color="#212121" roughness={0.9} /></mesh>
      <mesh position={[-0.35, 0.2, -0.5]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.35, 0.35, 0.15, 12]} /><meshStandardMaterial color="#212121" roughness={0.9} /></mesh>
      <mesh position={[0.4, 0.15, 0.5]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.25, 0.25, 0.15, 12]} /><meshStandardMaterial color="#212121" roughness={0.9} /></mesh>
      <mesh position={[-0.4, 0.15, 0.5]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[0.25, 0.25, 0.15, 12]} /><meshStandardMaterial color="#212121" roughness={0.9} /></mesh>
      <mesh position={[-0.2, 0.5, -0.7]} rotation={[0.3, 0, 0]}><boxGeometry args={[0.15, 0.3, 0.4]} /><meshStandardMaterial color="#424242" metalness={0.6} roughness={0.3} /></mesh>
    </group>
  )
}

function IrrigationPipes({ crops }: { crops: any[] }) {
  const active = crops.filter((c: any) => c.irrigationEnabled)
  return (
    <group>
      {active.map((crop: any) => (
        <group key={crop.id} position={[crop.x, 0.06, crop.z]}>
          {Array.from({ length: Math.max(1, Math.floor(crop.depth / 0.5)) }).map((_, i) => (
            <mesh key={i} position={[0, 0, -crop.depth / 2 + i * 0.5 + 0.25]}>
              <cylinderGeometry args={[0.015, 0.015, crop.width, 6]} />
              <meshStandardMaterial color="#1565C0" roughness={0.4} metalness={0.2} transparent opacity={0.7} />
            </mesh>
          ))}
          {Array.from({ length: 4 }).map((_, i) => {
            const a = (i / 4) * Math.PI * 2
            return (
              <mesh key={i} position={[Math.cos(a) * (crop.width / 2), 0.05, Math.sin(a) * (crop.depth / 2)]}>
                <sphereGeometry args={[0.025, 6, 6]} />
                <meshStandardMaterial color="#42A5F5" emissive="#42A5F5" emissiveIntensity={0.2} transparent opacity={0.6} />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

export function Structures({ crops }: { crops: any[] }) {
  return (
    <group>
      <Farmhouse /><Barn /><WaterTank /><SolarPanels /><WeatherStation /><Well /><Tractor />
      <IrrigationPipes crops={crops} />
    </group>
  )
}
