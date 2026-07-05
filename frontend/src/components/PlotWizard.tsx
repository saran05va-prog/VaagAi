import { useState, useCallback, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, Check, Sprout, Leaf, FileText, Loader2, CalendarDays, RefreshCw, CheckCircle, Edit3 } from 'lucide-react'
import { CROP_TYPES, useFarmStore } from '../components/farm3d/farmStore'
import { useCropDoctorStore } from '../stores/cropDoctorStore'
import { CROPS } from '../lib/cropDatabase'

export type SoilType = 'clay' | 'loam' | 'sandy' | 'silty' | 'peaty' | 'chalky'
export type IrrigationType = 'drip' | 'sprinkler' | 'flood' | 'furrow' | 'none'
export type SeasonType = 'kharif' | 'rabi' | 'zaid' | 'year-round'
export type FarmingMethod = 'organic' | 'conventional'

export interface WizardPlot {
  name: string
  area: number
  length: number
  width: number
  soilType: SoilType
  irrigation: IrrigationType
  location: string
}

export interface WizardCrop {
  cropType: string
  variety: string
  plantingDate: string
  expectedHarvest: string
  season: SeasonType
  previousCrop: string
  farmingMethod: FarmingMethod
}

export interface ScheduleTask {
  month: number
  monthLabel: string
  tasks: string[]
}

export interface WizardState {
  plot: WizardPlot
  crop: WizardCrop
  schedule: ScheduleTask[] | null
  accepted: boolean
}

const defaultPlot: WizardPlot = {
  name: '',
  area: 1,
  length: 10,
  width: 10,
  soilType: 'loam',
  irrigation: 'drip',
  location: '',
}

const defaultCrop: WizardCrop = {
  cropType: 'rice',
  variety: '',
  plantingDate: new Date().toISOString().slice(0, 10),
  expectedHarvest: '',
  season: 'kharif',
  previousCrop: '',
  farmingMethod: 'organic',
}

const SOIL_TYPES: { value: SoilType; label: string }[] = [
  { value: 'clay', label: 'Clay' },
  { value: 'loam', label: 'Loam' },
  { value: 'sandy', label: 'Sandy' },
  { value: 'silt', label: 'Silt' },
  { value: 'peaty', label: 'Peaty' },
  { value: 'chalky', label: 'Chalky' },
]

const IRRIGATION_TYPES: { value: IrrigationType; label: string }[] = [
  { value: 'drip', label: 'Drip Irrigation' },
  { value: 'sprinkler', label: 'Sprinkler' },
  { value: 'flood', label: 'Flood' },
  { value: 'furrow', label: 'Furrow' },
  { value: 'none', label: 'Rainfed' },
]

const SEASONS: { value: SeasonType; label: string }[] = [
  { value: 'kharif', label: 'Kharif (Monsoon)' },
  { value: 'rabi', label: 'Rabi (Winter)' },
  { value: 'zaid', label: 'Zaid (Summer)' },
  { value: 'year-round', label: 'Year Round' },
]

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function getSeason(month: number): SeasonType {
  if ([5, 6, 7, 8].includes(month)) return 'kharif'
  if ([9, 10, 11].includes(month)) return 'rabi'
  if ([2, 3, 4].includes(month)) return 'zaid'
  return 'year-round'
}

function syncHarvestDate(cropType: string, plantedDate: string): string {
  const crop = CROP_TYPES[cropType] || CROP_TYPES.rice
  const harvest = new Date(plantedDate)
  harvest.setDate(harvest.getDate() + crop.daysToHarvest)
  return harvest.toISOString().slice(0, 10)
}

function generateSchedule(cropType: string, plantingDate: string): ScheduleTask[] {
  const cropData = CROPS[cropType]
  if (!cropData) return []

  const plant = new Date(plantingDate)
  const totalDays = cropData.totalDays
  const monthCount = Math.max(1, Math.ceil(totalDays / 30))
  const months: ScheduleTask[] = []

  for (let m = 0; m < monthCount; m++) {
    const monthStart = m * 30 + 1
    const monthEnd = Math.min((m + 1) * 30, totalDays)
    const monthDate = new Date(plant)
    monthDate.setDate(monthDate.getDate() + m * 30)
    const monthLabel = `${MONTH_NAMES[monthDate.getMonth()]} ${monthDate.getFullYear()}`

    const tasks: string[] = []

    for (const stage of cropData.stages) {
      if (stage.startDay <= monthEnd && stage.endDay >= monthStart) {
        tasks.push(`${stage.name} (Day ${Math.max(stage.startDay, monthStart)}\u2013${Math.min(stage.endDay, monthEnd)})`)
        if (stage.tasks?.daily?.length) {
          stage.tasks.daily.slice(0, 2).forEach((t: any) => {
            tasks.push(t.task)
          })
        }
        if (stage.tasks?.weekly?.length) {
          stage.tasks.weekly.slice(0, 1).forEach((t: any) => {
            tasks.push(t.task)
          })
        }
      }
    }

    months.push({
      month: monthDate.getMonth(),
      monthLabel,
      tasks,
    })
  }

  return months
}

interface PlotDetailsStepProps {
  plot: WizardPlot
  onChange: (plot: WizardPlot) => void
  errors: Partial<Record<keyof WizardPlot, string>>
}

function PlotDetailsStep({ plot, onChange, errors }: PlotDetailsStepProps) {
  const update = <K extends keyof WizardPlot>(key: K, value: WizardPlot[K]) => {
    onChange({ ...plot, [key]: value })
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center rounded-xl w-10 h-10" style={{ background: 'rgba(123,241,168,0.15)' }}>
          <Sprout size={20} style={{ color: '#7bf1a8' }} />
        </div>
        <div>
          <p className="font-semibold text-sm">Plot Details</p>
          <p className="text-xs text-muted-foreground">Describe your farm plot</p>
        </div>
      </div>

      <div>
        <label className="label">Plot Name *</label>
        <input
          className={`input ${errors.name ? 'border-red-500' : ''}`}
          value={plot.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="e.g., North Field"
        />
        {errors.name && <p className="text-xs text-red-400 mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="label">Area (acres) *</label>
          <input className="input" type="number" value={plot.area} onChange={(e) => update('area', Number(e.target.value))} min="0.1" step="0.1" />
        </div>
        <div>
          <label className="label">Length (ft) *</label>
          <input className="input" type="number" value={plot.length} onChange={(e) => update('length', Number(e.target.value))} min="1" step="1" />
        </div>
        <div>
          <label className="label">Width (ft) *</label>
          <input className="input" type="number" value={plot.width} onChange={(e) => update('width', Number(e.target.value))} min="1" step="1" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Soil Type *</label>
          <select className="input select" value={plot.soilType} onChange={(e) => update('soilType', e.target.value as SoilType)}>
            {SOIL_TYPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Irrigation *</label>
          <select className="input select" value={plot.irrigation} onChange={(e) => update('irrigation', e.target.value as IrrigationType)}>
            {IRRIGATION_TYPES.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Location</label>
        <input
          className="input"
          value={plot.location}
          onChange={(e) => update('location', e.target.value)}
          placeholder="e.g., Coimbatore, Tamil Nadu"
        />
      </div>
    </div>
  )
}

interface CropDetailsStepProps {
  crop: WizardCrop
  onChange: (crop: WizardCrop) => void
  errors: Partial<Record<keyof WizardCrop, string>>
}

function CropDetailsStep({ crop, onChange, errors }: CropDetailsStepProps) {
  const update = <K extends keyof WizardCrop>(key: K, value: WizardCrop[K]) => {
    if (key === 'cropType') {
      const newCrop = { ...crop, cropType: value, expectedHarvest: syncHarvestDate(value as string, crop.plantingDate) }
      if (!crop.season || crop.season === getSeason(new Date().getMonth())) {
        newCrop.season = getSeason(new Date(newCrop.plantingDate).getMonth())
      }
      onChange(newCrop)
    } else {
      onChange({ ...crop, [key]: value })
    }
  }

  const cropOptions = Object.entries(CROP_TYPES)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center rounded-xl w-10 h-10" style={{ background: 'rgba(16,185,129,0.15)' }}>
          <Leaf size={20} style={{ color: '#10b981' }} />
        </div>
        <div>
          <p className="font-semibold text-sm">Crop Details</p>
          <p className="text-xs text-muted-foreground">Choose what to grow</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Crop Type *</label>
          <select className="input select capitalize" value={crop.cropType} onChange={(e) => update('cropType', e.target.value)}>
            {cropOptions.map(([key, val]) => <option key={key} value={key}>{val.icon} {val.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Variety</label>
          <input
            className="input"
            value={crop.variety}
            onChange={(e) => update('variety', e.target.value)}
            placeholder="e.g., Basmati 370"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Planting Date *</label>
          <input
            className={`input ${errors.plantingDate ? 'border-red-500' : ''}`}
            type="date"
            value={crop.plantingDate}
            onChange={(e) => {
              const plantingDate = e.target.value
              onChange({ ...crop, plantingDate, expectedHarvest: syncHarvestDate(crop.cropType, plantingDate) })
            }}
          />
          {errors.plantingDate && <p className="text-xs text-red-400 mt-1">{errors.plantingDate}</p>}
        </div>
        <div>
          <label className="label">Expected Harvest</label>
          <input
            className="input"
            type="date"
            value={crop.expectedHarvest}
            onChange={(e) => update('expectedHarvest', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Season</label>
          <select className="input select" value={crop.season} onChange={(e) => update('season', e.target.value as SeasonType)}>
            {SEASONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Previous Crop</label>
          <select className="input select capitalize" value={crop.previousCrop} onChange={(e) => update('previousCrop', e.target.value)}>
            <option value="">None (New plot)</option>
            {cropOptions.map(([key, value]) => <option key={key} value={key}>{value.icon} {value.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Farming Method</label>
        <div className="flex gap-3">
          {(['organic', 'conventional'] as FarmingMethod[]).map((method) => (
            <button
              key={method}
              type="button"
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                crop.farmingMethod === method
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-[var(--color-border)] text-muted-foreground'
              }`}
              onClick={() => update('farmingMethod', method)}
            >
              {method === 'organic' ? 'Organic' : 'Conventional'}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function SchedulePreview({
  schedule,
  onRegenerate,
  onAccept,
  onEdit,
  generating,
  accepted,
}: {
  schedule: ScheduleTask[]
  onRegenerate: () => void
  onAccept: () => void
  onEdit: () => void
  generating: boolean
  accepted: boolean
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <div className="flex items-center justify-center rounded-xl w-10 h-10" style={{ background: 'rgba(59,130,246,0.15)' }}>
          <CalendarDays size={20} style={{ color: '#3b82f6' }} />
        </div>
        <div>
          <p className="font-semibold text-sm">Generated Schedule</p>
          <p className="text-xs text-muted-foreground">AI-powered monthly plan for your crop</p>
        </div>
      </div>

      <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
        {schedule.map((month) => (
          <div
            key={month.monthLabel}
            className="rounded-2xl border p-4"
            style={{ borderColor: 'rgba(123,207,137,0.15)', background: 'rgba(255,255,255,0.02)' }}
          >
            <p className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CalendarDays size={14} style={{ color: '#7bf1a8' }} />
              {month.monthLabel}
            </p>
            <ul className="space-y-1">
              {month.tasks.map((task, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span style={{ color: '#7bf1a8' }}>{'>'}</span>
                  <span>{task}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!accepted ? (
        <div className="flex gap-2 pt-2">
          <button className="btn btn-primary flex-1 text-sm" onClick={onAccept}>
            <CheckCircle size={16} />
            Accept Schedule
          </button>
          <button className="btn btn-secondary text-sm" onClick={onRegenerate} disabled={generating}>
            {generating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Regenerate
          </button>
          <button className="btn btn-ghost text-sm" onClick={onEdit}>
            <Edit3 size={16} />
            Edit
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)' }}>
          <p className="text-sm font-semibold flex items-center justify-center gap-2" style={{ color: '#10b981' }}>
            <CheckCircle size={18} />
            Schedule Accepted
          </p>
        </div>
      )}
    </div>
  )
}

function ReviewStep({ plot, crop }: { plot: WizardPlot; crop: WizardCrop }) {
  const cropInfo = CROP_TYPES[crop.cropType]
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center rounded-xl w-10 h-10" style={{ background: 'rgba(245,158,11,0.15)' }}>
          <FileText size={20} style={{ color: '#f59e0b' }} />
        </div>
        <div>
          <p className="font-semibold text-sm">Review</p>
          <p className="text-xs text-muted-foreground">Confirm plot and crop details</p>
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Sprout size={16} style={{ color: '#7bf1a8' }} /> Plot</p>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <span className="text-muted-foreground">Name</span>
          <span className="font-medium">{plot.name || '—'}</span>
          <span className="text-muted-foreground">Area</span>
          <span className="font-medium">{plot.area} acres</span>
          <span className="text-muted-foreground">Dimensions</span>
          <span className="font-medium">{plot.length} x {plot.width} ft</span>
          <span className="text-muted-foreground">Soil</span>
          <span className="font-medium capitalize">{plot.soilType}</span>
          <span className="text-muted-foreground">Irrigation</span>
          <span className="font-medium capitalize">{plot.irrigation === 'none' ? 'Rainfed' : plot.irrigation}</span>
          {plot.location && <>
            <span className="text-muted-foreground">Location</span>
            <span className="font-medium">{plot.location}</span>
          </>}
        </div>
      </div>

      <div className="rounded-2xl border p-5" style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)' }}>
        <p className="text-sm font-semibold mb-3 flex items-center gap-2"><Leaf size={16} style={{ color: '#10b981' }} /> Crop</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-foreground">Crop</span>
          <span className="font-medium">{cropInfo?.icon} {cropInfo?.name || crop.cropType}</span>
          {crop.variety && <>
            <span className="text-muted-foreground">Variety</span>
            <span className="font-medium">{crop.variety}</span>
          </>}
          <span className="text-muted-foreground">Planting Date</span>
          <span className="font-medium">{new Date(crop.plantingDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="text-muted-foreground">Harvest</span>
          <span className="font-medium">{new Date(crop.expectedHarvest).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          <span className="text-muted-foreground">Season</span>
          <span className="font-medium capitalize">{crop.season}</span>
          {crop.previousCrop && <>
            <span className="text-muted-foreground">Previous</span>
            <span className="font-medium capitalize">{crop.previousCrop}</span>
          </>}
          <span className="text-muted-foreground">Method</span>
          <span className="font-medium">{crop.farmingMethod === 'organic' ? 'Organic' : 'Conventional'}</span>
        </div>
      </div>
    </div>
  )
}

interface PlotWizardProps {
  onClose: () => void
}

export default function PlotWizard({ onClose }: PlotWizardProps) {
  const [step, setStep] = useState(0)
  const [wizardState, setWizardState] = useState<WizardState>({
    plot: { ...defaultPlot },
    crop: { ...defaultCrop },
    schedule: null,
    accepted: false,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generating, setGenerating] = useState(false)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [acceptError, setAcceptError] = useState<string | null>(null)

  const crops = useFarmStore((s) => s.crops)
  const addCrop = useFarmStore((s) => s.addCrop)
  const addTask = useCropDoctorStore((s) => s.addTask)

  const steps = useMemo(() => [
    { label: 'Plot Details', icon: Sprout },
    { label: 'Crop Details', icon: Leaf },
    { label: 'Review', icon: FileText },
  ], [])

  const validateStep = useCallback((s: number): boolean => {
    const newErrors: Record<string, string> = {}
    if (s === 0) {
      if (!wizardState.plot.name.trim()) newErrors.name = 'Plot name is required'
      if (wizardState.plot.area <= 0) newErrors.area = 'Area must be greater than 0'
      if (wizardState.plot.length <= 0) newErrors.length = 'Length must be greater than 0'
      if (wizardState.plot.width <= 0) newErrors.width = 'Width must be greater than 0'
    }
    if (s === 1) {
      const d = new Date(wizardState.crop.plantingDate)
      if (isNaN(d.getTime())) newErrors.plantingDate = 'Invalid planting date'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [wizardState])

  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      setStep((prev) => Math.min(prev + 1, steps.length - 1))
    }
  }, [step, validateStep, steps.length])

  const handleBack = useCallback(() => {
    if (step === 3) {
      setStep(2)
      return
    }
    setStep((prev) => Math.max(prev - 1, 0))
  }, [step])

  const handlePlotChange = useCallback((plot: WizardPlot) => {
    setWizardState((prev) => ({ ...prev, plot }))
    if (errors.name || errors.area || errors.length || errors.width) {
      setErrors({})
    }
  }, [errors])

  const handleCropChange = useCallback((crop: WizardCrop) => {
    setWizardState((prev) => ({ ...prev, crop }))
    if (errors.plantingDate) {
      setErrors({})
    }
  }, [errors])

  const handleGenerateSchedule = useCallback(() => {
    setGenerating(true)
    setGenerationError(null)
    setTimeout(() => {
      try {
        const cropData = CROPS[wizardState.crop.cropType]
        if (!cropData) {
          setGenerationError('Crop database entry not found for ' + wizardState.crop.cropType)
          setGenerating(false)
          return
        }
        const schedule = generateSchedule(wizardState.crop.cropType, wizardState.crop.plantingDate)
        if (!schedule || schedule.length === 0) {
          setGenerationError('Could not generate schedule for this crop and date combination')
          setGenerating(false)
          return
        }
        setWizardState((prev) => ({ ...prev, schedule }))
        setStep(3)
      } catch {
        setGenerationError('Failed to generate schedule. Please try again.')
      }
      setGenerating(false)
    }, 600)
  }, [wizardState.crop.cropType, wizardState.crop.plantingDate])

  const handleRegenerate = useCallback(() => {
    setWizardState((prev) => ({ ...prev, accepted: false, schedule: null }))
    handleGenerateSchedule()
  }, [handleGenerateSchedule])

  const handleAccept = useCallback(() => {
    setAcceptError(null)
    const { plot, crop, schedule } = wizardState
    if (!schedule) return

    const duplicateName = crops.some((c) => c.name.toLowerCase() === plot.name.trim().toLowerCase())
    if (duplicateName) {
      setAcceptError('A plot with this name already exists. Choose a different name.')
      return
    }

    const cropInfo = CROP_TYPES[crop.cropType] || CROP_TYPES.rice
    const createdId = `plot_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    try {
      addCrop({
        id: createdId,
        name: plot.name.trim(),
        cropType: crop.cropType,
        x: 0,
        z: 0,
        width: plot.width / 3.28,
        depth: plot.length / 3.28,
        stage: 'seedling',
        health: 90,
        plantedDate: crop.plantingDate,
        expectedHarvest: crop.expectedHarvest,
        irrigationEnabled: crop.irrigation !== 'none',
        yieldEstimate: Math.round(plot.area * cropInfo.daysToHarvest * 0.5),
      })

      const now = new Date().toISOString()
      const plant = new Date(crop.plantingDate)
      schedule.forEach((month) => {
        const monthDate = new Date(plant)
        month.tasks.forEach((taskTitle, i) => {
          const due = new Date(monthDate)
          due.setDate(due.getDate() + i * 3)
          addTask({
            id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            plotId: createdId,
            reportId: null,
            title: taskTitle,
            description: '',
            type: 'custom',
            priority: 'medium',
            dueDate: due.toISOString().split('T')[0],
            status: 'pending',
            createdAt: now,
          })
        })
        monthDate.setMonth(monthDate.getMonth() + 1)
      })

      setWizardState((prev) => ({ ...prev, accepted: true }))
      setStep(4)
    } catch {
      setAcceptError('Failed to save plot. Please try again.')
    }
  }, [wizardState, addCrop, addTask, crops])

  const handleEdit = useCallback(() => {
    setWizardState((prev) => ({ ...prev, schedule: null, accepted: false }))
    setStep(0)
  }, [])

  const handleFinish = useCallback(() => {
    onClose()
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div
        className="w-full max-w-2xl rounded-3xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        style={{
          background: 'linear-gradient(180deg, #0d1810 0%, #112015 100%)',
          borderColor: 'rgba(123, 207, 137, 0.2)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(123,207,137,0.08)',
          maxHeight: '90vh',
        }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid rgba(123,207,137,0.1)' }}>
          <div>
            <p className="font-semibold text-sm">Create New Plot</p>
            <p className="text-xs text-muted-foreground">Step {Math.min(step + 1, 4)} of 4</p>
          </div>
          <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {step < 3 && (
          <div className="flex items-center px-6 py-4 gap-2" style={{ borderBottom: '1px solid rgba(123,207,137,0.06)' }}>
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2 flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                    (wizardState.schedule && i < 3) ? 'bg-primary/20 text-primary' : i === step ? 'bg-primary text-white' : 'bg-[rgba(255,255,255,0.05)] text-muted-foreground'
                  }`}
                >
                  {(wizardState.schedule && i < 3) ? <Check size={14} /> : <s.icon size={14} />}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 h-px rounded-full transition-all"
                    style={{ background: (wizardState.schedule && i < 3) ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.06)' }}
                  />
                )}
              </div>
            ))}
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                  wizardState.schedule ? (wizardState.accepted ? 'bg-primary/20 text-primary' : 'bg-primary text-white') : 'bg-[rgba(255,255,255,0.05)] text-muted-foreground'
                }`}
              >
                {wizardState.accepted ? <Check size={14} /> : <CalendarDays size={14} />}
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          {generationError && (
            <div className="mb-4 rounded-xl p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              <span>⚠️</span>
              <span>{generationError}</span>
            </div>
          )}
          {acceptError && (
            <div className="mb-4 rounded-xl p-3 text-sm flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
              <span>⚠️</span>
              <span>{acceptError}</span>
            </div>
          )}
          {step === 0 && (
            <PlotDetailsStep
              plot={wizardState.plot}
              onChange={handlePlotChange}
              errors={errors as Partial<Record<keyof WizardPlot, string>>}
            />
          )}
          {step === 1 && (
            <CropDetailsStep
              crop={wizardState.crop}
              onChange={handleCropChange}
              errors={errors as Partial<Record<keyof WizardCrop, string>>}
            />
          )}
          {step === 2 && !wizardState.schedule && (
            <ReviewStep plot={wizardState.plot} crop={wizardState.crop} />
          )}
          {step === 3 && wizardState.schedule && (
            <SchedulePreview
              schedule={wizardState.schedule}
              onRegenerate={handleRegenerate}
              onAccept={handleAccept}
              onEdit={handleEdit}
              generating={generating}
              accepted={wizardState.accepted}
            />
          )}
          {step === 4 && wizardState.accepted && (
            <div className="space-y-5 text-center">
              <div className="flex items-center justify-center w-16 h-16 rounded-full mx-auto" style={{ background: 'rgba(16,185,129,0.15)' }}>
                <CheckCircle size={32} style={{ color: '#10b981' }} />
              </div>
              <div>
                <p className="text-lg font-semibold">Plot Created Successfully</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {wizardState.plot.name} has been added to your farm with {wizardState.schedule?.length || 0} months of scheduled tasks.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: '1px solid rgba(123,207,137,0.1)' }}>
          <button
            className={`btn btn-ghost text-sm ${step === 0 ? 'invisible' : ''}`}
            onClick={handleBack}
            disabled={step === 0}
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex gap-2">
            {step === 0 && (
              <button className="btn btn-primary text-sm" onClick={handleNext}>
                Next <ChevronRight size={16} />
              </button>
            )}
            {step === 1 && (
              <button className="btn btn-primary text-sm" onClick={handleNext}>
                Next <ChevronRight size={16} />
              </button>
            )}
            {step === 2 && !wizardState.schedule && (
              <button
                className="btn btn-primary text-sm"
                onClick={handleGenerateSchedule}
                disabled={generating}
              >
                {generating ? <Loader2 size={16} className="animate-spin" /> : null}
                {generating ? 'Generating...' : 'Generate AI Schedule'}
              </button>
            )}
            {step === 4 && wizardState.accepted && (
              <button className="btn btn-primary text-sm" onClick={handleFinish}>
                Finish
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
