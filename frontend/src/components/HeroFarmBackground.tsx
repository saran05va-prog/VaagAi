import { useRef, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import * as THREE from 'three'

function StaticLighting() {
  return (
    <>
      <ambientLight intensity={0.72} color="#FFF5D7" />
      <directionalLight
        position={[18, 24, 14]}
        intensity={1.15}
        color="#FFFFFF"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      <pointLight position={[14, 20, 8]} intensity={0.6} color="#FFD88A" />
    </>
  )
}

function Ground() {
  const grassRef = useRef<THREE.InstancedMesh>(null)
  const grassCount = 400

  const grassData = useMemo(() => {
    const data = []
    for (let i = 0; i < grassCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 2 + Math.random() * 16
      data.push({
        x: Math.cos(angle) * radius,
        z: Math.sin(angle) * radius,
        scale: 0.4 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      })
    }
    return data
  }, [])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    if (grassRef.current) {
      for (let i = 0; i < grassCount; i++) {
        const data = grassData[i]
        dummy.position.set(data.x, 0.05, data.z)
        const sway = 1 + Math.sin(state.clock.elapsedTime * 2 + data.phase) * 0.1
        dummy.scale.setScalar(data.scale * sway)
        dummy.rotation.y = data.phase
        dummy.updateMatrix()
        grassRef.current.setMatrixAt(i, dummy.matrix)
      }
      grassRef.current.instanceMatrix.needsUpdate = true
    }
  })

  const patches = [
    { x: -8, z: -8, r: 5, c: '#3D6B1E' },
    { x: 9, z: -7, r: 4, c: '#5A8C2E' },
    { x: -7, z: 8, r: 4.5, c: '#3A6B1A' },
    { x: 8, z: 7, r: 5, c: '#4A7C23' },
    { x: 0, z: 0, r: 6, c: '#3E6B1E' },
  ]

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#4A7C23" roughness={1} />
      </mesh>
      {patches.map((patch, i) => (
        <mesh key={`patch-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[patch.x, 0.01, patch.z]}>
          <circleGeometry args={[patch.r, 24]} />
          <meshStandardMaterial color={patch.c} transparent opacity={0.35} roughness={1} />
        </mesh>
      ))}
      <instancedMesh ref={grassRef} args={[undefined, undefined, grassCount]}>
        <coneGeometry args={[0.03, 0.15, 4]} />
        <meshStandardMaterial color="#3D6B1E" roughness={0.8} />
      </instancedMesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 5]}>
        <planeGeometry args={[2, 18]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`road-stone-${i}`} position={[1.1, 0.025, -8 + i * 1.5 + Math.sin(i) * 0.3]} rotation={[-Math.PI / 2, 0, Math.sin(i) * 0.5]}>
          <circleGeometry args={[0.06 + Math.sin(i * 0.5) * 0.02, 6]} />
          <meshStandardMaterial color="#7B6345" roughness={0.95} />
        </mesh>
      ))}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={`road-stone-l-${i}`} position={[-1.1, 0.025, -8 + i * 1.5 + Math.cos(i) * 0.3]} rotation={[-Math.PI / 2, 0, Math.cos(i) * 0.4]}>
          <circleGeometry args={[0.05 + Math.cos(i * 0.5) * 0.03, 6]} />
          <meshStandardMaterial color="#7B6345" roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

function Tree({ position, type = 'oak', scale = 1, rotation = 0 }: { position: [number, number, number]; type?: 'pine' | 'oak'; scale?: number; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.1, 1, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      {type === 'pine' ? (
        <>
          <mesh position={[0, 1.1, 0]} castShadow>
            <coneGeometry args={[0.7, 1, 8]} />
            <meshStandardMaterial color="#1a4a0a" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.6, 0]} castShadow>
            <coneGeometry args={[0.5, 0.8, 8]} />
            <meshStandardMaterial color="#2d6b1e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 2.0, 0]} castShadow>
            <coneGeometry args={[0.3, 0.6, 8]} />
            <meshStandardMaterial color="#3a8b2a" roughness={0.85} />
          </mesh>
        </>
      ) : (
        <>
          <mesh position={[0, 1.1, 0]} castShadow>
            <sphereGeometry args={[0.55, 8, 8]} />
            <meshStandardMaterial color="#2d6b1e" roughness={0.85} />
          </mesh>
          <mesh position={[0.2, 1.4, 0.1]} castShadow>
            <sphereGeometry args={[0.35, 8, 8]} />
            <meshStandardMaterial color="#3d8b2e" roughness={0.85} />
          </mesh>
          <mesh position={[-0.15, 1.3, -0.15]} castShadow>
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color="#4a9b3a" roughness={0.85} />
          </mesh>
        </>
      )}
    </group>
  )
}

function WaterPond() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      const geo = meshRef.current.geometry
      const pos = geo.attributes.position
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i)
        const z = pos.getZ(i)
        const dist = Math.sqrt(x * x + z * z)
        const wave = Math.sin(dist * 3 - state.clock.elapsedTime * 1.5) * 0.04
          + Math.sin(dist * 2 + state.clock.elapsedTime * 1.2) * 0.025
        pos.setY(i, wave)
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group position={[-9, 0, 8]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[3.8, 32]} />
        <meshStandardMaterial color="#1a3a2a" roughness={1} />
      </mesh>
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]} receiveShadow>
        <circleGeometry args={[3.5, 48]} />
        <meshStandardMaterial color="#1a9bab" transparent opacity={0.7} roughness={0.05} metalness={0.25} />
      </mesh>
      {Array.from({ length: 18 }, (_, i) => {
        const angle = (i / 18) * Math.PI * 2 + Math.sin(i * 1.3) * 0.2
        const radius = 3.4 + Math.sin(i * 0.7) * 0.3
        return (
          <mesh key={`rock-${i}`} position={[Math.cos(angle) * radius, 0.05 + Math.random() * 0.08, Math.sin(angle) * radius]} castShadow>
            <sphereGeometry args={[0.1 + Math.sin(i * 0.9) * 0.04, 6, 6]} />
            <meshStandardMaterial color={['#6B6B6B', '#7B7B7B', '#5A5A5A', '#8A7A6A'][i % 4]} roughness={0.9} />
          </mesh>
        )
      })}
      {Array.from({ length: 3 }, (_, i) => {
        const angle = i * 2.1 + 0.3
        const radius = 1.2 + i * 0.3
        return (
          <mesh key={`lily-${i}`} position={[Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius]} rotation={[-Math.PI / 2, 0, angle]}>
            <circleGeometry args={[0.15, 8]} />
            <meshStandardMaterial color="#2d6b1e" roughness={0.9} />
          </mesh>
        )
      })}
    </group>
  )
}

function Barn() {
  return (
    <group position={[-7.5, 0, -7]}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.2, 2.8]} />
        <meshStandardMaterial color="#4E342E" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.4, 0]} castShadow>
        <boxGeometry args={[3.4, 2.6, 2.6]} />
        <meshStandardMaterial color="#8B4513" roughness={0.85} />
      </mesh>
      <mesh position={[0, 3.1, 0]} rotation={[0, 0, 0]} castShadow>
        <coneGeometry args={[2.2, 1.5, 4]} />
        <meshStandardMaterial color="#B22222" roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.8, 1.31]}>
        <planeGeometry args={[1.0, 1.5]} />
        <meshStandardMaterial color="#3E2723" />
      </mesh>
      <mesh position={[-1.0, 1.5, 1.31]}>
        <planeGeometry args={[0.35, 0.35]} />
        <meshStandardMaterial color="#FDE68A" emissive="#FFD700" emissiveIntensity={0.1} />
      </mesh>
      <mesh position={[1.0, 1.5, 1.31]}>
        <planeGeometry args={[0.35, 0.35]} />
        <meshStandardMaterial color="#FDE68A" emissive="#FFD700" emissiveIntensity={0.1} />
      </mesh>
    </group>
  )
}

function Windmill() {
  const bladeRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (bladeRef.current) {
      bladeRef.current.rotation.z = state.clock.elapsedTime * 0.6
    }
  })

  return (
    <group position={[8, 0, -6.5]}>
      <mesh position={[0, 0.1, 0]} receiveShadow>
        <cylinderGeometry args={[0.8, 0.9, 0.2, 8]} />
        <meshStandardMaterial color="#6D6D6D" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.6, 3.2, 8]} />
        <meshStandardMaterial color="#D2B48C" roughness={0.9} />
      </mesh>
      {[0.6, 1.2, 1.8, 2.5].map((y) => (
        <mesh key={`band-${y}`} position={[0, y, 0]}>
          <cylinderGeometry args={[0.37 + (3.2 - y) * 0.08, 0.39 + (3.2 - y) * 0.08, 0.04, 8]} />
          <meshStandardMaterial color="#A0522D" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 3.4, 0]} castShadow>
        <coneGeometry args={[0.45, 0.35, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.8} />
      </mesh>
      <mesh position={[0, 3.2, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#4A3728" />
      </mesh>
      <group ref={bladeRef} position={[0, 3.2, 0]}>
        {[0, 1, 2, 3].map((i) => (
          <group key={i} rotation={[0, 0, i * Math.PI / 2]}>
            <mesh position={[0.5, 0, 0]} castShadow>
              <boxGeometry args={[1.0, 0.12, 0.04]} />
              <meshStandardMaterial color="#F5F0E0" roughness={0.6} />
            </mesh>
            <mesh position={[0.9, 0, 0]}>
              <boxGeometry args={[0.5, 0.2, 0.04]} />
              <meshStandardMaterial color="#E8E0D0" roughness={0.6} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function Bush({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      {[
        { pos: [0, 0.2, 0], s: 0.3 },
        { pos: [0.2, 0.1, 0.15], s: 0.25 },
        { pos: [-0.15, 0.15, -0.1], s: 0.2 },
      ].map((b, i) => (
        <mesh key={i} position={b.pos as [number, number, number]} castShadow>
          <sphereGeometry args={[b.s, 8, 8]} />
          <meshStandardMaterial color={['#3D6B1E', '#4A7C23', '#2d6b1e'][i]} roughness={0.85} />
        </mesh>
      ))}
    </group>
  )
}

function FlowerPatch({ position, color = '#FF6B8A' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      {Array.from({ length: 6 }, (_, i) => {
        const angle = (i / 6) * Math.PI * 2
        const radius = 0.15 + Math.random() * 0.15
        return (
          <group key={i} position={[Math.cos(angle) * radius, 0, Math.sin(angle) * radius]}>
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.005, 0.008, 0.15, 4]} />
              <meshStandardMaterial color="#5D8233" />
            </mesh>
            <mesh position={[0, 0.18, 0]}>
              <sphereGeometry args={[0.025, 6, 6]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function Decorations() {
  return (
    <group>
      {[
        { x: -11, z: -10, type: 'oak', scale: 0.9, rot: 0.5 },
        { x: 11, z: -10, type: 'pine', scale: 1.0, rot: 1.2 },
        { x: -12, z: 5, type: 'pine', scale: 0.8, rot: 2.0 },
        { x: 12, z: 5, type: 'oak', scale: 0.7, rot: 0.8 },
        { x: -8, z: 11, type: 'oak', scale: 0.9, rot: 1.5 },
        { x: 9, z: 11, type: 'pine', scale: 0.8, rot: 0.3 },
        { x: -10, z: -12, type: 'pine', scale: 1.1, rot: 2.5 },
        { x: 10, z: -12, type: 'oak', scale: 1.0, rot: 1.8 },
      ].map((t, i) => (
        <Tree key={`tree-${i}`} position={[t.x, 0, t.z]} type={t.type as 'pine' | 'oak'} scale={t.scale} rotation={t.rot} />
      ))}
      <WaterPond />
      <Barn />
      <Windmill />
      {[
        { x: -10.5, z: -11.5 }, { x: -9, z: -9.5 },
        { x: 10.5, z: -11.5 }, { x: 9.5, z: -9.5 },
        { x: -11, z: 6.5 }, { x: -9, z: 8 },
        { x: 11, z: 8 }, { x: 9, z: 9.5 },
      ].map((b, i) => (
        <Bush key={`bush-${i}`} position={[b.x, 0, b.z]} scale={0.6 + Math.sin(i * 1.1) * 0.2} />
      ))}
      {[
        { x: -10, z: -10.5 }, { x: -9, z: 9 }, { x: 10, z: -9.5 }, { x: 11, z: 10 },
        { x: -5, z: 11 }, { x: 6, z: 11.5 },
      ].map((f, i) => (
        <FlowerPatch key={`flower-${i}`} position={[f.x, 0, f.z]} color={['#FF6B8A', '#FFD700', '#FF69B4', '#FFA500', '#FF4500', '#DA70D6'][i]} />
      ))}
    </group>
  )
}

export default function HeroFarmBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      <Canvas
        shadows
        camera={{ position: [16, 14, 16], fov: 50 }}
        style={{ background: 'linear-gradient(to bottom, #87CEEB, #B0E0E6)' }}
      >
        <StaticLighting />
        <fog attach="fog" args={['#B0E0E6', 18, 45]} />
        <Sky
          sunPosition={[100, 24, 90]}
          turbidity={0.25}
          rayleigh={1.3}
          mieCoefficient={0.008}
          mieDirectionalG={0.95}
        />
        <Ground />
        <Decorations />
      </Canvas>
    </div>
  )
}