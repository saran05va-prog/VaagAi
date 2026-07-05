import { useRef, useState, useEffect, useMemo } from 'react'
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber'
import { OrbitControls, Sky, Html, Billboard } from '@react-three/drei'
import * as THREE from 'three'
import { useFarmStore, type CropPlot } from './farmStore'
import { Terrain } from './Terrain'
import { Structures } from './Structures'
import { Environment } from './Environment'
import { WeatherEffects, DynamicLighting, getColorTemperature } from './Weather'
import CropInstance from './crops/CropInstance'

const QUALITY = (() => {
  const cores = navigator.hardwareConcurrency || 4
  const mem = (navigator as any).deviceMemory || 8
  const mobile = /Android|iPhone|iPad|Mobi/i.test(navigator.userAgent)
  if (mobile || cores <= 4 || mem <= 4) return 'low' as const
  if (cores <= 6 || mem <= 6) return 'medium' as const
  return 'high' as const
})()

function CameraController() {
  const cameraMode = useFarmStore((s) => s.cameraMode)
  return (
    <OrbitControls
      enablePan={cameraMode !== 'top'}
      enableRotate={cameraMode !== 'top'}
      enableZoom
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.35}
      zoomSpeed={0.5}
      panSpeed={0.35}
      minDistance={4}
      maxDistance={40}
      maxPolarAngle={cameraMode === 'top' ? 0.15 : Math.PI / 2 - 0.05}
      minPolarAngle={0.1}
      target={[0, 0, 0]}
      makeDefault
    />
  )
}

function DragHandler({
  isDragging, onMove, onUp,
}: { isDragging: boolean; onMove: (e: ThreeEvent<PointerEvent>) => void; onUp: () => void }) {
  if (!isDragging) return null
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp}>
      <planeGeometry args={[60, 60]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}

function CropFields({
  crops, selectedCrop, onSelect, editMode, selectedTool, onPointerDown, showLabels,
}: {
  crops: CropPlot[]
  selectedCrop: string | null
  onSelect: (id: string | null) => void
  editMode: boolean
  selectedTool: string
  onPointerDown: (crop: CropPlot, e: ThreeEvent<PointerEvent>) => void
  showLabels: boolean
}) {
  const removeCrop = useFarmStore((s) => s.removeCrop)

  return (
    <>
      {crops.map((crop) => {
        const isSelected = selectedCrop === crop.id
        return (
          <group
            key={crop.id}
            position={[crop.x, 0, crop.z]}
          >
            <CropInstance crop={crop} isSelected={isSelected} />

            {showLabels && (
              <Billboard position={[0, 1.5 + (crop.cropType === 'fruits' ? 1.5 : 0), 0]}>
                <Html center distanceFactor={12}>
                  <div className="flex flex-col items-center pointer-events-none select-none">
                    <div className="px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap"
                      style={{ background: isSelected ? '#10B981' : '#374151', color: 'white', marginBottom: '2px' }}>
                      {crop.notes || (crop.stage === 'harvest' ? 'Harvest' : 'Monitor')}
                    </div>
                    <div className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                      style={{ background: isSelected ? 'rgba(16,185,129,0.9)' : 'rgba(0,0,0,0.75)', color: 'white' }}>
                      {crop.name}
                    </div>
                  </div>
                </Html>
              </Billboard>
            )}

            <mesh
              rotation={[-Math.PI / 2, 0, 0]}
              position={[0, 0.05, 0]}
              onPointerDown={(e) => { e.stopPropagation(); onPointerDown(crop, e) }}
              onClick={(e) => {
                e.stopPropagation()
                if (editMode && selectedTool === 'delete') { removeCrop(crop.id); return }
                onSelect(isSelected ? null : crop.id)
              }}
            >
              <planeGeometry args={[crop.width, crop.depth]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

function SceneAtmosphere() {
  const { gl } = useThree()
  const weather = useFarmStore((s) => s.weather)
  const isNight = useFarmStore((s) => s.isNight)
  const currentTime = useFarmStore((s) => s.currentTime)
  const hour = currentTime.getHours() + currentTime.getMinutes() / 60
  const colors = useMemo(() => getColorTemperature(hour), [hour])

  useEffect(() => {
    gl.toneMappingExposure = isNight ? 0.85 : hour < 7 || hour > 19 ? 0.95 : 1.35
    gl.setClearColor(colors.sky)
  }, [gl, colors.sky, isNight, hour])

  const fogNear = isNight ? 20 : hour < 7 ? 22 : hour > 19 ? 20 : 28
  const fogFar = 55

  const skyTurbidity = isNight ? 10 : hour < 7 || hour > 19 ? 6 : weather?.condition === 'heavy_rain' ? 8 : weather?.condition === 'cloudy' ? 4 : 0.5
  const skyRayleigh = hour < 7 || hour > 19 ? 3.5 : hour < 9 || hour > 17 ? 2.5 : 1.2
  const skyMie = weather?.condition === 'heavy_rain' ? 0.05 : 0.006

  const sunPosForSky: [number, number, number] = isNight
    ? [-100, -10, -100]
    : hour < 7 ? [30, 4, 20] : hour < 9 ? [60, 10, 50] : hour < 17 ? [100, 30, 100] : hour < 19 ? [-60, 10, -50] : [-30, 4, -20]

  return (
    <>
      <fog attach="fog" args={[colors.fog, fogNear, fogFar]} />
      {!isNight && (
        <Sky
          sunPosition={sunPosForSky}
          turbidity={skyTurbidity}
          rayleigh={skyRayleigh}
          mieCoefficient={skyMie}
          mieDirectionalG={0.9}
        />
      )}
    </>
  )
}

export function FarmScene() {
  const crops = useFarmStore((s) => s.crops)
  const selectedCrop = useFarmStore((s) => s.selectedCrop)
  const selectCrop = useFarmStore((s) => s.selectCrop)
  const showGrid = useFarmStore((s) => s.showGrid)
  const showLabels = useFarmStore((s) => s.showLabels)
  const editMode = useFarmStore((s) => s.editMode)
  const selectedTool = useFarmStore((s) => s.selectedTool)
  const updateCrop = useFarmStore((s) => s.updateCrop)
  const addCrop = useFarmStore((s) => s.addCrop)
  const isNight = useFarmStore((s) => s.isNight)

  const clickGuard = useRef(false)
  const [showEnvironment, setShowEnvironment] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setShowEnvironment(true), 80)
    return () => clearTimeout(t)
  }, [])

  const [isDragging, setIsDragging] = useState(false)
  const dragState = useRef<null | { cropId: string; startX: number; startZ: number; initX: number; initZ: number }>(null)

  const clamp = (v: number) => Math.max(-10.5, Math.min(10.5, v))

  const handlePointerDown = (crop: CropPlot, e: ThreeEvent<PointerEvent>) => {
    if (!editMode || selectedTool !== 'move') return
    dragState.current = { cropId: crop.id, startX: e.point.x, startZ: e.point.z, initX: crop.x, initZ: crop.z }
    setIsDragging(true)
    selectCrop(crop.id)
  }

  const handleDragMove = (e: ThreeEvent<PointerEvent>) => {
    const d = dragState.current
    if (!d) return
    updateCrop(d.cropId, { x: clamp(d.initX + e.point.x - d.startX), z: clamp(d.initZ + e.point.z - d.startZ) })
  }

  const stopDrag = () => { dragState.current = null; setIsDragging(false) }

  const handleResize = (crop: CropPlot, dir: 'north' | 'south' | 'west' | 'east') => {
    const step = 0.5
    const next: Partial<CropPlot> = {}
    if (dir === 'east' || dir === 'west') {
      next.width = Math.max(0.5, Math.min(10, crop.width + step))
      if (dir === 'west') next.x = clamp(crop.x - step / 2)
    } else {
      next.depth = Math.max(0.5, Math.min(10, crop.depth + step))
      if (dir === 'north') next.z = clamp(crop.z - step / 2)
    }
    updateCrop(crop.id, next)
    selectCrop(crop.id)
  }

  const handleGroundClick = (e: ThreeEvent<MouseEvent>) => {
    if (!editMode || selectedTool !== 'add') { if (!editMode) selectCrop(null); return }
    if (clickGuard.current) return
    clickGuard.current = true
    setTimeout(() => { clickGuard.current = false }, 500)
    const id = `plot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const now = new Date()
    const harvest = new Date(now); harvest.setDate(harvest.getDate() + 90)
    addCrop({
      id, name: `Plot ${crops.length + 1}`, cropType: 'rice',
      x: clamp(e.point.x), z: clamp(e.point.z), width: 3, depth: 3,
      stage: 'seedling', health: 90, plantedDate: now.toISOString().slice(0, 10),
      expectedHarvest: harvest.toISOString().slice(0, 10),
      irrigationEnabled: true, irrigationMethod: 'drip', yieldEstimate: 2000,
      pestRisk: 10, waterStress: 5, nutrientDeficiency: [], taskHistory: [],
    })
    selectCrop(id)
  }

  const dpr = QUALITY === 'low' ? [1, 1] : QUALITY === 'medium' ? [1, 1.25] : [1, 1.5]
  const shadowMapSize = QUALITY === 'low' ? 512 : QUALITY === 'medium' ? 768 : 1024
  const toneMapping = isNight ? 0.85 : 1.35

  return (
    <Canvas
      shadows={QUALITY !== 'low'}
      dpr={dpr}
      camera={{ position: [14, 12, 14], fov: 50 }}
      gl={{
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: toneMapping,
        antialias: QUALITY !== 'low',
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false,
      }}
      onCreated={({ gl: g }) => {
        g.setClearColor('#1a1a3a')
      }}
      onError={console.error}
      style={{ background: '#1a1a3a' }}
    >
      <SceneAtmosphere />
      <DynamicLighting shadowMapSize={shadowMapSize} />
      <WeatherEffects />
      <Terrain />

      <group>
        {showGrid && <gridHelper args={[40, 20, '#2D5016', '#2D5016']} position={[0, 0.01, 0]} />}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} onClick={handleGroundClick}>
          <planeGeometry args={[40, 40]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      <CropFields
        crops={crops}
        selectedCrop={selectedCrop}
        onSelect={selectCrop}
        editMode={editMode}
        selectedTool={selectedTool}
        onPointerDown={handlePointerDown}
        showLabels={showLabels}
      />

      <Structures crops={crops} />
      {showEnvironment && <Environment quality={QUALITY} />}

      {editMode && selectedTool === 'resize' && selectedCrop && (() => {
        const crop = crops.find((c) => c.id === selectedCrop)
        if (!crop) return null
        return (
          <group position={[crop.x, 0.2, crop.z]}>
            {[
              { dir: 'north' as const, pos: [0, 0, -crop.depth / 2 - 0.4], ry: 0 },
              { dir: 'south' as const, pos: [0, 0, crop.depth / 2 + 0.4], ry: Math.PI },
              { dir: 'west' as const, pos: [-crop.width / 2 - 0.4, 0, 0], ry: -Math.PI / 2 },
              { dir: 'east' as const, pos: [crop.width / 2 + 0.4, 0, 0], ry: Math.PI / 2 },
            ].map((h) => (
              <mesh key={h.dir} position={h.pos as [number, number, number]} rotation={[0, h.ry, 0]}
                onClick={(e) => { e.stopPropagation(); handleResize(crop, h.dir) }}>
                <cylinderGeometry args={[0.03, 0.05, 0.6, 8]} />
                <meshStandardMaterial color="#10B981" emissive="#10B981" emissiveIntensity={0.3} />
              </mesh>
            ))}
          </group>
        )
      })()}

      <DragHandler isDragging={isDragging} onMove={handleDragMove} onUp={stopDrag} />
      <CameraController />
    </Canvas>
  )
}

export default FarmScene
