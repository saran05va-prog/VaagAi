import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { useFarmStore } from '../components/farm3d/farmStore'
import {
  format, startOfMonth, startOfWeek, endOfWeek, addDays, subMonths, addMonths, isSameDay, isSameMonth, isToday, addWeeks, subWeeks,
} from 'date-fns'
import { getTasksForDay } from '../lib/cropDatabase'
import api from '../lib/api'
import { ChevronLeft, ChevronRight, CalendarDays, List, Columns3, CalendarCheck, Circle, CheckCircle2, AlertCircle, Sprout, Droplets, Bug, Scissors, Flower2, FlaskConical, TreePine } from 'lucide-react'

type ViewMode = 'month' | 'week' | 'day'

function daysBetween(start: string, end: Date) {
  try {
    const s = new Date(start)
    const diff = Math.ceil((+end - +s) / (1000 * 60 * 60 * 24))
    return Math.max(1, diff)
  } catch {
    return 1
  }
}

function taskTypeIcon(type: string) {
  switch (type) {
    case 'irrigate': return <Droplets size={14} />
    case 'fertilize': return <FlaskConical size={14} />
    case 'pesticide': return <Bug size={14} />
    case 'prune': return <Scissors size={14} />
    case 'harvest': return <Sprout size={14} />
    case 'inspect': return <AlertCircle size={14} />
    case 'soil_test': return <FlaskConical size={14} />
    default: return <Circle size={14} />
  }
}

function taskTypeColor(type: string) {
  switch (type) {
    case 'irrigate': return '#3B82F6'
    case 'fertilize': return '#8B5CF6'
    case 'pesticide': return '#EF4444'
    case 'prune': return '#F59E0B'
    case 'harvest': return '#10B981'
    case 'inspect': return '#6366F1'
    case 'soil_test': return '#EC4899'
    default: return '#6B7280'
  }
}

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function FarmCalendar() {
  const { crops, taskCompletions, setTaskCompletions, markTaskComplete, unmarkTaskComplete } = useFarmStore()
  const [viewMode, setViewMode] = useState<ViewMode>('month')
  const [viewDate, setViewDate] = useState<Date>(new Date())
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedPlotId, setSelectedPlotId] = useState<string>('all')
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const hasLoadedRef = useRef(false)

  const filteredCrops = useMemo(() => {
    const base = selectedPlotId === 'all' ? crops : crops.filter((c) => c.id === selectedPlotId)
    return Array.from(new Map(base.map((p) => [`${p.name}-${p.plantedDate}-${p.cropType}`, p])).values())
  }, [crops, selectedPlotId])

  const today = new Date()

  const handlePrev = useCallback(() => {
    if (viewMode === 'month') setViewDate((d) => subMonths(d, 1))
    else if (viewMode === 'week') setViewDate((d) => subWeeks(d, 1))
    else setViewDate((d) => addDays(d, -1))
  }, [viewMode])

  const handleNext = useCallback(() => {
    if (viewMode === 'month') setViewDate((d) => addMonths(d, 1))
    else if (viewMode === 'week') setViewDate((d) => addWeeks(d, 1))
    else setViewDate((d) => addDays(d, 1))
  }, [viewMode])

  const handleToday = useCallback(() => {
    setViewDate(new Date())
    setSelectedDate(new Date())
  }, [])

  const dateLabel = useMemo(() => {
    if (viewMode === 'month') return format(viewDate, 'MMMM yyyy')
    if (viewMode === 'week') {
      const start = startOfWeek(viewDate, { weekStartsOn: 0 })
      const end = endOfWeek(viewDate, { weekStartsOn: 0 })
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    }
    return format(viewDate, 'EEEE, MMMM d, yyyy')
  }, [viewMode, viewDate])

  const days = useMemo(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(viewDate)
      const calStart = startOfWeek(monthStart, { weekStartsOn: 0 })
      return Array.from({ length: 42 }, (_, i) => addDays(calStart, i))
    }
    if (viewMode === 'week') {
      const weekStart = startOfWeek(viewDate, { weekStartsOn: 0 })
      return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
    }
    return [viewDate]
  }, [viewMode, viewDate])

  const daySummaries = useMemo(() => {
    const map = new Map<string, { total: number; completed: number; plots: { id: string; name: string }[] }>()
    days.forEach((d) => {
      const key = d.toISOString().slice(0, 10)
      let total = 0
      let completed = 0
      const plots: { id: string; name: string }[] = []
      filteredCrops.forEach((plot) => {
        const dayNum = daysBetween(plot.plantedDate, d)
        const tasks = getTasksForDay(plot.cropType, dayNum).tasks || []
        if (tasks.length > 0) {
          total += tasks.length
          plots.push({ id: plot.id, name: plot.name })
          const completedList = (taskCompletions?.[plot.id]?.[key]) || []
          completed += completedList.length
        }
      })
      map.set(key, { total, completed, plots })
    })
    return map
  }, [days, filteredCrops, taskCompletions])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const res = await api.get<{ taskCompletions: Record<string, Record<string, string[]>> }>('/api/calendar/task-completions')
        if (active) {
          if (res.data?.taskCompletions) setTaskCompletions(res.data.taskCompletions)
          setBackendOnline(true)
        }
      } catch {
        if (active) setBackendOnline(null)
      }
    })()
    return () => { active = false }
  }, [setTaskCompletions])

  useEffect(() => {
    if (!hasLoadedRef.current || !backendOnline) return
    const t = window.setTimeout(async () => {
      try {
        await api.put('/api/calendar/task-completions', { taskCompletions })
      } catch {
        /* data is persisted in localStorage via zustand persist */
      }
    }, 700)
    return () => window.clearTimeout(t)
  }, [taskCompletions, backendOnline])

  const selectedKey = selectedDate ? selectedDate.toISOString().slice(0, 10) : ''
  const selectedTasks = useMemo(() => {
    if (!selectedDate) return []
    const result: { plotId: string; plotName: string; cropType: string; dayNum: number; tasks: any[]; completed: string[] }[] = []
    filteredCrops.forEach((plot) => {
      const dayNum = daysBetween(plot.plantedDate, selectedDate)
      const taskData = getTasksForDay(plot.cropType, dayNum)
      const tasks = taskData.tasks || []
      if (tasks.length === 0) return
      const completed = (taskCompletions?.[plot.id]?.[selectedKey]) || []
      result.push({ plotId: plot.id, plotName: plot.name, cropType: plot.cropType, dayNum, tasks, completed })
    })
    return result.sort((a, b) => a.plotName.localeCompare(b.plotName))
  }, [selectedDate, filteredCrops, taskCompletions, selectedKey])

  const heatmap = useMemo(() => {
    const cells: { key: string; date: Date; ratio: number; total: number; completed: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = addDays(new Date(), -i)
      const key = date.toISOString().slice(0, 10)
      let total = 0
      let completed = 0
      filteredCrops.forEach((plot) => {
        const dayNum = daysBetween(plot.plantedDate, date)
        const tasks = getTasksForDay(plot.cropType, dayNum).tasks || []
        total += tasks.length
        const done = (taskCompletions?.[plot.id]?.[key] || []).length
        completed += done
      })
      const ratio = total > 0 ? Math.min(1, completed / total) : 0
      cells.push({ key, date, ratio, total, completed })
    }
    return cells
  }, [filteredCrops, taskCompletions])

  const handleDayClick = (d: Date) => {
    setSelectedDate(d)
    setViewDate(d)
  }

  const cropPeriods = useMemo(() => {
    if (viewMode !== 'month') return []
    const monthStart = startOfMonth(viewDate)
    const monthEnd = addDays(startOfWeek(addDays(addMonths(monthStart, 1), 41), { weekStartsOn: 0 }), -1)
    const bars: { plotId: string; plotName: string; cropType: string; startDay: number; endDay: number; stage: string }[] = []
    filteredCrops.forEach((plot) => {
      const planted = new Date(plot.plantedDate)
      const harvest = plot.expectedHarvest ? new Date(plot.expectedHarvest) : new Date(+planted + 120 * 86400000)
      const s = Math.max(0, Math.floor((+planted - +monthStart) / 86400000))
      const e = Math.min(41, Math.floor((+harvest - +monthStart) / 86400000))
      if (s <= 41 && e >= 0) {
        bars.push({ plotId: plot.id, plotName: plot.name, cropType: plot.cropType, startDay: Math.max(0, s), endDay: Math.min(41, e), stage: plot.stage })
      }
    })
    return bars
  }, [viewMode, viewDate, filteredCrops])

  const toggleTask = (plotId: string, dateKey: string, taskId: string, done: boolean) => {
    if (done) unmarkTaskComplete(plotId, dateKey, taskId)
    else markTaskComplete(plotId, dateKey, taskId)
  }

  const todayTasksTotal = useMemo(() => {
    const key = today.toISOString().slice(0, 10)
    let t = 0
    let c = 0
    crops.forEach((plot) => {
      const dayNum = daysBetween(plot.plantedDate, today)
      const tasks = getTasksForDay(plot.cropType, dayNum).tasks || []
      t += tasks.length
      c += (taskCompletions?.[plot.id]?.[key] || []).length
    })
    return { total: t, completed: c }
  }, [crops, taskCompletions])

  const allTaskTypes = useMemo(() => {
    const types = new Set<string>()
    selectedTasks.forEach((s) => s.tasks.forEach((t: any) => { if (t.task) types.add(t.task) }))
    return Array.from(types)
  }, [selectedTasks])

  return (
    <div className="page-container" style={{ paddingBottom: '2rem' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h1 className="page-title text-xl">Farm Calendar</h1>
          <p className="page-subtitle text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {todayTasksTotal.total > 0
              ? `${todayTasksTotal.completed}/${todayTasksTotal.total} tasks done today`
              : 'No tasks scheduled for today'}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {backendOnline === true && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Synced
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border" style={{ borderColor: 'rgba(123, 207, 137, 0.2)' }}>
            {(['month', 'week', 'day'] as ViewMode[]).map((mode) => {
              const active = viewMode === mode
              const icons = { month: <CalendarDays size={15} />, week: <Columns3 size={15} />, day: <List size={15} /> }
              return (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium transition-all capitalize"
                  style={{
                    background: active ? 'rgba(123, 241, 168, 0.12)' : 'transparent',
                    color: active ? '#7bf1a8' : '#95be9f',
                    borderRight: mode !== 'day' ? '1px solid rgba(123, 207, 137, 0.12)' : 'none',
                  }}>
                  {icons[mode]}
                  {mode}
                </button>
              )
            })}
          </div>
          <select
            className="rounded-xl border px-3 py-2 text-xs font-medium"
            style={{ borderColor: 'rgba(123, 207, 137, 0.2)', background: 'rgba(255,255,255,0.03)', color: '#eefdf0' }}
            value={selectedPlotId}
            onChange={(e) => setSelectedPlotId(e.target.value)}
          >
            <option value="all">All plots</option>
            {crops.map((p, i) => (
              <option key={`${p.id}-${i}`} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={handleToday}
            className="px-3.5 py-2 rounded-xl text-xs font-medium border transition-colors hover:border-emerald-400/50"
            style={{ borderColor: 'rgba(123, 207, 137, 0.2)', color: '#eefdf0' }}>
            Today
          </button>
          <div className="flex items-center">
            <button onClick={handlePrev} className="p-2 rounded-l-xl border transition-colors hover:border-emerald-400/50" style={{ borderColor: 'rgba(123, 207, 137, 0.2)' }}>
              <ChevronLeft size={16} style={{ color: '#90b69a' }} />
            </button>
            <div className="px-4 py-2 border-t border-b text-sm font-semibold min-w-[180px] text-center select-none" style={{ borderColor: 'rgba(123, 207, 137, 0.2)', color: '#eefdf0' }}>
              {dateLabel}
            </div>
            <button onClick={handleNext} className="p-2 rounded-r-xl border transition-colors hover:border-emerald-400/50" style={{ borderColor: 'rgba(123, 207, 137, 0.2)' }}>
              <ChevronRight size={16} style={{ color: '#90b69a' }} />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'month' && (
        <>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(123, 207, 137, 0.12)' }}>
            <div className="grid grid-cols-7" style={{ background: 'rgba(255,255,255,0.02)' }}>
              {DAY_HEADERS.map((d) => (
                <div key={d} className="py-2.5 text-[11px] font-bold uppercase tracking-wider text-center" style={{ color: '#7fb58a', borderBottom: '1px solid rgba(123, 207, 137, 0.08)' }}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((d) => {
                const key = d.toISOString().slice(0, 10)
                const summary = daySummaries.get(key) || { total: 0, completed: 0, plots: [] }
                const inMonth = isSameMonth(d, viewDate)
                const isSel = isSameDay(d, selectedDate)
                const isT = isToday(d)
                return (
                  <button key={key} onClick={() => handleDayClick(d)}
                    className="relative min-h-[80px] p-2 text-left transition-all border-b border-r focus:outline-none focus:z-10"
                    style={{
                      borderColor: 'rgba(123, 207, 137, 0.06)',
                      background: isSel ? 'rgba(16, 185, 129, 0.08)' : isT ? 'rgba(123, 241, 168, 0.04)' : 'transparent',
                      opacity: inMonth ? 1 : 0.35,
                    }}>
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${isT ? 'bg-emerald-500 text-white' : ''}`}
                      style={{ color: isT ? 'white' : inMonth ? '#eefdf0' : '#5a7a6a' }}>
                      {d.getDate()}
                    </span>
                    {summary.total > 0 && (
                      <div className="mt-1 space-y-0.5">
                        <div className="flex items-center gap-1">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(123, 207, 137, 0.12)' }}>
                            <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, (summary.completed / Math.max(1, summary.total)) * 100)}%`, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
                          </div>
                        </div>
                        <div className="text-[10px] font-medium" style={{ color: '#95be9f' }}>
                          {summary.completed}/{summary.total}
                        </div>
                      </div>
                    )}
                    {cropPeriods.filter((p) => d.getDate() >= p.startDay + 1 && d.getDate() <= p.endDay + 1 && isSameMonth(d, viewDate)).length > 0 && (
                      <div className="absolute bottom-1 left-1 right-1 flex gap-0.5">
                        {cropPeriods.filter((p) => d.getDate() >= p.startDay + 1 && d.getDate() <= p.endDay + 1 && isSameMonth(d, viewDate)).slice(0, 3).map((p) => (
                          <div key={p.plotId} className="flex-1 h-1 rounded-full" style={{ background: p.stage === 'harvest' ? '#F59E0B' : '#10B981' }} />
                        ))}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {cropPeriods.length > 0 && (
            <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'rgba(123, 207, 137, 0.12)' }}>
              <div className="text-xs font-semibold mb-3" style={{ color: '#7fb58a' }}>CROP PERIODS THIS MONTH</div>
              <div className="space-y-2">
                {cropPeriods.map((p) => (
                  <div key={p.plotId} className="flex items-center gap-3">
                    <div className="text-xs font-medium min-w-[100px] truncate" style={{ color: '#eefdf0' }}>{p.plotName}</div>
                    <div className="flex-1 h-5 rounded-lg overflow-hidden relative" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="h-full rounded-lg transition-all" style={{ marginLeft: `${(p.startDay / 42) * 100}%`, width: `${((p.endDay - p.startDay + 1) / 42) * 100}%`, background: p.stage === 'harvest' ? 'linear-gradient(90deg, #F59E0B, #D97706)' : 'linear-gradient(90deg, #10B981, #059669)' }} />
                    </div>
                    <div className="text-[10px] font-medium capitalize" style={{ color: '#95be9f' }}>{p.stage}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {viewMode === 'week' && (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'rgba(123, 207, 137, 0.12)' }}>
          <div className="grid grid-cols-7">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="py-2.5 text-[11px] font-bold uppercase tracking-wider text-center" style={{ color: '#7fb58a', borderBottom: '1px solid rgba(123, 207, 137, 0.08)' }}>
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7" style={{ minHeight: '400px' }}>
            {days.map((d) => {
              const key = d.toISOString().slice(0, 10)
              const summary = daySummaries.get(key) || { total: 0, completed: 0, plots: [] }
              const isT = isToday(d)
              const isSel = isSameDay(d, selectedDate)
              return (
                <button key={key} onClick={() => handleDayClick(d)}
                  className="flex flex-col p-2 border-r border-b text-left transition-all focus:outline-none"
                  style={{
                    borderColor: 'rgba(123, 207, 137, 0.06)',
                    background: isSel ? 'rgba(16, 185, 129, 0.08)' : isT ? 'rgba(123, 241, 168, 0.04)' : 'transparent',
                  }}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${isT ? 'bg-emerald-500 text-white' : ''}`}
                      style={{ color: isT ? 'white' : '#eefdf0' }}>
                      {d.getDate()}
                    </span>
                    {summary.total > 0 && (
                      <span className="text-[10px] font-medium" style={{ color: '#95be9f' }}>
                        {summary.completed}/{summary.total}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 space-y-1 overflow-hidden">
                    {filteredCrops.map((plot) => {
                      const dayNum = daysBetween(plot.plantedDate, d)
                      const tasks = getTasksForDay(plot.cropType, dayNum).tasks || []
                      if (tasks.length === 0) return null
                      return (
                        <div key={plot.id} className="rounded-lg px-2 py-1" style={{ background: 'rgba(16, 185, 129, 0.06)' }}>
                          <div className="text-[10px] font-medium truncate" style={{ color: '#7fb58a' }}>{plot.name}</div>
                          <div className="text-[10px]" style={{ color: '#95be9f' }}>{tasks.length} task{tasks.length > 1 ? 's' : ''}</div>
                        </div>
                      )
                    })}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {viewMode === 'day' && (
        <div className="rounded-2xl border" style={{ borderColor: 'rgba(123, 207, 137, 0.12)' }}>
          {filteredCrops.map((plot) => {
            const dayNum = daysBetween(plot.plantedDate, viewDate)
            const taskData = getTasksForDay(plot.cropType, dayNum)
            const tasks = taskData.tasks || []
            if (tasks.length === 0) return null
            const key = viewDate.toISOString().slice(0, 10)
            const completedList = (taskCompletions?.[plot.id]?.[key]) || []
            const stageName = taskData.stage?.name || plot.stage
            const plantProgress = Math.min(100, Math.round((dayNum / 120) * 100))
            return (
              <div key={plot.id} className="p-4 border-b last:border-b-0" style={{ borderColor: 'rgba(123, 207, 137, 0.06)' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
                      <TreePine size={16} style={{ color: '#10B981' }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold" style={{ color: '#eefdf0' }}>{plot.name}</div>
                      <div className="text-[11px]" style={{ color: '#95be9f' }}>
                        {plot.cropType} · Day {dayNum} · Stage: <span className="capitalize font-medium" style={{ color: '#7bf1a8' }}>{stageName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[11px]">
                    <span style={{ color: '#95be9f' }}>Progress</span>
                    <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <div className="h-full rounded-full" style={{ width: `${plantProgress}%`, background: 'linear-gradient(90deg, #10B981, #34D399)' }} />
                    </div>
                    <span style={{ color: '#95be9f' }}>{plantProgress}%</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {tasks.map((t: any, idx: number) => {
                    const tid = `${plot.id}::${key}::${idx}`
                    const done = completedList.includes(tid)
                    return (
                      <div key={tid}
                        className="flex items-center gap-3 px-3 py-2 rounded-xl transition-colors cursor-pointer hover:bg-white/5"
                        onClick={() => toggleTask(plot.id, key, tid, done)}>
                        <div className={`shrink-0 transition-all ${done ? 'opacity-100' : 'opacity-40'}`}>
                          {done ? <CheckCircle2 size={18} style={{ color: '#10B981' }} /> : <Circle size={18} style={{ color: '#95be9f' }} />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm transition-all ${done ? 'line-through opacity-50' : ''}`} style={{ color: '#eefdf0' }}>{t.task}</div>
                          <div className="flex items-center gap-2 text-[11px]" style={{ color: '#95be9f' }}>
                            <span>{t.time || 'Anytime'}</span>
                            {t.frequency && <span>· {t.frequency}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: `${taskTypeColor(t.task)}15`, color: taskTypeColor(t.task) }}>
                            {t.type || 'task'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
          {selectedTasks.length === 0 && (
            <div className="p-8 text-center">
              <CalendarCheck size={36} className="mx-auto mb-3" style={{ color: '#5a7a6a', opacity: 0.5 }} />
              <div className="text-sm font-medium" style={{ color: '#95be9f' }}>No tasks scheduled for this day</div>
              <div className="text-xs mt-1" style={{ color: '#5a7a6a' }}>Try selecting a different date or plot</div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {viewMode !== 'day' && (
        <div className="lg:col-span-2 rounded-2xl border p-4" style={{ borderColor: 'rgba(123, 207, 137, 0.12)' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: '#eefdf0' }}>
              {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select a date'} Tasks
            </h3>
            <div className="flex items-center gap-2">
              {selectedTasks.length > 0 && (
                <span className="text-[11px] font-medium" style={{ color: '#95be9f' }}>
                  {selectedTasks.reduce((a, s) => a + s.completed.length, 0)}/{selectedTasks.reduce((a, s) => a + s.tasks.length, 0)} done
                </span>
              )}
              <button onClick={() => { if (selectedDate) { const yesterday = addDays(selectedDate, -1); setSelectedDate(yesterday); setViewDate(yesterday) } }}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <ChevronLeft size={14} style={{ color: '#95be9f' }} />
              </button>
              <button onClick={() => { if (selectedDate) { const tomorrow = addDays(selectedDate, 1); setSelectedDate(tomorrow); setViewDate(tomorrow) } }}
                className="p-1.5 rounded-lg hover:bg-white/5 transition-colors">
                <ChevronRight size={14} style={{ color: '#95be9f' }} />
              </button>
            </div>
          </div>
          {selectedTasks.length > 0 ? (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {selectedTasks.map((s) => (
                <div key={s.plotId} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium" style={{ color: '#eefdf0' }}>{s.plotName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full capitalize" style={{ background: 'rgba(123, 241, 168, 0.08)', color: '#7bf1a8' }}>{s.cropType}</span>
                    </div>
                    <span className="text-[11px]" style={{ color: '#95be9f' }}>Day {s.dayNum}</span>
                  </div>
                  <div className="space-y-1">
                    {s.tasks.map((t: any, idx: number) => {
                      const tid = `${s.plotId}::${selectedKey}::${idx}`
                      const done = s.completed.includes(tid)
                      return (
                        <div key={tid}
                          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer hover:bg-white/5"
                          onClick={() => toggleTask(s.plotId, selectedKey, tid, done)}>
                          <button onClick={(e) => { e.stopPropagation(); toggleTask(s.plotId, selectedKey, tid, done) }}
                            className="shrink-0">
                            {done ? <CheckCircle2 size={16} style={{ color: '#10B981' }} /> : <Circle size={16} style={{ color: '#5a7a6a' }} />}
                          </button>
                          <span className={`text-xs flex-1 ${done ? 'line-through opacity-40' : ''}`} style={{ color: '#eefdf0' }}>{t.task}</span>
                          <span className="text-[10px]" style={{ color: '#95be9f' }}>{t.time || 'Any'}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CalendarCheck size={32} className="mx-auto mb-2" style={{ color: '#5a7a6a', opacity: 0.4 }} />
              <div className="text-sm" style={{ color: '#95be9f' }}>No tasks for this date</div>
            </div>
          )}
        </div>
        )}
        {viewMode === 'day' && <div className="lg:col-span-2" />}

        <div className="rounded-2xl border p-4" style={{ borderColor: 'rgba(123, 207, 137, 0.12)' }}>
          <h4 className="text-sm font-semibold mb-3" style={{ color: '#eefdf0' }}>30-Day Completion</h4>
          <div className="grid grid-cols-10 gap-1.5 mb-3">
            {heatmap.map((cell) => (
              <div key={cell.key} title={`${format(cell.date, 'dd MMM')}: ${cell.completed}/${cell.total}`}
                className="h-3.5 rounded-sm transition-all hover:scale-125"
                style={{ background: cell.total === 0 ? 'rgba(255,255,255,0.04)' : cell.ratio >= 1 ? '#10B981' : cell.ratio >= 0.5 ? '#34D399' : cell.ratio > 0 ? '#6EE7B7' : 'rgba(239, 68, 68, 0.3)' }} />
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10px] mb-4" style={{ color: '#5a7a6a' }}>
            <span>Low</span>
            <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: 'rgba(255,255,255,0.04)' }} />
            <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: 'rgba(239, 68, 68, 0.3)' }} />
            <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: '#6EE7B7' }} />
            <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: '#34D399' }} />
            <span className="inline-block h-2.5 w-2.5 rounded" style={{ background: '#10B981' }} />
            <span>High</span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs" style={{ color: '#95be9f' }}>
              <span>Plots in view</span>
              <span className="font-semibold" style={{ color: '#eefdf0' }}>{filteredCrops.length}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: '#95be9f' }}>
              <span>Total tasks today</span>
              <span className="font-semibold" style={{ color: '#eefdf0' }}>{todayTasksTotal.total}</span>
            </div>
            <div className="flex justify-between text-xs" style={{ color: '#95be9f' }}>
              <span>Completed today</span>
              <span className="font-semibold" style={{ color: '#10B981' }}>{todayTasksTotal.completed}</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t" style={{ borderColor: 'rgba(123, 207, 137, 0.08)' }}>
            <div className="text-[10px] font-semibold mb-2" style={{ color: '#5a7a6a' }}>KEYBOARD SHORTCUTS</div>
            <div className="space-y-1 text-[10px]" style={{ color: '#5a7a6a' }}>
              <div className="flex justify-between"><span>Prev/Next</span><kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.04)' }}>← →</kbd></div>
              <div className="flex justify-between"><span>Today</span><kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.04)' }}>T</kbd></div>
              <div className="flex justify-between"><span>Toggle view</span><kbd className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: 'rgba(255,255,255,0.04)' }}>M W D</kbd></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
