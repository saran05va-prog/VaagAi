import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import {
  Cloud, Sun, CloudRain, Wind, Droplets, Thermometer,
  MapPin, RefreshCw, CloudSun, CloudFog,
  CloudLightning, CloudSnow, CloudDrizzle, Eye,
  Umbrella, Gauge,
} from 'lucide-react'
import { useSettingsStore } from '../stores/settingsStore'
import { useFarmStore } from '../components/farm3d/farmStore'

interface WeatherCurrent {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  precipitation: number
  condition: string
  conditionCode: number
  location: string
  updatedAt: string
}

interface WeatherForecast {
  date: string
  minTemp: number
  maxTemp: number
  condition: string
  conditionCode: number
  precipitation: number
  precipProbability: number
  windSpeed: number
}

const CONDITION_MAP: Record<number, { label: string; icon: string }> = {
  0: { label: 'Clear', icon: 'clear' },
  1: { label: 'Mainly Clear', icon: 'clear' },
  2: { label: 'Partly Cloudy', icon: 'partly_cloudy' },
  3: { label: 'Overcast', icon: 'cloudy' },
  45: { label: 'Foggy', icon: 'fog' },
  48: { label: 'Depositing Rime Fog', icon: 'fog' },
  51: { label: 'Light Drizzle', icon: 'drizzle' },
  53: { label: 'Moderate Drizzle', icon: 'drizzle' },
  55: { label: 'Dense Drizzle', icon: 'drizzle' },
  56: { label: 'Light Freezing Drizzle', icon: 'drizzle' },
  57: { label: 'Dense Freezing Drizzle', icon: 'drizzle' },
  61: { label: 'Slight Rain', icon: 'rain' },
  63: { label: 'Moderate Rain', icon: 'rain' },
  65: { label: 'Heavy Rain', icon: 'rain' },
  66: { label: 'Light Freezing Rain', icon: 'rain' },
  67: { label: 'Heavy Freezing Rain', icon: 'rain' },
  71: { label: 'Slight Snow', icon: 'snow' },
  73: { label: 'Moderate Snow', icon: 'snow' },
  75: { label: 'Heavy Snow', icon: 'snow' },
  77: { label: 'Snow Grains', icon: 'snow' },
  80: { label: 'Slight Rain Showers', icon: 'rain' },
  81: { label: 'Moderate Rain Showers', icon: 'rain' },
  82: { label: 'Violent Rain Showers', icon: 'rain' },
  85: { label: 'Slight Snow Showers', icon: 'snow' },
  86: { label: 'Heavy Snow Showers', icon: 'snow' },
  95: { label: 'Thunderstorm', icon: 'thunderstorm' },
  96: { label: 'Thunderstorm with Slight Hail', icon: 'thunderstorm' },
  99: { label: 'Thunderstorm with Heavy Hail', icon: 'thunderstorm' },
}

const weatherCodeToCondition = (code?: number): { label: string; icon: string } => {
  if (typeof code !== 'number' || !(code in CONDITION_MAP)) return { label: 'Clear', icon: 'clear' }
  return CONDITION_MAP[code]
}

const getWeatherIcon = (icon: string, size = 24) => {
  switch (icon) {
    case 'clear': return <Sun size={size} />
    case 'partly_cloudy': return <CloudSun size={size} />
    case 'cloudy': return <Cloud size={size} />
    case 'fog': return <CloudFog size={size} />
    case 'drizzle': return <CloudDrizzle size={size} />
    case 'rain': return <CloudRain size={size} />
    case 'snow': return <CloudSnow size={size} />
    case 'thunderstorm': return <CloudLightning size={size} />
    default: return <Sun size={size} />
  }
}

const getConditionColor = (code?: number) => {
  if (typeof code !== 'number') return '#34d399'
  if ([0, 1].includes(code)) return '#fbbf24'
  if ([2, 3].includes(code)) return '#94a3b8'
  if ([45, 48].includes(code)) return '#cbd5e1'
  if ([51, 53, 55, 56, 57].includes(code)) return '#60a5fa'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return '#3b82f6'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return '#e2e8f0'
  if ([95, 96, 99].includes(code)) return '#8b5cf6'
  return '#34d399'
}

const formatTime = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) } catch { return '' }
}

export default function Weather() {
  const profileLocation = useSettingsStore((s) => s.profile.location)
  const farmStoreLocation = useFarmStore((s) => s.location.name)
  const location = profileLocation || farmStoreLocation || 'Coimbatore, Tamil Nadu, India'

  const { data: current, isLoading: currentLoading, isError: currentError, refetch: refetchCurrent } = useQuery({
    queryKey: ['weather', 'current', location],
    queryFn: async () => {
      const res = await api.get('/api/weather/current', { params: { location } })
      const d = res.data
      const info = weatherCodeToCondition(d.weatherCode)
      return {
        temperature: d.temperature,
        feelsLike: d.feelsLike,
        humidity: d.humidity,
        windSpeed: d.windSpeed,
        precipitation: d.precipitation ?? 0,
        condition: info.label,
        conditionCode: d.weatherCode,
        location: d.location,
        updatedAt: d.updatedAt,
      } as WeatherCurrent
    },
    enabled: !!location,
    retry: 1,
  })

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['weather', 'forecast', location],
    queryFn: async () => {
      const res = await api.get('/api/weather/forecast', { params: { location, days: 7 } })
      return (res.data.forecast || []).map((item: any) => {
        const info = weatherCodeToCondition(item.weatherCode)
        return {
          date: item.date,
          minTemp: item.tempMin,
          maxTemp: item.tempMax,
          condition: info.label,
          conditionCode: item.weatherCode,
          precipitation: item.precipitation || 0,
          precipProbability: item.precipProbability ?? 0,
          windSpeed: item.windSpeed ?? 0,
        } as WeatherForecast
      })
    },
    enabled: !!location,
    retry: 1,
  })

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Weather</h1>
          <p className="page-subtitle">Real-time weather for your farm</p>
        </div>
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          <MapPin size={14} style={{ color: 'var(--color-primary)' }} />
          {current?.location || location}
          <button onClick={() => refetchCurrent()} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors hover:opacity-70" title="Refresh">
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Current Weather */}
      {currentLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-4"><div className="skeleton h-4 w-20 rounded mb-2" /><div className="skeleton h-8 w-16 rounded" /></div>
          ))}
        </div>
      ) : current ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {/* Main card */}
            <div className="card p-5 md:col-span-2 flex items-center gap-5" style={{ borderLeft: `4px solid ${getConditionColor(current.conditionCode)}` }}>
              <div className="text-5xl" style={{ color: getConditionColor(current.conditionCode) }}>
                {getWeatherIcon(weatherCodeToCondition(current.conditionCode).icon, 48)}
              </div>
              <div>
                <p className="text-5xl font-bold">{Math.round(current.temperature)}°C</p>
                <p className="text-base font-medium mt-1" style={{ color: 'var(--color-text-secondary)' }}>{current.condition}</p>
                {current.updatedAt && (
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Updated {formatTime(current.updatedAt)}</p>
                )}
              </div>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Thermometer size={15} style={{ color: '#f97316' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Feels Like</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(current.feelsLike)}°C</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Umbrella size={15} className="text-blue-500" />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Precipitation</span>
              </div>
              <p className="text-2xl font-bold">{current.precipitation.toFixed(1)} mm</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Droplets size={15} className="text-blue-400" />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Humidity</span>
              </div>
              <p className="text-2xl font-bold">{current.humidity}%</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wind size={15} className="text-gray-400" />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Wind Speed</span>
              </div>
              <p className="text-2xl font-bold">{Math.round(current.windSpeed)} km/h</p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye size={15} className="text-gray-400" />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Visibility</span>
              </div>
              <p className="text-2xl font-bold">
                {[45, 48].includes(current.conditionCode) ? '< 1' : '> 10'} km
              </p>
            </div>

            <div className="card p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={15} style={{ color: '#a855f7' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>Conditions</span>
              </div>
              <div className="flex items-center gap-2">
                {getWeatherIcon(weatherCodeToCondition(current.conditionCode).icon, 20)}
                <span className="text-sm font-medium capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                  {current.condition.toLowerCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Forecast */}
          <div className="card p-5">
            <h2 className="section-title mb-4">7-Day Forecast</h2>
            {forecastLoading ? (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[...Array(7)].map((_, i) => (
                  <div key={i} className="skeleton h-32 w-24 rounded-xl shrink-0" />
                ))}
              </div>
            ) : forecast && forecast.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {forecast.map((day, i) => (
                  <div key={i} className="rounded-xl p-3 text-center transition-colors hover:opacity-80"
                    style={{ background: 'var(--color-surface-2)' }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {i === 0 ? 'Today' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-xs mb-1" style={{ color: 'var(--color-text-muted)' }}>
                      {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <div className="my-2 flex justify-center" style={{ color: getConditionColor(day.conditionCode) }}>
                      {getWeatherIcon(weatherCodeToCondition(day.conditionCode).icon, 22)}
                    </div>
                    <p className="text-sm font-bold">{Math.round(day.maxTemp)}°</p>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{Math.round(day.minTemp)}°</p>
                    {day.precipProbability > 0 && (
                      <div className="mt-1 flex items-center justify-center gap-0.5 text-xs" style={{ color: '#60a5fa' }}>
                        <Umbrella size={10} />
                        {Math.round(day.precipProbability)}%
                      </div>
                    )}
                    {day.precipitation > 0 && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                        {day.precipitation.toFixed(1)}mm
                      </p>
                    )}
                    {day.windSpeed > 0 && (
                      <div className="mt-1 flex items-center justify-center gap-0.5 text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                        <Wind size={9} />
                        {Math.round(day.windSpeed)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center py-8" style={{ color: 'var(--color-text-muted)' }}>No forecast data available</p>
            )}
          </div>
        </>
      ) : (
        <div className="card p-8 mb-6 text-center">
          <Cloud size={48} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            {currentError
              ? `Weather data unavailable for "${location}"`
              : 'Loading weather data...'}
          </p>
        </div>
      )}
    </div>
  )
}
