import { useState, useEffect, useCallback, useMemo } from 'react'
import { useFarmStore, CROP_TYPES, type CropPlot, type GrowthStage } from './farmStore'
import {
  Sprout, Cloud, CloudRain, Sun, Moon, Wind, Droplets, Thermometer, Gauge,
  Plus, Trash2, Move, Maximize2, MousePointer, Edit3, Save, X,
  RefreshCw, MapPin, Ruler, Calendar, Leaf, Settings,
  TrendingUp, DollarSign, Activity, AlertTriangle, CheckCircle2,
  Clock, Tractor, BarChart3, ArrowUpRight, ArrowDownRight,
  Layers, Eye, EyeOff, Grid3X3, Camera,
  Info, Map, Zap, Search,
} from 'lucide-react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

function getConditionFromCode(code?: number): string {
  if (typeof code !== 'number') return 'Clear'
  if ([0, 1].includes(code)) return 'Clear'
  if ([2, 3].includes(code)) return 'Cloudy'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([95, 96, 99].includes(code)) return 'Thunderstorm'
  return 'Clear'
}

function useWeatherSync() {
  const { setWeather, setWeatherLoading, setWeatherError, location, weatherSyncEnabled } = useFarmStore()
  const fetchWeather = useCallback(async () => {
    if (!weatherSyncEnabled) return
    setWeatherLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/weather/current?location=${encodeURIComponent(location.name.split(',')[0])}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const condition = getConditionFromCode(data.weatherCode)
      setWeather({
        temperature: data.temperature, feelsLike: data.feelsLike || data.temperature,
        humidity: data.humidity, windSpeed: data.windSpeed || 0,
        windDirection: data.windDirection || 0, condition: condition as any,
        description: condition, precipitation: data.precipitation || 0,
        precipitationChance: data.precipitationChance || 0,
        uvIndex: data.uvIndex || 0, visibility: data.visibility || 10,
        pressure: data.pressure || 1013, dewPoint: data.dewPoint || 0,
        lastUpdated: new Date().toISOString(),
        forecast: data.forecast || [],
      })
    } catch {
      setWeather({
        temperature: 28 + Math.random() * 3, feelsLike: 30,
        humidity: 65 + Math.random() * 15, windSpeed: 10, windDirection: 180,
        condition: 'partly_cloudy', description: 'Partly Cloudy',
        precipitation: 0, precipitationChance: 15, uvIndex: 6,
        visibility: 10, pressure: 1013, dewPoint: 18,
        lastUpdated: new Date().toISOString(),
        forecast: [],
      })
    } finally { setWeatherLoading(false) }
  }, [location.name, weatherSyncEnabled])

  useEffect(() => { fetchWeather() }, [fetchWeather])
}

function useRealTimeClock() {
  const { setCurrentTime, updateSoil } = useFarmStore()
  useEffect(() => {
    const tick = () => { const n = new Date(); setCurrentTime(n); updateSoil() }
    tick(); const id = setInterval(tick, 15000)
    return () => clearInterval(id)
  }, [])
}



function StatChip({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center gap-2 p-2 bg-white/5 rounded-lg">
      <div className={`p-1.5 rounded-lg ${color || 'bg-emerald-500/20'}`}>
        <Icon size={12} className={color ? color.replace('bg-', 'text-').replace('/20', '-400') : 'text-emerald-400'} />
      </div>
      <div>
        <p className="text-xs font-bold text-white">{value}</p>
        <p className="text-[9px] text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function WeatherWidget() {
  const { weather, weatherLoading, setWeather, setWeatherLoading, location } = useFarmStore()

  const refresh = useCallback(async () => {
    setWeatherLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/weather/current?location=${encodeURIComponent(location.name.split(',')[0])}`)
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const condition = getConditionFromCode(data.weatherCode)
      setWeather({
        temperature: data.temperature, feelsLike: data.feelsLike || data.temperature,
        humidity: data.humidity, windSpeed: data.windSpeed || 0,
        windDirection: data.windDirection || 0, condition: condition as any,
        description: condition, precipitation: data.precipitation || 0,
        precipitationChance: data.precipitationChance || 0,
        uvIndex: 0, visibility: data.visibility || 10,
        pressure: data.pressure || 1013, dewPoint: 0,
        lastUpdated: new Date().toISOString(),
        forecast: data.forecast || [],
      })
    } catch {
      setWeather({
        temperature: 28, feelsLike: 30, humidity: 65, windSpeed: 10,
        windDirection: 180, condition: 'partly_cloudy', description: 'Partly Cloudy',
        precipitation: 0, precipitationChance: 15, uvIndex: 6,
        visibility: 10, pressure: 1013, dewPoint: 0,
        lastUpdated: new Date().toISOString(), forecast: [],
      })
    } finally { setWeatherLoading(false) }
  }, [location.name])

  useEffect(() => { refresh() }, [])

  const weatherIcon = (c: string) => {
    const cLow = c.toLowerCase()
    if (cLow.includes('thunder')) return <CloudRain size={16} className="text-purple-400" />
    if (cLow.includes('rain') || cLow.includes('drizzle')) return <CloudRain size={16} className="text-blue-400" />
    if (cLow.includes('cloud') || cLow.includes('fog')) return <Cloud size={16} className="text-gray-400" />
    return <Sun size={16} className="text-yellow-400" />
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-white/5 shadow-2xl">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Cloud size={13} className="text-blue-400" /> Weather
        </span>
        <button onClick={refresh} className="p-1 hover:bg-white/10 rounded transition-colors">
          <RefreshCw size={11} className={weatherLoading ? 'animate-spin text-emerald-400' : 'text-gray-500'} />
        </button>
      </div>
      {weather ? (
        <div className="p-3">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-white/5 rounded-lg">{weatherIcon(weather.condition)}</div>
            <div>
              <p className="text-xl font-bold text-white">{Math.round(weather.temperature)}°C</p>
              <p className="text-[10px] text-gray-400">{weather.description}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { icon: Droplets, label: 'Humidity', value: `${weather.humidity}%` },
              { icon: Wind, label: 'Wind', value: `${Math.round(weather.windSpeed)} km/h` },
              { icon: Sun, label: 'UV', value: `${weather.uvIndex}` },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center p-1.5 bg-white/5 rounded-lg">
                <s.icon size={10} className="text-gray-400 mb-0.5" />
                <span className="text-[10px] text-gray-300">{s.value}</span>
                <span className="text-[8px] text-gray-500">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 text-xs animate-pulse">Loading...</div>
      )}
    </div>
  )
}

function FarmStatsWidget() {
  const { crops, farmName, cultivatedArea, totalArea, soil } = useFarmStore()
  const count = crops.length
  const avgHealth = count ? Math.round(crops.reduce((s, c) => s + c.health, 0) / count) : 0
  const irr = crops.filter((c) => c.irrigationEnabled).length
  const risk = crops.filter((c) => c.pestRisk > 50).length
  const yield_ = crops.reduce((s, c) => s + (c.yieldEstimate || 0), 0)

  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-white/5 shadow-2xl">
      <div className="p-3 border-b border-white/5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Sprout size={13} className="text-emerald-400" /> Dashboard
          </span>
        </div>
      </div>
      <div className="p-3">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatChip icon={Sprout} label="Plots" value={count} color="bg-emerald-500/20" />
          <StatChip icon={Activity} label="Health" value={`${avgHealth}%`} color={avgHealth > 70 ? 'bg-emerald-500/20' : 'bg-amber-500/20'} />
          <StatChip icon={Droplets} label="Irrigated" value={irr} color="bg-blue-500/20" />
          <StatChip icon={AlertTriangle} label="Alerts" value={risk} color={risk > 0 ? 'bg-red-500/20' : 'bg-green-500/20'} />
        </div>
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between"><span className="text-gray-500">Area</span><span className="text-white">{cultivatedArea}/{totalArea} ha</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Est. Yield</span><span className="text-emerald-400">{yield_.toLocaleString()} kg</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Soil T°</span><span className="text-white">{Math.round(soil.temperature)}°C</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Moisture</span><span className="text-blue-300">{Math.round(soil.moisture)}%</span></div>
        </div>
      </div>
    </div>
  )
}

function CropEditorPanel() {
  const { crops, selectedCrop, updateCrop, removeCrop, selectCrop } = useFarmStore()
  const [local, setLocal] = useState<Partial<CropPlot>>({})
  const plot = crops.find((c) => c.id === selectedCrop)
  useEffect(() => { setLocal({}) }, [selectedCrop])

  if (!plot) return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-white/5 shadow-2xl">
      <div className="p-6 text-center">
        <MousePointer size={20} className="mx-auto mb-1.5 text-gray-600" />
        <p className="text-xs text-gray-500">Select a plot to edit</p>
      </div>
    </div>
  )

  const cd = CROP_TYPES[local.cropType || plot.cropType] || CROP_TYPES.rice
  const daysG = Math.ceil((Date.now() - new Date(plot.plantedDate).getTime()) / 86400000)
  const daysT = Math.ceil((new Date(plot.expectedHarvest).getTime() - new Date(plot.plantedDate).getTime()) / 86400000)
  const hasChanges = Object.keys(local).length > 0

  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-white/5 shadow-2xl">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Edit3 size={12} className="text-emerald-400" /> {plot.name}
        </span>
        <button onClick={() => selectCrop(null)} className="p-1 hover:bg-white/10 rounded"><X size={12} className="text-gray-500" /></button>
      </div>
      <div className="p-3 space-y-2.5 max-h-80 overflow-y-auto">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-gray-500">Crop</label>
            <select value={local.cropType ?? plot.cropType} onChange={(e) => setLocal((p) => ({ ...p, cropType: e.target.value }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:border-emerald-500 outline-none">
              {Object.entries(CROP_TYPES).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[9px] text-gray-500">Stage</label>
            <select value={local.stage ?? plot.stage} onChange={(e) => setLocal((p) => ({ ...p, stage: e.target.value as GrowthStage }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 outline-none">
              {(['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'] as GrowthStage[]).map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9px] text-gray-500">Width</label>
            <input type="number" min={0.5} max={10} step={0.5} value={local.width ?? plot.width}
              onChange={(e) => setLocal((p) => ({ ...p, width: parseFloat(e.target.value) }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:border-emerald-500 outline-none" />
          </div>
          <div>
            <label className="text-[9px] text-gray-500">Depth</label>
            <input type="number" min={0.5} max={10} step={0.5} value={local.depth ?? plot.depth}
              onChange={(e) => setLocal((p) => ({ ...p, depth: parseFloat(e.target.value) }))}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-gray-200 focus:border-emerald-500 outline-none" />
          </div>
        </div>

        <div>
          <label className="text-[9px] text-gray-500">Health: <span className={(local.health ?? plot.health) > 70 ? 'text-emerald-400' : (local.health ?? plot.health) > 40 ? 'text-amber-400' : 'text-red-400'}>{local.health ?? plot.health}%</span></label>
          <input type="range" min={0} max={100} value={local.health ?? plot.health}
            onChange={(e) => setLocal((p) => ({ ...p, health: parseInt(e.target.value) }))}
            className="w-full accent-emerald-500" />
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px]">
          <div><span className="text-gray-500">Planted </span><span className="text-gray-300">{new Date(plot.plantedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span></div>
          <div><span className="text-gray-500">Harvest </span><span className="text-gray-300">{new Date(plot.expectedHarvest).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span></div>
        </div>
        <div className="text-[10px] text-gray-500">{daysG}d grown · {Math.max(0, daysT - daysG)}d remaining</div>

        {plot.diseaseDetected && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-[10px] text-red-400 flex items-center gap-1">
            <AlertTriangle size={10} /> {plot.diseaseDetected}
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={() => { if (selectedCrop && hasChanges) { updateCrop(selectedCrop, local); setLocal({}) } }}
            disabled={!hasChanges}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${hasChanges ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-white/5 text-gray-600 cursor-not-allowed'}`}>
            <Save size={11} /> Save
          </button>
          <button onClick={() => { if (confirm('Delete this plot?')) { removeCrop(selectedCrop!); selectCrop(null) } }}
            className="bg-red-500/20 hover:bg-red-500/40 text-red-400 px-2 py-1.5 rounded-lg transition-colors">
            <Trash2 size={11} />
          </button>
        </div>
      </div>
    </div>
  )
}

function ToolSelector() {
  const { editMode, setEditMode, selectedTool, setSelectedTool, showGrid, setShowGrid, showLabels, setShowLabels } = useFarmStore()
  const tools = [
    { id: 'select' as const, icon: MousePointer, label: 'Select' },
    { id: 'move' as const, icon: Move, label: 'Move' },
    { id: 'resize' as const, icon: Maximize2, label: 'Resize' },
    { id: 'add' as const, icon: Plus, label: 'Add' },
    { id: 'delete' as const, icon: Trash2, label: 'Delete' },
  ]

  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-white/5 shadow-2xl">
      <div className="p-3 border-b border-white/5 flex items-center justify-between">
        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Settings size={12} /> Tools
        </span>
        <button onClick={() => setEditMode(!editMode)}
          className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-colors ${editMode ? 'bg-emerald-600 text-white' : 'bg-white/10 text-gray-400 hover:bg-white/20'}`}>
          {editMode ? 'Done' : 'Edit'}
        </button>
      </div>
      <div className="p-3 space-y-2">
        <div className="grid grid-cols-5 gap-1">
          {tools.map((t) => (
            <button key={t.id} onClick={() => { setEditMode(true); setSelectedTool(t.id) }}
              className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-colors ${selectedTool === t.id && editMode ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40' : 'bg-white/5 text-gray-500 hover:bg-white/10 border border-transparent'}`}>
              <t.icon size={13} />
              <span className="text-[8px]">{t.label}</span>
            </button>
          ))}
        </div>
        <div className="space-y-1">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="w-3 h-3 rounded accent-emerald-500" />
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Grid3X3 size={10} /> Grid</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)} className="w-3 h-3 rounded accent-emerald-500" />
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Eye size={10} /> Labels</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function SmartAlerts() {
  const { crops } = useFarmStore()
  const alerts = useMemo(() => {
    const a: { type: 'critical' | 'warning'; msg: string; plot: string }[] = []
    crops.forEach((c) => {
      if (c.pestRisk > 60) a.push({ type: 'critical', msg: 'High pest risk', plot: c.name })
      if (c.waterStress > 60) a.push({ type: 'warning', msg: 'Water stress', plot: c.name })
      if (c.health < 40) a.push({ type: 'critical', msg: 'Health critical', plot: c.name })
      if (c.diseaseDetected) a.push({ type: 'warning', msg: c.diseaseDetected, plot: c.name })
    })
    return a
  }, [crops])

  if (alerts.length === 0) return null

  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-white/5 shadow-2xl">
      <div className="p-3 border-b border-white/5">
        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
          <AlertTriangle size={12} className="text-amber-400" /> Alerts ({alerts.length})
        </span>
      </div>
      <div className="p-3 space-y-1.5 max-h-28 overflow-y-auto">
        {alerts.slice(0, 5).map((a, i) => (
          <div key={i} className={`p-1.5 rounded-lg text-[10px] flex items-start gap-1.5 ${a.type === 'critical' ? 'bg-red-500/10' : 'bg-amber-500/10'}`}>
            <AlertTriangle size={9} className={`mt-0.5 ${a.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`} />
            <div><p className="text-gray-200">{a.msg}</p><p className="text-gray-500">{a.plot}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActions() {
  const { crops, addCrop } = useFarmStore()
  const addQuick = () => {
    const id = `plot_${Date.now()}`
    const now = new Date(); const h = new Date(now); h.setDate(h.getDate() + 90)
    addCrop({
      id, name: `Plot ${crops.length + 1}`, cropType: 'rice',
      x: (Math.random() - 0.5) * 16, z: (Math.random() - 0.5) * 16,
      width: 3, depth: 3, stage: 'seedling', health: 90,
      plantedDate: now.toISOString().slice(0, 10),
      expectedHarvest: h.toISOString().slice(0, 10),
      irrigationEnabled: true, irrigationMethod: 'drip',
      yieldEstimate: 2000, pestRisk: 10, waterStress: 5,
      nutrientDeficiency: [], taskHistory: [],
    })
  }

  return (
    <div className="bg-gray-900/80 backdrop-blur-lg rounded-xl border border-white/5 shadow-2xl">
      <div className="p-3 border-b border-white/5">
        <span className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Zap size={12} className="text-amber-400" /> Quick Actions
        </span>
      </div>
      <div className="p-3 grid grid-cols-2 gap-1.5">
        {[
          { icon: Plus, label: 'Add Plot', onClick: addQuick, color: 'text-emerald-400' },
          { icon: Tractor, label: 'Equipment', color: 'text-blue-400' },
          { icon: BarChart3, label: 'Analytics', color: 'text-purple-400' },
          { icon: DollarSign, label: 'Finances', color: 'text-yellow-400' },
        ].map((a, i) => (
          <button key={i} onClick={a.onClick}
            className="flex items-center gap-1.5 p-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] text-gray-300 transition-colors">
            <a.icon size={12} className={a.color} />
            {a.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Farm3DUIControls() {
  useWeatherSync()
  useRealTimeClock()

  const { crops, selectedCrop, setCameraMode, cameraMode, dayPhase, isNight } = useFarmStore()

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      <div className="flex h-full p-3 gap-3">
        <div className="w-64 space-y-3 overflow-y-auto pointer-events-auto custom-scrollbar">
          <FarmStatsWidget />
          <SmartAlerts />
          <WeatherWidget />
        </div>

        <div className="flex-1" />

        <div className="w-64 space-y-3 overflow-y-auto pointer-events-auto custom-scrollbar pb-24">
          <ToolSelector />
          {selectedCrop && <CropEditorPanel />}
          <QuickActions />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <div className="bg-gray-900/90 backdrop-blur-lg rounded-full border border-white/5 px-3 py-1.5 flex items-center gap-2 shadow-2xl">
          {(['free', 'top'] as const).map((m) => (
            <button key={m} onClick={() => setCameraMode(m)}
              className={`p-1.5 rounded-full transition-colors ${cameraMode === m ? 'bg-emerald-600/30 text-emerald-300' : 'text-gray-500 hover:text-gray-300'}`}>
              {m === 'free' ? <Map size={13} /> : <Camera size={13} />}
            </button>
          ))}
          <div className="w-px h-3 bg-white/10" />
          <span className="text-[10px] text-gray-400 capitalize">{dayPhase}</span>
          <span className="text-[10px]">{isNight ? <Moon size={11} className="text-blue-300" /> : <Sun size={11} className="text-yellow-400" />}</span>
        </div>
      </div>
    </div>
  )
}

export default Farm3DUIControls