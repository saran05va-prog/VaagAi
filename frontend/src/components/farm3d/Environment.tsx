import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function CoconutTree({ position }: { position: [number, number, number] }) {
  const frondsRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (frondsRef.current) {
      frondsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.03
    }
  })

  const fronds = useMemo(() => {
    return Array.from({ length: 8 }).map((_, i) => ({
      angle: (i / 8) * Math.PI * 2,
      droop: 0.4 + Math.random() * 0.2,
      length: 0.8 + Math.random() * 0.3,
    }))
  }, [])

  return (
    <group position={position}>
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 3, 8]} />
        <meshStandardMaterial color="#8D6E63" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.2, 8]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.95} />
      </mesh>
      <group ref={frondsRef} position={[0, 3.1, 0]}>
        {fronds.map((f, i) => (
          <group key={i} rotation={[f.droop, f.angle, 0]}>
            <mesh position={[0, 0, f.length / 2]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, f.length]} />
              <meshStandardMaterial color="#2E7D32" roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
            {Array.from({ length: 4 }).map((_, j) => (
              <mesh key={j} position={[0, 0, f.length * (0.2 + j * 0.2)]} rotation={[Math.PI / 2, 0, j % 2 ? 0.3 : -0.3]}>
                <planeGeometry args={[0.06, 0.15]} />
                <meshStandardMaterial color="#388E3C" roughness={0.7} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        ))}
        <mesh position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#5D4037" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

function MangoTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leafColor = useMemo(() => new THREE.Color('#2E7D32').offsetHSL(0, 0, (Math.random() - 0.5) * 0.05), [])

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.08, 0.14, 1.6, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.8, 0]} castShadow>
        <icosahedronGeometry args={[0.7, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.3, 2.0, 0.15]} castShadow>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.25, 1.7, -0.2]} castShadow>
        <icosahedronGeometry args={[0.45, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.1, 2.2, -0.15]} castShadow>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.2, 8]} />
        <meshStandardMaterial color="#4E342E" roughness={0.95} />
      </mesh>
    </group>
  )
}

function Hedgerow({ start, end }: { start: [number, number]; end: [number, number] }) {
  const bushes = useMemo(() => {
    const dx = end[0] - start[0]
    const dz = end[1] - start[1]
    const len = Math.sqrt(dx * dx + dz * dz)
    const count = Math.floor(len / 0.5)
    return Array.from({ length: count }).map((_, i) => ({
      x: start[0] + (dx * i) / count + (Math.random() - 0.5) * 0.15,
      z: start[1] + (dz * i) / count + (Math.random() - 0.5) * 0.15,
      scale: 0.3 + Math.random() * 0.2,
    }))
  }, [start, end])

  return (
    <group>
      {bushes.map((b, i) => (
        <mesh key={i} position={[b.x, b.scale, b.z]} scale={b.scale} castShadow>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#2E7D32" roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function Cattle({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const ref = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + delay
      ref.current.position.x = position[0] + Math.sin(t * 0.2) * 1.5
      ref.current.position.z = position[2] + Math.cos(t * 0.15) * 1.2
      ref.current.rotation.y = Math.sin(t * 0.2) * 0.5
    }
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.15
    }
  })

  return (
    <group ref={ref} position={position} scale={0.08}>
      <mesh position={[0, 1.5, -0.5]} castShadow>
        <sphereGeometry args={[1.2, 12, 10]} />
        <meshStandardMaterial color="#FFF8DC" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.8, -1.5]} castShadow>
        <sphereGeometry args={[0.8, 12, 10]} />
        <meshStandardMaterial color="#FFF8DC" roughness={0.85} />
      </mesh>
      <group ref={headRef} position={[0, 2.0, -2.2]}>
        <mesh>
          <boxGeometry args={[0.6, 0.7, 0.5]} />
          <meshStandardMaterial color="#F5DEB3" roughness={0.85} />
        </mesh>
        <mesh position={[0.2, 0.3, 0]}>
          <coneGeometry args={[0.08, 0.3, 6]} />
          <meshStandardMaterial color="#D2B48C" roughness={0.7} />
        </mesh>
        <mesh position={[-0.2, 0.3, 0]}>
          <coneGeometry args={[0.08, 0.3, 6]} />
          <meshStandardMaterial color="#D2B48C" roughness={0.7} />
        </mesh>
      </group>
      {[[0.6, 0.8, -0.3], [-0.6, 0.8, -0.3], [0.6, 0.8, -1.5], [-0.6, 0.8, -1.5], [0.5, 0.8, -2.5], [-0.5, 0.8, -2.5]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <cylinderGeometry args={[0.1, 0.12, 1.6, 6]} />
          <meshStandardMaterial color="#D2B48C" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 2.5, -0.5]}>
        <boxGeometry args={[0.3, 0.5, 0.15]} />
        <meshStandardMaterial color="#8B4513" roughness={0.7} />
      </mesh>
    </group>
  )
}

function Birds() {
  const refs = useRef<THREE.Group[]>([])
  const birds = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      radius: 8 + Math.random() * 5,
      height: 6 + Math.random() * 3,
      speed: 0.3 + Math.random() * 0.2,
      phase: Math.random() * Math.PI * 2,
    }))
  }, [])

  useFrame((state) => {
    birds.forEach((b, i) => {
      const ref = refs.current[i]
      if (ref) {
        const t = state.clock.elapsedTime * b.speed + b.phase
        ref.position.set(Math.cos(t) * b.radius, b.height + Math.sin(t * 2) * 0.5, Math.sin(t) * b.radius)
        ref.rotation.y = -t + Math.PI / 2
        ref.rotation.z = Math.sin(t * 4) * 0.2
      }
    })
  })

  return (
    <group>
      {birds.map((_, i) => (
        <group key={i} ref={(r) => { if (r) refs.current[i] = r }} scale={0.15}>
          <mesh position={[0, 0, 0]}>
            <coneGeometry args={[0.15, 0.5, 4]} />
            <meshStandardMaterial color="#212121" roughness={0.8} />
          </mesh>
          <mesh position={[0.3, 0, 0]} rotation={[0, 0, 0.3]}>
            <planeGeometry args={[0.6, 0.25]} />
            <meshStandardMaterial color="#333" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[-0.3, 0, 0]} rotation={[0, 0, -0.3]}>
            <planeGeometry args={[0.6, 0.25]} />
            <meshStandardMaterial color="#333" roughness={0.8} side={THREE.DoubleSide} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Butterflies() {
  const refs = useRef<THREE.Group[]>([])
  const butterflies = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      x: (Math.random() - 0.5) * 18,
      z: (Math.random() - 0.5) * 18,
      y: 0.5 + Math.random() * 1.5,
      speed: 0.5 + Math.random() * 0.5,
      phase: Math.random() * Math.PI * 2,
      color: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'][Math.floor(Math.random() * 4)],
    }))
  }, [])

  useFrame((state) => {
    butterflies.forEach((b, i) => {
      const ref = refs.current[i]
      if (ref) {
        const t = state.clock.elapsedTime * b.speed + b.phase
        ref.position.set(
          b.x + Math.sin(t) * 1.5,
          b.y + Math.sin(t * 3) * 0.3,
          b.z + Math.cos(t * 0.7) * 1.5
        )
        ref.rotation.y = t
        const flap = Math.abs(Math.sin(t * 8))
        ref.scale.x = flap * 0.04 + 0.01
      }
    })
  })

  return (
    <group>
      {butterflies.map((b, i) => (
        <group key={i} ref={(r) => { if (r) refs.current[i] = r }}>
          <mesh>
            <planeGeometry args={[1, 0.6]} />
            <meshStandardMaterial color={b.color} roughness={0.4} side={THREE.DoubleSide} transparent opacity={0.8} />
          </mesh>
          <mesh>
            <planeGeometry args={[0.6, 0.4]} />
            <meshStandardMaterial color={b.color} roughness={0.4} side={THREE.DoubleSide} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export function Environment() {
  const trees = useMemo(() => {
    const coconuts: [number, number, number][] = [
      [-12, 0, -10], [-12, 0, -5], [-12, 0, 0], [-12, 0, 5], [-12, 0, 10],
      [12, 0, -10], [12, 0, -5], [12, 0, 5], [12, 0, 10],
      [-8, 0, 11], [0, 0, 11], [8, 0, 11],
    ]
    const mangoes: { pos: [number, number, number]; scale: number }[] = [
      { pos: [-10, 0, 9.5], scale: 0.8 },
      { pos: [10, 0, -9.5], scale: 0.9 },
      { pos: [10, 0, 9.5], scale: 0.7 },
      { pos: [-10, 0, -9.5], scale: 0.85 },
    ]
    return { coconuts, mangoes }
  }, [])

  return (
    <group>
      {trees.coconuts.map((pos, i) => (
        <CoconutTree key={i} position={pos} />
      ))}
      {trees.mangoes.map((m, i) => (
        <MangoTree key={i} position={m.pos} scale={m.scale} />
      ))}
      <Hedgerow start={[-11, -9]} end={[11, -9]} />
      <Hedgerow start={[-11, 9]} end={[11, 9]} />
      <Cattle position={[7, 0, -2]} delay={0} />
      <Cattle position={[8.5, 0, 1]} delay={2} />
      <Cattle position={[6.5, 0, 3]} delay={4} />
      <Birds />
      <Butterflies />
    </group>
  )
}
