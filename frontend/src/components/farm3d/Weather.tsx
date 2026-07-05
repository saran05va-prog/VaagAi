import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useFarmStore, type WeatherCondition } from './farmStore'

function getWeatherMode(condition?: WeatherCondition, isNight?: boolean) {
  if (isNight) return 'night'
  const c = condition || 'clear'
  if (c === 'heavy_rain' || c === 'thunderstorm') return 'heavy_rain'
  if (c === 'light_rain') return 'light_rain'
  if (c === 'cloudy' || c === 'fog' || c === 'hazy') return 'cloudy'
  if (c === 'partly_cloudy') return 'partly_cloudy'
  return 'clear'
}

function sunPosition(hour: number): { pos: [number, number, number]; color: string; intensity: number } {
  const t = ((hour - 5) / 14)
  const clamped = Math.max(0, Math.min(1, t))
  const angle = clamped * Math.PI - Math.PI / 2
  const altitude = Math.sin(angle)
  const azimuth = Math.cos(angle) * 0.8

  const x = azimuth * 40
  const y = Math.max(0.5, altitude * 30)
  const z = altitude * 15

  if (hour < 6.5) {
    return { pos: [20, 1 + (hour - 5) * 4, 12], color: '#FF8C42', intensity: 0.5 + (hour - 5) * 0.2 }
  }
  if (hour < 8) {
    return { pos: [15 + (hour - 6.5) * 2, 4 + (hour - 6.5) * 6, 8], color: '#FFB05A', intensity: 0.9 + (hour - 6.5) * 0.2 }
  }
  if (hour < 11) {
    return { pos: [8, 14 + (hour - 8) * 4, 4], color: '#FFE8A0', intensity: 1.4 }
  }
  if (hour < 14) {
    return { pos: [0, 26, 0], color: '#FFFFF0', intensity: 1.6 }
  }
  if (hour < 17) {
    return { pos: [-8 + (hour - 14) * 4, 22 - (hour - 14) * 4, -4 - (hour - 14) * 2], color: '#FFE8A0', intensity: 1.4 }
  }
  if (hour < 19) {
    const p = (hour - 17) / 2
    return { pos: [-20 + p * 5, 8 - p * 6, -12 + p * 4], color: '#FFB05A', intensity: 0.9 - p * 0.3 }
  }
  return { pos: [-25, 12, -18], color: '#C4D8FF', intensity: 0.3 }
}

export function getColorTemperature(hour: number): { sun: string; ambient: string; sky: string; fog: string } {
  if (hour < 5.5) return { sun: '#FF8C42', ambient: '#3a3a5e', sky: '#1a1a3a', fog: '#151530' }
  if (hour < 7) return { sun: '#FFA050', ambient: '#6a5a3a', sky: '#3a3a6a', fog: '#2a2a50' }
  if (hour < 8.5) return { sun: '#FFC07A', ambient: '#8a7a5a', sky: '#5A8FC5', fog: '#4a6a8a' }
  if (hour < 11) return { sun: '#FFE8A0', ambient: '#B0A070', sky: '#7FB5E9', fog: '#6a8aba' }
  if (hour < 14) return { sun: '#FFFFF0', ambient: '#C0B080', sky: '#97D5FF', fog: '#8aAACa' }
  if (hour < 17) return { sun: '#FFE8A0', ambient: '#B0A070', sky: '#7FB5E9', fog: '#6a8aba' }
  if (hour < 18.5) return { sun: '#FFC07A', ambient: '#8a7a5a', sky: '#5A8FC5', fog: '#4a6a8a' }
  if (hour < 20) return { sun: '#FFA050', ambient: '#6a5a3a', sky: '#3a3a6a', fog: '#2a2a50' }
  return { sun: '#FF8C42', ambient: '#3a3a5e', sky: '#1a1a3a', fog: '#151530' }
}

function getMoonPhase(hour: number): number {
  return (Math.sin(hour * 0.5) + 1) * 0.5
}

export function WeatherEffects() {
  const weather = useFarmStore((s) => s.weather)
  const isNight = useFarmStore((s) => s.isNight)
  const currentTime = useFarmStore((s) => s.currentTime)
  const mode = getWeatherMode(weather?.condition, isNight)
  const hour = currentTime.getHours() + currentTime.getMinutes() / 60

  const rainRef = useRef<THREE.Points>(null)
  const cloudRef = useRef<THREE.Group>(null)

  const rainCount = mode === 'heavy_rain' ? 600 : mode === 'light_rain' ? 250 : 0

  const rainGeometry = useMemo(() => {
    if (rainCount === 0) return null
    const positions = new Float32Array(rainCount * 3)
    const velocities = new Float32Array(rainCount)
    for (let i = 0; i < rainCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 40
      positions[i * 3 + 1] = Math.random() * 18 + 4
      positions[i * 3 + 2] = (Math.random() - 0.5) * 40
      velocities[i] = 0.15 + Math.random() * 0.1
    }
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.userData.velocities = velocities
    return geo
  }, [rainCount])

  useFrame(() => {
    if (rainRef.current && rainGeometry && (mode === 'heavy_rain' || mode === 'light_rain')) {
      const positions = rainGeometry.attributes.position.array as Float32Array
      const velocities = rainGeometry.userData.velocities as Float32Array
      for (let i = 0; i < rainCount; i++) {
        positions[i * 3 + 1] -= velocities[i]
        if (positions[i * 3 + 1] < 0) {
          positions[i * 3 + 1] = 18 + Math.random() * 4
          positions[i * 3] = (Math.random() - 0.5) * 40
          positions[i * 3 + 2] = (Math.random() - 0.5) * 40
        }
      }
      rainGeometry.attributes.position.needsUpdate = true
    }

    if (cloudRef.current) {
      cloudRef.current.children.forEach((child, idx) => {
        child.position.x += 0.008 + idx * 0.001
        if (child.position.x > 22) child.position.x = -22
        child.rotation.z = Math.sin(Date.now() * 0.0001 + idx) * 0.02
      })
    }
  })

  const cloudCount = !isNight
    ? mode === 'cloudy' ? 12 : mode === 'heavy_rain' ? 10 : mode === 'partly_cloudy' ? 5 : mode === 'light_rain' ? 8 : 3
    : 2
  const cloudColor = !isNight
    ? (mode === 'heavy_rain' ? '#5A6B7B' : mode === 'cloudy' ? '#C9D3DD' : '#FFFFFF')
    : '#2a2a3a'
  const cloudOpacity = !isNight
    ? (mode === 'heavy_rain' ? 0.92 : mode === 'cloudy' ? 0.85 : 0.5)
    : 0.2

  const colors = getColorTemperature(hour)

  return (
    <group>
      {rainCount > 0 && rainGeometry && (
        <points ref={rainRef} geometry={rainGeometry}>
          <pointsMaterial color="#B0D4FF" size={0.08} transparent opacity={0.7} sizeAttenuation />
        </points>
      )}

      {mode === 'heavy_rain' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <planeGeometry args={[40, 40]} />
          <meshStandardMaterial color="#2E5A2A" transparent opacity={0.12} roughness={1} />
        </mesh>
      )}

      <group ref={cloudRef} position={[0, 10, 0]}>
        {Array.from({ length: cloudCount }).map((_, i) => {
          const angle = (i / Math.max(1, cloudCount)) * Math.PI * 2
          const r = 12 + Math.random() * 6
          return (
            <group key={i} position={[Math.cos(angle) * r + (Math.random() - 0.5) * 3, Math.random() * 2, Math.sin(angle) * r + (Math.random() - 0.5) * 3]}
              scale={0.8 + Math.random() * 0.6}>
              {[
                [-1, 0, 0], [0, 0.3, 0], [1, 0, 0], [-0.3, 0.5, 0.2]
              ].map((p, j) => (
                <mesh key={j} position={p as [number, number, number]}>
                  <sphereGeometry args={[0.8 + j * 0.05, 8, 8]} />
                  <meshStandardMaterial color={cloudColor} transparent opacity={cloudOpacity} roughness={1} />
                </mesh>
              ))}
            </group>
          )
        })}
      </group>
    </group>
  )
}

function Stars() {
  const starsRef = useRef<THREE.Points>(null)
  const count = 2000

  const geo = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 60 + Math.random() * 30
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = Math.abs(r * Math.cos(phi))
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      sizes[i] = 0.3 + Math.random() * 0.7
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    return g
  }, [])

  return (
    <points ref={starsRef} geometry={geo}>
      <pointsMaterial color="#FFFFFF" size={0.25} sizeAttenuation transparent opacity={0.8} />
    </points>
  )
}

function Fireflies() {
  const ref = useRef<THREE.Points>(null)
  const count = 30

  const { positions, speeds, phases } = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const spd = new Float32Array(count)
    const ph = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      const dist = 2 + Math.random() * 14
      const angle = Math.random() * Math.PI * 2
      pos[i * 3] = Math.cos(angle) * dist
      pos[i * 3 + 1] = 0.2 + Math.random() * 1.5
      pos[i * 3 + 2] = Math.sin(angle) * dist
      spd[i] = 0.3 + Math.random() * 0.5
      ph[i] = Math.random() * Math.PI * 2
    }
    return { positions: pos, speeds: spd, phases: ph }
  }, [])

  useFrame((state) => {
    if (ref.current) {
      const p = ref.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < count; i++) {
        const t = state.clock.elapsedTime * speeds[i] + phases[i]
        p[i * 3] += Math.sin(t * 0.5) * 0.005
        p[i * 3 + 1] += Math.sin(t * 1.3) * 0.003
        p[i * 3 + 2] += Math.cos(t * 0.7) * 0.005
      }
      ref.current.geometry.attributes.position.needsUpdate = true

      const mat = ref.current.material as THREE.PointsMaterial
      const pulse = (Math.sin(state.clock.elapsedTime * 3 + phases[0]) + 1) * 0.5
      mat.opacity = 0.3 + pulse * 0.6
    }
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial color="#FFE066" size={0.08} sizeAttenuation transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  )
}

function Moon() {
  const glowRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 0.2) * 0.05)
    }
  })

  return (
    <group position={[-25, 18, -20]}>
      <mesh>
        <sphereGeometry args={[1.5, 20, 20]} />
        <meshStandardMaterial color="#F5F5DC" emissive="#FFF8E0" emissiveIntensity={0.6} roughness={0.5} />
      </mesh>
      <mesh ref={glowRef} position={[0, 0, -0.5]}>
        <sphereGeometry args={[2.5, 16, 16]} />
        <meshBasicMaterial color="#FFF8E0" transparent opacity={0.15} />
      </mesh>
      <mesh position={[-1.0, 0.3, 0.2]}>
        <circleGeometry args={[0.2, 8]} />
        <meshBasicMaterial color="#E8E0D0" transparent opacity={0.15} />
      </mesh>
      <mesh position={[0.8, -0.4, 0.1]}>
        <circleGeometry args={[0.15, 8]} />
        <meshBasicMaterial color="#E8E0D0" transparent opacity={0.1} />
      </mesh>
    </group>
  )
}

export function DynamicLighting({ shadowMapSize = 1024 }: { shadowMapSize?: number }) {
  const isNight = useFarmStore((s) => s.isNight)
  const weather = useFarmStore((s) => s.weather)
  const currentTime = useFarmStore((s) => s.currentTime)
  const hour = currentTime.getHours() + currentTime.getMinutes() / 60
  const mode = getWeatherMode(weather?.condition, isNight)
  const sun = sunPosition(hour)
  const colors = getColorTemperature(hour)

  const weatherDim = mode === 'heavy_rain' ? 0.55 : mode === 'cloudy' ? 0.75 : mode === 'partly_cloudy' ? 0.9 : 1.0

  const ambientIntensity = isNight ? 0.35 : 0.5 * weatherDim
  const hemiIntensity = isNight ? 0.3 : 0.45 * weatherDim
  const sunIntensity = isNight ? 0.25 : sun.intensity * weatherDim

  const skyHemi = isNight ? '#1a1a3a' : colors.sky
  const groundHemi = isNight ? '#0a1a0a' : '#3a5a2a'

  return (
    <>
      <ambientLight intensity={ambientIntensity} color={isNight ? '#3a3a5e' : colors.ambient} />
      <hemisphereLight skyColor={skyHemi} groundColor={groundHemi} intensity={hemiIntensity} />
      <directionalLight
        position={sun.pos}
        intensity={sunIntensity}
        color={sun.color}
        castShadow
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      {isNight && (
        <>
          <Moon />
          <Stars />
          <Fireflies />
          <pointLight position={[0, 5, 0]} intensity={0.4} color="#C4D8FF" distance={25} />
          <pointLight position={[8, 4, -6]} intensity={0.25} color="#A8C4FF" distance={20} />
          <pointLight position={[-6, 4, 7]} intensity={0.25} color="#A8C4FF" distance={20} />
        </>
      )}
    </>
  )
}
