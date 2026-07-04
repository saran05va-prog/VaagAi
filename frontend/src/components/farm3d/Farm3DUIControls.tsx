import { useState, useEffect, useCallback, useMemo } from 'react'
import { useFarmStore, CROP_TYPES, type CropPlot, type FarmState, type FinancialRecord } from './farmStore'
import {
  Cloud, CloudRain, Sun, Moon, Wind, Droplets, Thermometer, Gauge,
  Plus, Trash2, Move, Maximize2, MousePointer, Edit3, Save, X,
  RefreshCw, MapPin, Ruler, Calendar, Leaf, Settings,
  Sprout, TrendingUp, DollarSign, Activity, AlertTriangle, CheckCircle2,
  Clock, Tractor, BarChart3, ArrowUpRight, ArrowDownRight,
  Layers, Eye, EyeOff, Grid3X3, Camera,
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
    setWeatherError(null)
    try {
      const res = await fetch(`${API_URL}/api/weather/current?location=${encodeURIComponent(location.name.split(',')[0])}`)
      if (!res.ok) throw new Error('Weather fetch failed')
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
      setWeatherError('Weather sync unavailable')
      setWeather({
        temperature: 28 + Math.random() * 5, feelsLike: 30,
        humidity: 55 + Math.random() * 20, windSpeed: 8 + Math.random() * 10,
        windDirection: Math.random() * 360, condition: 'partly_cloudy',
        description: 'Partly Cloudy', precipitation: Math.random() * 5,
        precipitationChance: 20, uvIndex: 6, visibility: 10,
        pressure: 1013, dewPoint: 18,
        lastUpdated: new Date().toISOString(),
        forecast: [],
      })
    } finally {
      setWeatherLoading(false)
    }
  }, [location.name, weatherSyncEnabled])

  useEffect(() => {
    fetchWeather()
    const interval = setInterval(fetchWeather, 300000)
    return () => clearInterval(interval)
  }, [fetchWeather])
}

function useRealTimeClock() {
  const { setCurrentTime, updateSoil } = useFarmStore()
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      updateSoil()
    }, 10000)
    return () => clearInterval(interval)
  }, [])
}

function StatCard({ icon: Icon, label, value, trend, color }: {
  icon: any; label: string; value: string | number; trend?: { value: number; up: boolean }; color?: string
}) {
  return (
    <div className="bg-gray-800/80 backdrop-blur-sm rounded-lg border border-gray-700/60 p-3">
      <div className="flex items-start justify-between">
        <div className={`p-1.5 rounded-md ${color ? `bg-${color}/20` : 'bg-emerald-500/20'}`}>
          <Icon size={14} className={color ? `text-${color}-400` : 'text-emerald-400'} />
        </div>
        {trend && (
          <div className={`flex items-center gap-0.5 text-[10px] ${trend.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.up ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend.value}%
          </div>
        )}
      </div>
      <p className="text-lg font-bold text-white mt-2">{value}</p>
      <p className="text-[10px] text-gray-500">{label}</p>
    </div>
  )
}

function WeatherWidget() {
  const { weather, weatherLoading, weatherSyncEnabled, setWeatherSyncEnabled } = useFarmStore()
  const { setWeather, setWeatherLoading, setWeatherError, location } = useFarmStore()

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
        uvIndex: data.uvIndex || 0, visibility: data.visibility || 10,
        pressure: data.pressure || 1013, dewPoint: data.dewPoint || 0,
        lastUpdated: new Date().toISOString(),
        forecast: data.forecast || [],
      })
    } catch {
      setWeather({
        temperature: 28, feelsLike: 30, humidity: 65, windSpeed: 12,
        windDirection: 180, condition: 'partly_cloudy', description: 'Demo',
        precipitation: 0, precipitationChance: 20, uvIndex: 6, visibility: 10,
        pressure: 1013, dewPoint: 0, lastUpdated: new Date().toISOString(),
        forecast: [],
      })
    } finally { setWeatherLoading(false) }
  }, [location.name])

  const weatherIcon = (condition: string) => {
    const c = condition.toLowerCase()
    if (c.includes('thunder')) return <CloudRain size={20} className="text-purple-400" />
    if (c.includes('rain') || c.includes('drizzle')) return <CloudRain size={20} className="text-blue-400" />
    if (c.includes('cloud') || c.includes('overcast') || c.includes('fog')) return <Cloud size={20} className="text-gray-400" />
    if (c.includes('clear') || c.includes('sun')) return <Sun size={20} className="text-yellow-400" />
    return <Sun size={20} className="text-yellow-400" />
  }

  useEffect(() => { refresh() }, [])

  if (!weather) {
    return (
      <div className="p-4 bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/80">
        <p className="text-sm text-gray-400 animate-pulse">Loading weather...</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/80">
      <div className="p-3 border-b border-gray-700/60 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Cloud size={14} className="text-blue-400" />
          Live Weather
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{new Date(weather.lastUpdated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={refresh} disabled={weatherLoading} className="p-1 hover:bg-gray-700/60 rounded transition-colors">
            <RefreshCw size={12} className={weatherLoading ? 'animate-spin text-emerald-400' : 'text-gray-500'} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-3 mb-3">
          <div>{getWeatherIcon(weather.condition)}</div>
          <div>
            <p className="text-2xl font-bold text-white">{Math.round(weather.temperature)}°C</p>
            <p className="text-[10px] text-gray-400">{weather.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-1.5 text-[10px]">
          <div className="flex flex-col items-center gap-0.5 p-1.5 bg-gray-800/60 rounded-lg">
            <Droplets size={12} className="text-blue-400" />
            <span className="text-gray-300">{weather.humidity}%</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 p-1.5 bg-gray-800/60 rounded-lg">
            <Wind size={12} className="text-gray-400" />
            <span className="text-gray-300">{Math.round(weather.windSpeed)} km/h</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 p-1.5 bg-gray-800/60 rounded-lg">
            <Sun size={12} className="text-yellow-400" />
            <span className="text-gray-300">UV {weather.uvIndex}</span>
          </div>
          <div className="flex flex-col items-center gap-0.5 p-1.5 bg-gray-800/60 rounded-lg">
            <Thermometer size={12} className="text-orange-400" />
            <span className="text-gray-300">{Math.round(weather.pressure)} hPa</span>
          </div>
        </div>

        {weather.forecast && weather.forecast.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-700/60">
            <p className="text-[10px] text-gray-500 mb-2">7-Day Forecast</p>
            <div className="flex gap-1 overflow-x-auto">
              {weather.forecast.slice(0, 5).map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-1 min-w-[40px] p-1.5 bg-gray-800/40 rounded-lg">
                  <span className="text-[9px] text-gray-400">{new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short' })}</span>
                  {getWeatherIcon(day.condition)}
                  <span className="text-[10px] text-white font-medium">{Math.round(day.tempHigh)}°</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <label className="flex items-center gap-1.5 mt-3 cursor-pointer">
          <input type="checkbox" checked={weatherSyncEnabled} onChange={(e) => setWeatherSyncEnabled(e.target.checked)} className="w-3 h-3 rounded accent-emerald-500" />
          <span className="text-[10px] text-gray-500">Auto-sync</span>
        </label>
      </div>
    </div>
  )
}

function FarmStatsWidget() {
  const { crops, farmName, totalArea, cultivatedArea, location, soil } = useFarmStore()

  const vol = crops.length
  const avgHealth = vol > 0 ? Math.round(crops.reduce((s, c) => s + c.health, 0) / vol) : 0
  const activeIrr = crops.filter(c => c.irrigationEnabled).length
  const highRisk = crops.filter(c => c.pestRisk > 50).length
  const totalEstYield = crops.reduce((s, c) => s + (c.yieldEstimate || 0), 0)

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/80">
      <div className="p-3 border-b border-gray-700/60">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
            <Sprout size={14} className="text-emerald-400" />
            Farm Overview
          </h3>
          <span className="text-[10px] text-gray-500">{location.name.split(',')[0]}</span>
        </div>
      </div>

      <div className="p-3">
        <div className="grid grid-cols-2 gap-2 mb-3">
          <StatCard icon={Sprout} label="Active Plots" value={vol} />
          <StatCard icon={Activity} label="Avg Health" value={`${avgHealth}%`} trend={{ value: 5, up: avgHealth > 70 }} />
          <StatCard icon={Droplets} label="Irrigated" value={activeIrr} />
          <StatCard icon={AlertTriangle} label="Pest Risk" value={highRisk} trend={{ value: highRisk, up: highRisk > 0 }} />
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-500">Farm</span>
            <span className="text-white font-medium">{farmName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1"><MapPin size={10} /> Area</span>
            <span className="text-white">{cultivatedArea}/{totalArea} ha</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1"><TrendingUp size={10} /> Est. Yield</span>
            <span className="text-emerald-400 font-medium">{totalEstYield.toLocaleString()} kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 flex items-center gap-1"><Thermometer size={10} /> Soil Temp</span>
            <span className="text-white">{Math.round(soil.temperature)}°C</span>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-gray-700/60 space-y-1.5">
          <p className="text-[10px] text-gray-500 mb-1">Soil Health</p>
          <SoilBar label="Moisture" value={soil.moisture} />
          <SoilBar label="Nitrogen" value={soil.nitrogen} color="text-blue-400" />
          <SoilBar label="Phosphorus" value={soil.phosphorus} color="text-orange-400" />
          <SoilBar label="Potassium" value={soil.potassium} color="text-yellow-400" />
          <div className="flex justify-between text-[10px] mt-1">
            <span className="text-gray-500">pH: {soil.ph.toFixed(1)}</span>
            <span className="text-gray-500">OM: {soil.organicMatter.toFixed(1)}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function SoilBar({ label, value, color = 'text-emerald-400' }: { label: string; value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-[10px] w-16 ${color}`}>{label}</span>
      <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(100, value)}%`, background: value > 70 ? '#10B981' : value > 40 ? '#F59E0B' : '#EF4444' }} />
      </div>
      <span className="text-[10px] text-gray-400 w-6 text-right">{Math.round(value)}</span>
    </div>
  )
}

function CropEditorPanel() {
  const { crops, selectedCrop, updateCrop, removeCrop, selectCrop } = useFarmStore()
  const [localChanges, setLocalChanges] = useState<Partial<CropPlot>>({})

  const selectedPlot = crops.find(c => c.id === selectedCrop)

  useEffect(() => { if (selectedPlot) setLocalChanges({}) }, [selectedPlot])

  const handleSave = () => {
    if (selectedCrop && Object.keys(localChanges).length > 0) {
      updateCrop(selectedCrop, localChanges)
      setLocalChanges({})
    }
  }

  const handleChange = (field: keyof CropPlot, value: any) => {
    setLocalChanges(prev => ({ ...prev, [field]: value }))
  }

  if (!selectedPlot) {
    return (
      <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/80 p-6">
        <div className="text-center">
          <MousePointer size={24} className="mx-auto mb-2 text-gray-600" />
          <p className="text-sm text-gray-500">Click a crop plot to view and edit details</p>
        </div>
      </div>
    )
  }

  const hasChanges = Object.keys(localChanges).length > 0
  const cropData = CROP_TYPES[localChanges.cropType || selectedPlot.cropType] || CROP_TYPES.rice
  const daysToHarvest = Math.ceil((new Date(selectedPlot.expectedHarvest).getTime() - new Date(selectedPlot.plantedDate).getTime()) / (1000 * 60 * 60 * 24))
  const daysGrown = Math.ceil((Date.now() - new Date(selectedPlot.plantedDate).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/80">
      <div className="p-3 border-b border-gray-700/60 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Edit3 size={14} className="text-emerald-400" />
          {selectedPlot.name}
        </h3>
        <button onClick={() => { selectCrop(null) }} className="p-1 hover:bg-gray-700/60 rounded transition-colors">
          <X size={12} className="text-gray-500" />
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">Crop Type</label>
            <select value={localChanges.cropType ?? selectedPlot.cropType}
              onChange={(e) => handleChange('cropType', e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none">
              {Object.entries(CROP_TYPES).map(([key, v]) => (
                <option key={key} value={key}>{v.icon} {v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Growth Stage</label>
            <select value={localChanges.stage ?? selectedPlot.stage}
              onChange={(e) => handleChange('stage', e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-emerald-500 focus:outline-none">
              <option value="seedling">🌱 Seedling</option>
              <option value="vegetative">🌿 Vegetative</option>
              <option value="flowering">🌸 Flowering</option>
              <option value="fruiting">🍎 Fruiting</option>
              <option value="harvest">🌾 Harvest</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">Health</label>
            <input type="range" min="0" max="100"
              value={localChanges.health ?? selectedPlot.health}
              onChange={(e) => handleChange('health', parseInt(e.target.value))}
              className="w-full accent-emerald-500" />
            <div className="text-[10px] text-right mt-0.5"
              style={{ color: (localChanges.health ?? selectedPlot.health) > 70 ? '#10B981' : (localChanges.health ?? selectedPlot.health) > 40 ? '#F59E0B' : '#EF4444' }}>
              {localChanges.health ?? selectedPlot.health}%
            </div>
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Irrigation</label>
            <select value={localChanges.irrigationMethod ?? selectedPlot.irrigationMethod}
              onChange={(e) => handleChange('irrigationMethod', e.target.value)}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-emerald-500 focus:outline-none">
              <option value="drip">💧 Drip</option>
              <option value="sprinkler">💦 Sprinkler</option>
              <option value="flood">🌊 Flood</option>
              <option value="center_pivot">🔄 Pivot</option>
              <option value="manual">🪣 Manual</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">Width</label>
            <input type="number" min="0.5" max="10" step="0.5"
              value={localChanges.width ?? selectedPlot.width}
              onChange={(e) => handleChange('width', parseFloat(e.target.value))}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-emerald-500 focus:outline-none" />
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Depth</label>
            <input type="number" min="0.5" max="10" step="0.5"
              value={localChanges.depth ?? selectedPlot.depth}
              onChange={(e) => handleChange('depth', parseFloat(e.target.value))}
              className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-emerald-500 focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-gray-500">Name</label>
          <input type="text"
            value={localChanges.name ?? selectedPlot.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-gray-800/80 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:border-emerald-500 focus:outline-none" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-gray-500">Planted</label>
            <p className="text-xs text-gray-300">{new Date(selectedPlot.plantedDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p className="text-[10px] text-gray-500">{daysGone} days ago</p>
          </div>
          <div>
            <label className="text-[10px] text-gray-500">Harvest</label>
            <p className="text-xs text-gray-400">{new Date(selectedPlot.expectedHarvest).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            <p className="text-[10px] text-gray-500">{daysToPlant - daysGrown} days left</p>
          </div>
        </div>

        {selectedPlot.taskHistory.length > 0 && (
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Recent Tasks</label>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {selectedPlot.taskHistory.slice(-3).map((task) => (
                <div key={task.id} className="flex items-center gap-1.5 text-[10px]">
                  {task.completed ? (
                    <CheckCircle2 size={10} className="text-emerald-400" />
                  ) : (
                    <Clock size={10} className="text-yellow-400" />
                  )}
                  <span className={task.completed ? 'text-gray-400 line-through' : 'text-gray-300'}>{task.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedPlot.diseaseDetected && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
            <p className="text-[10px] text-red-400 flex items-center gap-1">
              <AlertTriangle size={10} /> {selectedPlot.diseaseDetected}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button onClick={handleSave} disabled={!hasChanges}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
              hasChanges ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-gray-800 text-gray-600 cursor-not-allowed'
            }`}>
            <Save size={12} /> Save
          </button>
          <button onClick={() => { if (confirm('Delete this crop plot?')) { removeCrop(selectedCrop!); selectCrop(null) } }}
            className="bg-red-600/60 hover:bg-red-600 text-white px-2 py-1.5 rounded-lg transition-colors">
            <Trash2 size={12} />
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
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/80">
      <div className="p-3 border-b border-gray-700/60 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Settings size={14} />
          Tools
        </h3>
        <button onClick={() => setEditMode(!editMode)}
          className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${
            editMode ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}>
          {editMode ? 'Done Editing' : 'Edit Farm'}
        </button>
      </div>

      <div className="p-3 space-y-3">
        <div className="grid grid-cols-5 gap-1">
          {tools.map(tool => (
            <button key={tool.id} onClick={() => { setEditMode(true); setSelectedTool(tool.id) }}
              className={`p-1.5 rounded-lg flex flex-col items-center gap-0.5 transition-colors ${
                selectedTool === tool.id && editMode ? 'bg-emerald-600/40 text-emerald-300 border border-emerald-500/40' : 'bg-gray-800/60 text-gray-500 hover:bg-gray-700 border border-transparent'
              }`}>
              <tool.icon size={14} />
              <span className="text-[9px]">{tool.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)}
              className="w-3 h-3 rounded accent-emerald-500" />
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Grid3X3 size={10} /> Show Grid</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input type="checkbox" checked={showLabels} onChange={(e) => setShowLabels(e.target.checked)}
              className="w-3 h-3 rounded accent-emerald-500" />
            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Eye size={10} /> Show Labels</span>
          </label>
        </div>
      </div>
    </div>
  )
}

function SmartAlertsPanel() {
  const { crops } = useFarmStore()

  const alerts = useMemo(() => {
    const result: { type: 'warning' | 'critical' | 'info'; message: string; plot: string }[] = []
    crops.forEach(c => {
      if (c.pestRisk > 60) result.push({ type: 'critical', message: `High pest risk detected`, plot: c.name })
      if (c.waterStress > 60) result.push({ type: 'warning', message: `Crop under water stress`, plot: c.name })
      if (c.health < 40) result.push({ type: 'critical', message: `Health critically low`, plot: c.name })
      if (c.diseaseDetected) result.push({ type: 'warning', message: `${c.diseaseDetected}`, plot: c.name })
    })
    return result
  }, [crops])

  if (alerts.length === 0) return null

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/80">
      <div className="p-3 border-b border-gray-700/60">
        <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-amber-400" />
          Alerts ({alerts.length})
        </h3>
      </div>
      <div className="p-3 space-y-2">
        {alerts.slice(0, 4).map((alert, i) => (
          <div key={i} className={`p-2 rounded-lg text-[10px] flex items-start gap-1.5 ${
            alert.type === 'critical' ? 'bg-red-500/10 border border-red-500/20' :
            alert.type === 'warning' ? 'bg-amber-500/10 border border-amber-500/20' :
            'bg-blue-500/10 border border-blue-500/20'
          }`}>
            {alert.type === 'critical' ? <AlertTriangle size={10} className="text-red-400 mt-0.5" /> :
             alert.type === 'warning' ? <AlertTriangle size={10} className="text-amber-400 mt-0.5" /> :
             <Info size={10} className="text-blue-400 mt-0.5" />}
            <div>
              <p className="text-gray-200">{alert.message}</p>
              <p className="text-gray-500">{alert.plot}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function QuickActionsBar() {
  const { crops, addCrop } = useFarmStore()

  const addQuickPlot = () => {
    const id = `plot_${Date.now()}`
    const now = new Date()
    const harvest = new Date(now); harvest.setDate(harvest.getDate() + 90)
    addCrop({
      id, name: `Quick Plot ${crops.length + 1}`, cropType: 'rice',
      x: (Math.random() - 0.5) * 18, z: (Math.random() - 0.5) * 18,
      width: 3, depth: 3, stage: 'seedling', health: 90,
      plantedDate: now.toISOString().slice(0, 10),
      expectedHarvest: harvest.toISOString().slice(0, 10),
      irrigationEnabled: true, irrigationMethod: 'drip',
      yieldEstimate: 2000, pestRisk: 10, waterStress: 5,
      nutrientDeficiency: [], taskHistory: [],
    })
  }

  return (
    <div className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700/80">
      <div className="p-3 border-b border-gray-700/60">
        <h3 className="text-xs font-semibold text-white flex items-center gap-1.5">
          <Zap size={14} className="text-yellow-400" />
          Quick Actions
        </h3>
      </div>
      <div className="p-3 grid grid-cols-2 gap-2">
        <button onClick={addQuickPlot}
          className="flex items-center gap-2 p-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg text-xs text-gray-300 transition-colors">
          <Plus size={14} className="text-emerald-400" />
          Add Plot
        </button>
        <button className="flex items-center gap-2 p-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg text-xs text-gray-300 transition-colors">
          <Tractor size={14} className="text-blue-400" />
          Equipment
        </button>
        <button className="flex items-center gap-2 p-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg text-xs text-gray-300 transition-colors">
          <BarChart3 size={14} className="text-purple-400" />
          Analytics
        </button>
        <button className="flex items-center gap-2 p-2 bg-gray-800/60 hover:bg-gray-700/60 rounded-lg text-xs text-gray-300 transition-colors">
          <DollarSign size={14} className="text-yellow-400" />
          Finance
        </button>
      </div>
    </div>
  )
}

export function Farm3DUIControls() {
  useWeatherSync()
  useRealTimeClock()

  const crops = useFarmStore((s) => s.crops)
  const selectedCrop = useFarmStore((s) => s.selectedCrop)
  const setCameraMode = useFarmStore((s) => s.setCameraMode)
  const cameraMode = useFarmStore((s) => s.cameraMode)
  const isNight = useFarmStore((s) => s.isNight)
  const dayPhase = useFarmStore((s) => s.dayPhase)

  return (
    <>
      <div className="absolute top-3 left-3 right-3 flex items-start gap-3 pointer-events-none z-10">
        <div className="pointer-events-auto w-[280px] space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto pr-1 custom-scrollbar">
          <FarmStatsWidget />
          {crops.length > 0 && <SmartAlertsPanel />}
          <WeatherWidget />
        </div>

        <div className="pointer-events-auto ml-auto w-[280px] space-y-3 max-h-[calc(100vh-100px)] overflow-y-auto pr-1 pb-6 custom-scrollbar">
          <ToolSelector />
          {selectedCrop && <CropEditorPanel />}
          <QuickActionsBar />
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto z-10">
        <div className="bg-gray-900/90 backdrop-blur-md rounded-full border border-gray-700/60 px-2 py-1.5 flex items-center gap-1">
          <button onClick={() => setCameraMode('free')}
            className={`p-1.5 rounded-full transition-colors ${cameraMode === 'free' ? 'bg-emerald-600/30 text-emerald-300' : 'text-gray-500 hover:text-gray-300'}`}
            title="Free Camera">
            <Map size={14} />
          </button>
          <button onClick={() => setCameraMode('top')}
            className={`p-1.5 rounded-full transition-colors ${cameraMode === 'top' ? 'bg-emerald-600/30 text-emerald-300' : 'text-gray-500 hover:text-gray-300'}`}
            title="Top View">
            <MapPin size={14} />
          </button>
          <div className="w-px h-4 bg-gray-700/60 mx-1" />
          <span className="text-[10px] text-gray-500 px-1">{dayPhase.charAt(0).toUpperCase() + dayPhase.slice(1)}</span>
          <span className="text-[10px] text-gray-500">
            {isNight ? <Moon size={12} className="inline text-blue-300" /> : <Sun size={12} className="inline text-yellow-400" />}
          </span>
        </div>
      </div>
    </>
  )
}

export default Farm3DUIControls