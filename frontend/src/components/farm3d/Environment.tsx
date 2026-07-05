import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function CoconutTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const frondsRef = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (frondsRef.current) {
      frondsRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.03
    }
  })

  const fronds = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => ({
      angle: (i / 7) * Math.PI * 2,
      droop: 0.3 + Math.random() * 0.2,
      length: 0.7 + Math.random() * 0.3,
    }))
  }, [])

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.13, 3, 6]} />
        <meshStandardMaterial color="#7D5A42" roughness={0.9} />
      </mesh>
      <group ref={frondsRef} position={[0, 3.1, 0]}>
        {fronds.map((f, i) => (
          <group key={i} rotation={[f.droop, f.angle, 0]}>
            <mesh position={[0, 0, f.length / 2]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.12, f.length]} />
              <meshStandardMaterial color="#2E7D32" roughness={0.7} side={THREE.DoubleSide} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  )
}

function MangoTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leafColor = useMemo(() => new THREE.Color('#2E7D32').offsetHSL(0, 0, (Math.random() - 0.5) * 0.06), [])

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.08, 0.15, 1.6, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      <mesh position={[0, 1.8, 0]}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.3, 2.1, 0.15]}>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.3, 1.7, -0.2]}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
    </group>
  )
}

function TamarindTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leafColor = new THREE.Color('#5B8C3A')
  const spread = 1.4 * scale

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 2.0, 6]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.95} />
      </mesh>
      <mesh position={[0.2, 2.0, 0]}>
        <icosahedronGeometry args={[spread, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.2, 2.4, 0.2]}>
        <icosahedronGeometry args={[spread * 0.7, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.15, 2.5, -0.2]}>
        <icosahedronGeometry args={[spread * 0.65, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

function NeemTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leafColor = new THREE.Color('#3A7D2E')

  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.06, 0.12, 2.4, 6]} />
        <meshStandardMaterial color="#7D5A42" roughness={0.9} />
      </mesh>
      <mesh position={[0, 2.6, 0]}>
        <coneGeometry args={[0.9, 1.2, 6]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.15, 3.0, 0.1]}>
        <coneGeometry args={[0.7, 0.9, 6]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

function BanyanTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leafColor = new THREE.Color('#2D5A1E')
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.25, 0.4, 3, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.95} />
      </mesh>
      <mesh position={[0, 3.5, 0]} castShadow>
        <icosahedronGeometry args={[1.8, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.8, 3.2, 0.3]} castShadow>
        <icosahedronGeometry args={[1.3, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.7, 3.3, -0.4]} castShadow>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.5, 0.6, 0.3]}>
        <cylinderGeometry args={[0.04, 0.08, 1.2, 5]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
      </mesh>
      <mesh position={[-0.4, 0.6, -0.3]}>
        <cylinderGeometry args={[0.03, 0.06, 1.0, 5]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
      </mesh>
    </group>
  )
}

function PeepalTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leafColor = new THREE.Color('#3A6B1A')
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.25, 4, 6]} />
        <meshStandardMaterial color="#6D4C41" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.5, 0]} castShadow>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[0.5, 4.0, 0.3]} castShadow>
        <icosahedronGeometry args={[0.9, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
      <mesh position={[-0.4, 4.2, -0.3]} castShadow>
        <icosahedronGeometry args={[0.85, 1]} />
        <meshStandardMaterial color={leafColor} roughness={0.8} flatShading />
      </mesh>
    </group>
  )
}

function AcaciaTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leafColor = new THREE.Color('#4A7C2A')
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]}>
        <cylinderGeometry args={[0.1, 0.18, 2.4, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <cylinderGeometry args={[1.4, 1.6, 0.5, 8]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.4, 2.6, 0.2]}>
        <sphereGeometry args={[0.6, 6, 4]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

function BambooCluster({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const poles = useMemo(() =>
    Array.from({ length: 7 }).map(() => ({
      x: (Math.random() - 0.5) * 0.7,
      z: (Math.random() - 0.5) * 0.7,
      height: 3 + Math.random() * 2,
      thickness: 0.04 + Math.random() * 0.03,
    }))
  , [])

  return (
    <group position={position} scale={scale}>
      {poles.map((p, i) => (
        <mesh key={i} position={[p.x, p.height / 2, p.z]}>
          <cylinderGeometry args={[p.thickness, p.thickness, p.height, 5]} />
          <meshStandardMaterial color="#7CB342" roughness={0.6} />
        </mesh>
      ))}
      {poles.map((p, i) => (
        <mesh key={`l${i}`} position={[p.x, p.height + 0.2, p.z]}>
          <coneGeometry args={[0.15, 0.4, 5]} />
          <meshStandardMaterial color="#558B2F" roughness={0.7} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function RoyalPalm({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.12, 5, 6]} />
        <meshStandardMaterial color="#E8E8E8" roughness={0.6} />
      </mesh>
      <mesh position={[0, 5.2, 0]}>
        <cylinderGeometry args={[0.1, 0.15, 0.4, 6]} />
        <meshStandardMaterial color="#558B2F" roughness={0.6} />
      </mesh>
      {Array.from({ length: 7 }).map((_, i) => {
        const angle = (i / 7) * Math.PI * 2
        return (
          <mesh key={i} position={[0, 5.4, 0]} rotation={[0.5, angle, 0]}>
            <planeGeometry args={[0.1, 0.8]} />
            <meshStandardMaterial color="#2E7D32" roughness={0.6} side={THREE.DoubleSide} />
          </mesh>
        )
      })}
    </group>
  )
}

function JackfruitTree({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leafColor = new THREE.Color('#33691E')
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 2, 6]} />
        <meshStandardMaterial color="#5D4037" roughness={0.95} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[1.2, 8, 7]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[0.5, 2.8, 0.3]}>
        <sphereGeometry args={[0.7, 6, 5]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
      <mesh position={[-0.4, 2.3, -0.3]}>
        <sphereGeometry args={[0.6, 6, 5]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} flatShading />
      </mesh>
    </group>
  )
}

function Hedgerow({ start, end }: { start: [number, number]; end: [number, number] }) {
  const bushes = useMemo(() => {
    const dx = end[0] - start[0]
    const dz = end[1] - start[1]
    const len = Math.sqrt(dx * dx + dz * dz)
    const count = Math.floor(len / 0.45)
    return Array.from({ length: count }).map((_, i) => ({
      x: start[0] + (dx * i) / count + (Math.random() - 0.5) * 0.15,
      z: start[1] + (dz * i) / count + (Math.random() - 0.5) * 0.15,
      scale: 0.25 + Math.random() * 0.25,
      hue: 0.28 + Math.random() * 0.06,
    }))
  }, [start, end])

  return (
    <group>
      {bushes.map((b, i) => (
        <mesh key={i} position={[b.x, b.scale * 0.5, b.z]} scale={b.scale}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={new THREE.Color().setHSL(b.hue, 0.5, 0.25)} roughness={0.85} flatShading />
        </mesh>
      ))}
    </group>
  )
}

function WildBushes() {
  const clusters = useMemo(() => {
    return Array.from({ length: 6 }).map(() => {
      const dist = 6 + Math.random() * 14
      const angle = Math.random() * Math.PI * 2
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        count: 3 + Math.floor(Math.random() * 3),
        spread: 0.5 + Math.random() * 0.8,
        hue: 0.22 + Math.random() * 0.1,
      }
    })
  }, [])

  return (
    <group>
      {clusters.map((c, i) => (
        <group key={i}>
          {Array.from({ length: c.count }).map((_, j) => {
            const a = Math.random() * Math.PI * 2
            const r = Math.random() * c.spread
            const s = 0.15 + Math.random() * 0.2
            return (
              <mesh key={j} position={[c.x + Math.cos(a) * r, s * 0.5, c.z + Math.sin(a) * r]} scale={s}>
                <icosahedronGeometry args={[1, 0]} />
                <meshStandardMaterial color={new THREE.Color().setHSL(c.hue, 0.45, 0.22 + Math.random() * 0.08)} roughness={0.9} flatShading />
              </mesh>
            )
          })}
        </group>
      ))}
    </group>
  )
}

function Cattle({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const ref = useRef<THREE.Group>(null)
  const headRef = useRef<THREE.Group>(null)
  const frameSkip = useRef(0)

  useFrame((state) => {
    frameSkip.current++
    if (frameSkip.current % 4 !== 0) return
    if (ref.current) {
      const t = state.clock.elapsedTime + delay
      ref.current.position.x = position[0] + Math.sin(t * 0.18) * 1.5
      ref.current.position.z = position[2] + Math.cos(t * 0.14) * 1.2
      ref.current.rotation.y = Math.sin(t * 0.18) * 0.5
    }
    if (headRef.current) {
      headRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5 + delay) * 0.15
    }
  })

  return (
    <group ref={ref} position={position} scale={0.08}>
      <mesh position={[0, 1.5, -0.5]}>
        <sphereGeometry args={[1.2, 10, 8]} />
        <meshStandardMaterial color="#FFF8DC" roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.8, -1.5]}>
        <sphereGeometry args={[0.8, 10, 8]} />
        <meshStandardMaterial color="#FFF8DC" roughness={0.85} />
      </mesh>
      <group ref={headRef} position={[0, 2.0, -2.2]}>
        <mesh><boxGeometry args={[0.6, 0.7, 0.5]} /><meshStandardMaterial color="#F5DEB3" roughness={0.85} /></mesh>
        <mesh position={[0.2, 0.3, 0]}><coneGeometry args={[0.08, 0.3, 6]} /><meshStandardMaterial color="#D2B48C" roughness={0.7} /></mesh>
        <mesh position={[-0.2, 0.3, 0]}><coneGeometry args={[0.08, 0.3, 6]} /><meshStandardMaterial color="#D2B48C" roughness={0.7} /></mesh>
      </group>
      {[[0.6, 0.8, -0.3], [-0.6, 0.8, -0.3], [0.6, 0.8, -1.5], [-0.6, 0.8, -1.5], [0.5, 0.8, -2.5], [-0.5, 0.8, -2.5]].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}><cylinderGeometry args={[0.1, 0.12, 1.6, 6]} /><meshStandardMaterial color="#D2B48C" roughness={0.8} /></mesh>
      ))}
      <mesh position={[0, 2.5, -0.5]}><boxGeometry args={[0.3, 0.5, 0.15]} /><meshStandardMaterial color="#8B4513" roughness={0.7} /></mesh>
    </group>
  )
}

function Birds() {
  const refs = useRef<THREE.Group[]>([])
  const frameSkip = useRef(0)
  const birds = useMemo(() => {
    return Array.from({ length: 4 }).map((_, i) => ({
      radius: 7 + Math.random() * 6,
      height: 5 + Math.random() * 4,
      speed: 0.25 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      type: i % 3 === 0 ? 'v' : 'small',
    }))
  }, [])

  useFrame((state) => {
    frameSkip.current++
    if (frameSkip.current % 3 !== 0) return
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
      {birds.map((b, i) => (
        <group key={i} ref={(r) => { if (r) refs.current[i] = r }} scale={0.12 + (b.type === 'v' ? 0.05 : 0)}>
          <mesh position={[0, 0, 0]}><coneGeometry args={[0.15, 0.5, 4]} /><meshStandardMaterial color={b.type === 'crow' ? '#1a1a1a' : '#333'} roughness={0.8} /></mesh>
          <mesh position={[0.3, 0, 0]} rotation={[0, 0, 0.3]}><planeGeometry args={[0.6, 0.2]} /><meshStandardMaterial color={b.type === 'crow' ? '#222' : '#444'} roughness={0.8} side={THREE.DoubleSide} /></mesh>
          <mesh position={[-0.3, 0, 0]} rotation={[0, 0, -0.3]}><planeGeometry args={[0.6, 0.2]} /><meshStandardMaterial color={b.type === 'crow' ? '#222' : '#444'} roughness={0.8} side={THREE.DoubleSide} /></mesh>
        </group>
      ))}
    </group>
  )
}

function Butterflies() {
  const refs = useRef<THREE.Group[]>([])
  const frameSkip = useRef(0)
  const butterflies = useMemo(() => {
    return Array.from({ length: 6 }).map(() => ({
      x: (Math.random() - 0.5) * 20,
      z: (Math.random() - 0.5) * 20,
      y: 0.3 + Math.random() * 1.8,
      speed: 0.4 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      color: ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF'][Math.floor(Math.random() * 4)],
    }))
  }, [])

  useFrame((state) => {
    frameSkip.current++
    if (frameSkip.current % 4 !== 0) return
    butterflies.forEach((b, i) => {
      const ref = refs.current[i]
      if (ref) {
        const t = state.clock.elapsedTime * b.speed + b.phase
        ref.position.set(b.x + Math.sin(t * 0.7) * 2, b.y + Math.sin(t * 3 + b.phase) * 0.3, b.z + Math.cos(t * 0.6) * 2)
        ref.rotation.y = t * 0.5
        ref.scale.x = Math.abs(Math.sin(t * 10 + b.phase)) * 0.05 + 0.01
      }
    })
  })

  return (
    <group>
      {butterflies.map((b, i) => (
        <group key={i} ref={(r) => { if (r) refs.current[i] = r }}>
          <mesh><planeGeometry args={[0.8, 0.5]} /><meshStandardMaterial color={b.color} roughness={0.4} side={THREE.DoubleSide} transparent opacity={0.85} /></mesh>
        </group>
      ))}
    </group>
  )
}

export function Environment({ quality = 'high' }: { quality?: string }) {
  const isDetail = quality !== 'low'

  const trees = useMemo(() => {
    const coconuts: { pos: [number, number, number]; scale: number }[] = [
      ...[[-12, 0, -10], [-12, 0, -5], [-12, 0, 0], [-12, 0, 5], [-12, 0, 10]].map(p => ({ pos: p as [number, number, number], scale: 1 })),
      ...(isDetail ? [[12, 0, -10], [12, 0, -5], [12, 0, 5], [12, 0, 10]] : [[12, 0, -5]]).map(p => ({ pos: p as [number, number, number], scale: 1 })),
      ...(isDetail ? [[-8, 0, 11], [0, 0, 11], [8, 0, 11]] : [[0, 0, 11]]).map(p => ({ pos: p as [number, number, number], scale: 1 })),
      ...(isDetail ? [[-5, 0, -11], [5, 0, -11]] : [[5, 0, -11]]).map(p => ({ pos: p as [number, number, number], scale: 0.85 })),
    ]
    const mangoes: { pos: [number, number, number]; scale: number }[] = isDetail
      ? [
        { pos: [-10, 0, 8], scale: 0.8 }, { pos: [10, 0, -8], scale: 0.9 },
        { pos: [10, 0, 8], scale: 0.75 }, { pos: [-10, 0, -8], scale: 0.85 }, { pos: [0, 0, -10.5], scale: 0.7 },
      ] : [{ pos: [0, 0, -10.5], scale: 0.7 }]
    const tamarinds: { pos: [number, number, number]; scale: number }[] = isDetail
      ? [
        { pos: [-7, 0, 10.5], scale: 0.7 }, { pos: [7, 0, 10.5], scale: 0.65 }, { pos: [9, 0, -10.5], scale: 0.75 },
      ] : [{ pos: [9, 0, -10.5], scale: 0.75 }]
    const neems: { pos: [number, number, number]; scale: number }[] = isDetail
      ? [
        { pos: [-9, 0, -10], scale: 0.6 }, { pos: [11, 0, 2], scale: 0.55 }, { pos: [-11, 0, 2], scale: 0.65 },
      ] : [{ pos: [11, 0, 2], scale: 0.55 }]
    return { coconuts, mangoes, tamarinds, neems }
  }, [isDetail])

  const boundaryTrees = useMemo(() => {
    const trees: { type: string; pos: [number, number, number]; scale: number }[] = []
    if (isDetail) {
      trees.push({ type: 'banyan', pos: [-17, 0, -15], scale: 1.1 }, { type: 'banyan', pos: [17, 0, -15], scale: 1.0 })
      trees.push({ type: 'banyan', pos: [-17, 0, 15], scale: 1.2 }, { type: 'banyan', pos: [17, 0, 15], scale: 1.1 })
      trees.push({ type: 'peepal', pos: [-16, 0, -5], scale: 0.95 }, { type: 'peepal', pos: [16, 0, 5], scale: 0.9 })
      trees.push({ type: 'peepal', pos: [-15, 0, 10], scale: 0.85 })
      trees.push({ type: 'acacia', pos: [-18, 0, 0], scale: 0.85 }, { type: 'acacia', pos: [18, 0, -3], scale: 0.8 })
      trees.push({ type: 'acacia', pos: [15, 0, -14], scale: 0.75 })
      trees.push({ type: 'bamboo', pos: [-19, 0, 6], scale: 0.95 }, { type: 'bamboo', pos: [19, 0, 8], scale: 0.85 })
      trees.push({ type: 'bamboo', pos: [-14, 0, -16], scale: 0.8 })
      trees.push({ type: 'palm', pos: [-16, 0, 12], scale: 0.95 }, { type: 'palm', pos: [16, 0, -8], scale: 0.9 })
      trees.push({ type: 'palm', pos: [14, 0, 14], scale: 1.0 })
      trees.push({ type: 'jackfruit', pos: [-15, 0, -11], scale: 0.85 }, { type: 'jackfruit', pos: [15, 0, 11], scale: 0.8 })
      trees.push({ type: 'jackfruit', pos: [-18, 0, -8], scale: 0.75 })
    } else {
      trees.push({ type: 'banyan', pos: [-17, 0, -15], scale: 1.1 }, { type: 'banyan', pos: [17, 0, 15], scale: 1.1 })
      trees.push({ type: 'peepal', pos: [16, 0, 5], scale: 0.9 })
      trees.push({ type: 'bamboo', pos: [-19, 0, 6], scale: 0.95 })
      trees.push({ type: 'palm', pos: [14, 0, 14], scale: 1.0 })
    }
    return trees
  }, [isDetail])

  return (
    <group>
      {trees.coconuts.map((t, i) => <CoconutTree key={`c${i}`} position={t.pos} scale={t.scale} />)}
      {trees.mangoes.map((t, i) => <MangoTree key={`m${i}`} position={t.pos} scale={t.scale} />)}
      {trees.tamarinds.map((t, i) => <TamarindTree key={`t${i}`} position={t.pos} scale={t.scale} />)}
      {trees.neems.map((t, i) => <NeemTree key={`n${i}`} position={t.pos} scale={t.scale} />)}
      {boundaryTrees.map((t, i) => {
        switch (t.type) {
          case 'banyan': return <BanyanTree key={`bt${i}`} position={t.pos} scale={t.scale} />
          case 'peepal': return <PeepalTree key={`bt${i}`} position={t.pos} scale={t.scale} />
          case 'acacia': return <AcaciaTree key={`bt${i}`} position={t.pos} scale={t.scale} />
          case 'bamboo': return <BambooCluster key={`bt${i}`} position={t.pos} scale={t.scale} />
          case 'palm': return <RoyalPalm key={`bt${i}`} position={t.pos} scale={t.scale} />
          case 'jackfruit': return <JackfruitTree key={`bt${i}`} position={t.pos} scale={t.scale} />
          default: return null
        }
      })}
      {isDetail && (
        <Hedgerow start={[-11, -9]} end={[11, -9]} />
      )}
      {isDetail && (
        <Hedgerow start={[-11, 9]} end={[11, 9]} />
      )}
      {isDetail && (
        <Hedgerow start={[-12, -8]} end={[-12, 8]} />
      )}
      {isDetail && (
        <Hedgerow start={[12, -8]} end={[12, 8]} />
      )}
      {isDetail && <WildBushes />}
      {isDetail && <Cattle position={[7, 0, -2]} delay={0} />}
      {isDetail && <Cattle position={[8.5, 0, 1]} delay={2} />}
      {isDetail && <Cattle position={[6.5, 0, 3]} delay={4} />}
      <Birds />
      {isDetail && <Butterflies />}
    </group>
  )
}
