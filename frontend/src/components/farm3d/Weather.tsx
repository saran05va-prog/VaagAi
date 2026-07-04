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

export function WeatherEffects() {
  const weather = useFarmStore((s) => s.weather)
  const isNight = useFarmStore((s) => s.isNight)
  const mode = getWeatherMode(weather?.condition, isNight)

  const rainRef = useRef<THREE.Points>(null)
  const cloudRef = useRef<THREE.Group>(null)

  const rainCount = mode === 'heavy_rain' ? 800 : mode === 'light_rain' ? 300 : 0

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

  const cloudCount = mode === 'cloudy' ? 14 : mode === 'heavy_rain' ? 12 : mode === 'partly_cloudy' ? 6 : mode === 'light_rain' ? 10 : 3
  const cloudColor = mode === 'heavy_rain' ? '#5A6B7B' : mode === 'cloudy' ? '#C9D3DD' : '#FFFFFF'
  const cloudOpacity = mode === 'heavy_rain' ? 0.92 : mode === 'cloudy' ? 0.85 : 0.5

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
          const angle = (i / cloudCount) * Math.PI * 2
          const r = 12 + Math.random() * 6
          return (
            <group key={i} position={[Math.cos(angle) * r + (Math.random() - 0.5) * 3, Math.random() * 2, Math.sin(angle) * r + (Math.random() - 0.5) * 3]}
              scale={0.8 + Math.random() * 0.6}>
              {[
                [-1, 0, 0], [0, 0.3, 0], [1, 0, 0], [-0.3, 0.5, 0.2], [0.5, 0.4, -0.1], [1.5, 0.15, 0.3]
              ].map((p, j) => (
                <mesh key={j} position={p as [number, number, number]}>
                  <sphereGeometry args={[0.8 + j * 0.05, 12, 12]} />
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

export function DynamicLighting() {
  const isNight = useFarmStore((s) => s.isNight)
  const weather = useFarmStore((s) => s.weather)
  const dayPhase = useFarmStore((s) => s.dayPhase)
  const mode = getWeatherMode(weather?.condition, isNight)

  const ambient = isNight ? 0.06 : mode === 'heavy_rain' ? 0.25 : mode === 'cloudy' ? 0.4 : mode === 'partly_cloudy' ? 0.5 : 0.65
  const sun = isNight ? 0.01 : mode === 'heavy_rain' ? 0.2 : mode === 'cloudy' ? 0.4 : mode === 'partly_cloudy' ? 0.7 : 1.1

  const sunPos: [number, number, number] = dayPhase === 'dawn' ? [20, 6, 10] : dayPhase === 'dusk' ? [-20, 6, -10] : dayPhase === 'noon' ? [5, 25, 5] : [15, 18, 10]
  const sunColor = dayPhase === 'dawn' || dayPhase === 'dusk' ? '#FF8C42' : '#FFE08A'

  return (
    <>
      <ambientLight intensity={ambient} color={mode === 'clear' ? '#FFF5D7' : '#DCE7F0'} />
      <directionalLight
        position={sunPos}
        intensity={sun}
        color={sunColor}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-bias={-0.0005}
        shadow-normalBias={0.02}
      />
      <hemisphereLight skyColor={isNight ? '#1a1a3a' : mode === 'clear' ? '#87CEEB' : '#C9D3DD'} groundColor={isNight ? '#0a0a1a' : '#4A7C23'} intensity={0.3} />
      {isNight && (
        <pointLight position={[0, 4, 0]} intensity={0.2} color="#FDE68A" distance={15} />
      )}
    </>
  )
}
