import { useMemo } from 'react'
import * as THREE from 'three'

function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function fbm(x: number, y: number): number {
  let value = 0
  let amplitude = 0.5
  for (let i = 0; i < 4; i++) {
    value += amplitude * noise2D(x * (1 + i * 0.5), y * (1 + i * 0.5))
    amplitude *= 0.5
  }
  return value
}

export function Terrain() {

  const groundGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(55, 55, 96, 96)
    const pos = geo.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const dist = Math.sqrt(x * x + y * y)
      const edgeFalloff = Math.max(0, 1 - dist / 26)
      const n = fbm(x * 0.08 + 0.5, y * 0.08 + 0.3)
      const n2 = Math.sin(x * 0.12) * 0.08 + Math.cos(y * 0.1) * 0.06
      const elevation = (n - 0.5) * 0.25 + n2
      pos.setZ(i, elevation * edgeFalloff)
    }
    geo.computeVertexNormals()
    return geo
  }, [])

  const groundColors = useMemo(() => {
    const colors = new Float32Array(groundGeo.attributes.position.count * 3)
    const pos = groundGeo.attributes.position
    const meadowGreen = new THREE.Color('#5CB85C')
    const lushGreen = new THREE.Color('#6DD86D')
    const brightGreen = new THREE.Color('#8AE78A')
    const dryGreen = new THREE.Color('#7CC77C')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const z = pos.getZ(i)
      const patches = fbm(x * 0.09 + 3, y * 0.09 + 4)
      const detail = fbm(x * 0.18 + 7, y * 0.18 + 8)
      const fineDetail = fbm(x * 0.35 + 11, y * 0.35 + 12)

      let c = meadowGreen.clone()

      if (z < -0.04) c = lushGreen.clone()
      else if (z > 0.04) c = brightGreen.clone()

      if (patches > 0.55) {
        c.lerp(lushGreen, (patches - 0.55) * 1.0)
      } else if (patches < 0.4) {
        c.lerp(dryGreen, (0.4 - patches) * 0.6)
      }

      c.offsetHSL(
        fineDetail * 0.015 - 0.007,
        detail * 0.03 - 0.015,
        (detail - 0.5) * 0.06 + (fineDetail - 0.5) * 0.03 + (Math.random() - 0.5) * 0.015
      )

      colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b
    }
    return colors
  }, [groundGeo])

  const rocks = useMemo(() => {
    return Array.from({ length: 8 }).map(() => {
      const dist = 5 + Math.random() * 16
      const angle = Math.random() * Math.PI * 2
      return {
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        scale: 0.08 + Math.random() * 0.15,
        rotY: Math.random() * Math.PI,
        color: Math.random() > 0.5 ? '#8DC88D' : '#9BDF9B',
      }
    })
  }, [])

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={groundGeo} receiveShadow>
        <meshStandardMaterial vertexColors roughness={0.95} metalness={0} />
      </mesh>

      {rocks.map((r, i) => (
        <mesh key={i} position={[r.x, 0.04 + r.scale * 0.3, r.z]} rotation={[0, r.rotY, Math.random() * 0.3]}>
          <dodecahedronGeometry args={[r.scale, 0]} />
          <meshStandardMaterial color={r.color} roughness={0.95} flatShading />
        </mesh>
      ))}

      {[
        { pos: [0, 5], size: [2.5, 18], color: '#7CC77C' },
        { pos: [3.5, -4.5], size: [1.5, 8], color: '#6DD86D' },
        { pos: [-1.5, -5], size: [1.2, 3], color: '#6DD86D' },
      ].map((p, i) => (
        <mesh key={`p${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[p.pos[0], 0.035, p.pos[1]]}>
          <planeGeometry args={p.size as [number, number]} />
          <meshStandardMaterial color={p.color} roughness={0.95} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  )
}

export function StoneWall({ position, rotation, length }: { position: [number, number, number]; rotation: number; length: number }) {
  const stones = useMemo(() => {
    const count = Math.floor(length / 0.35)
    return Array.from({ length: count }).map((_, i) => ({
      x: -length / 2 + i * 0.35 + (Math.random() - 0.5) * 0.04,
      scale: 0.12 + Math.random() * 0.08,
      color: Math.random() > 0.4 ? '#7DB87D' : (Math.random() > 0.5 ? '#8FD18F' : '#6DB86D'),
      yOffset: Math.random() > 0.6 ? 0.05 : 0,
    }))
  }, [length])

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {stones.map((s, i) => (
        <mesh key={i} position={[s.x, 0.1 + s.yOffset, (Math.random() - 0.5) * 0.08]}>
          <dodecahedronGeometry args={[s.scale, 0]} />
          <meshStandardMaterial color={s.color} roughness={0.95} flatShading />
        </mesh>
      ))}
    </group>
  )
}