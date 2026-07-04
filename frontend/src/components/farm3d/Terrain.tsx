import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Terrain() {
  const isNight = useRef(false)
  const grassRef = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const grassCount = 1200
  const grassData = useMemo(() => {
    const arr: { x: number; z: number; scale: number; phase: number; color: THREE.Color }[] = []
    for (let i = 0; i < grassCount; i++) {
      const dist = Math.sqrt(Math.random()) * 22
      const angle = Math.random() * Math.PI * 2
      arr.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        scale: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
        color: new THREE.Color().setHSL(0.25 + Math.random() * 0.08, 0.5 + Math.random() * 0.3, 0.25 + Math.random() * 0.15),
      })
    }
    return arr
  }, [])

  useFrame((state) => {
    if (grassRef.current) {
      for (let i = 0; i < grassCount; i++) {
        const g = grassData[i]
        const wave = Math.sin(state.clock.elapsedTime * 1.2 + g.phase) * 0.06
        dummy.position.set(g.x, 0.03, g.z)
        dummy.scale.setScalar(g.scale * (1 + wave * 0.2))
        dummy.rotation.set(wave * 0.3, g.phase, 0)
        dummy.updateMatrix()
        grassRef.current.setMatrixAt(i, dummy.matrix)
      }
      grassRef.current.instanceMatrix.needsUpdate = true
    }
  })

  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(50, 50, 64, 64)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const dist = Math.sqrt(x * x + y * y)
      const elevation = Math.sin(x * 0.15) * 0.15 + Math.cos(y * 0.12) * 0.12 + Math.sin((x + y) * 0.08) * 0.08
      const edgeFalloff = Math.max(0, 1 - dist / 24)
      pos.setZ(i, elevation * edgeFalloff)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const groundColors = useMemo(() => {
    const colors = new Float32Array(groundGeo.attributes.position.count * 3)
    const pos = groundGeo.attributes.position
    const greenBase = new THREE.Color('#4A7C23')
    const brownBase = new THREE.Color('#6D4C41')
    const darkGreen = new THREE.Color('#33691E')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const noise = Math.sin(x * 0.3) * Math.cos(y * 0.25) * 0.5 + 0.5
      const c = greenBase.clone().lerp(brownBase, noise * 0.3).lerp(darkGreen, Math.random() * 0.2)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    return colors
  }, [groundGeo])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={groundGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
        <bufferAttribute attach="attributes-color" args={[groundColors, 3]} />
      </mesh>

      <instancedMesh ref={grassRef} args={[undefined, undefined, grassCount]} castShadow>
        <coneGeometry args={[0.015, 0.1, 3]} />
        <meshStandardMaterial color="#3D6B1E" roughness={0.9} />
      </instancedMesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 5.5]}>
        <planeGeometry args={[2, 20]} />
        <meshStandardMaterial color="#A0896A" roughness={0.95} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[3.5, 0.03, -4]}>
        <planeGeometry args={[1.2, 7]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -5.5]}>
        <planeGeometry args={[12, 2]} />
        <meshStandardMaterial color="#8B7355" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, 0.04, -5]} rotation-z={0.02}>
        <planeGeometry args={[3, 2.5]} />
        <meshStandardMaterial color="#2E5A2A" roughness={0.3} metalness={0.1} transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4, 0.04, 4]}>
        <planeGeometry args={[2.5, 2]} />
        <meshStandardMaterial color="#2E5A2A" roughness={0.3} metalness={0.1} transparent opacity={0.65} />
      </mesh>
    </group>
  )
}

export function StoneWall({ position, rotation, length }: { position: [number, number, number]; rotation: number; length: number }) {
  const stones = useMemo(() => {
    const arr: { x: number; scale: number; color: string }[] = []
    const count = Math.floor(length / 0.4)
    for (let i = 0; i < count; i++) {
      arr.push({
        x: -length / 2 + i * 0.4 + (Math.random() - 0.5) * 0.05,
        scale: 0.15 + Math.random() * 0.08,
        color: Math.random() > 0.5 ? '#8D8D8D' : '#A0A0A0',
      })
    }
    return arr
  }, [length])

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, 0.12, 0]} castShadow>
          <dodecahedronGeometry args={[s.scale, 0]} />
          <meshStandardMaterial color={s.color} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  )
}
