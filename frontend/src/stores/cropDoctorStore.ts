import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type Severity = 'low' | 'medium' | 'high'

export interface TreatmentStep {
  title: string
  description: string
  day: number
}

export interface DiseaseReport {
  id: string
  plotId: string
  plotName: string
  cropType: string
  plantName: string
  scientificName: string
  diseaseName: string
  severity: Severity
  confidence: number
  photos: string[]
  symptoms: string[]
  growthStage: string
  description: string
  causes: string[]
  organicTreatment: string[]
  chemicalTreatment: string[]
  treatmentSteps: TreatmentStep[]
  prevention: string[]
  recoveryTimeline: string
  spreadRisk: Severity
  treatmentStatus: 'pending' | 'in-progress' | 'completed'
  notes: string[]
  diagnosedAt: string
  updatedAt: string
}

export type TaskType = 'treatment' | 'inspection' | 'watering' | 'fertilizing' | 'harvest' | 'custom'
export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'pending' | 'completed'

export interface FarmTask {
  id: string
  plotId: string
  reportId: string | null
  title: string
  description: string
  type: TaskType
  priority: TaskPriority
  dueDate: string
  status: TaskStatus
  createdAt: string
}

export interface ReportStats {
  total: number
  thisMonth: number
  mostCommonDisease: string
  mostAffectedPlot: string
  healthiestPlot: string
  activeTreatments: number
}

interface CropDoctorState {
  reports: DiseaseReport[]
  tasks: FarmTask[]
  addReport: (report: DiseaseReport) => void
  updateReport: (id: string, data: Partial<DiseaseReport>) => void
  removeReport: (id: string) => void
  addTask: (task: FarmTask) => void
  updateTask: (id: string, data: Partial<FarmTask>) => void
  removeTask: (id: string) => void
  toggleTaskStatus: (id: string) => void
  getReportsByPlot: (plotId: string) => DiseaseReport[]
  getTasksByPlot: (plotId: string) => FarmTask[]
  getTasksByReport: (reportId: string) => FarmTask[]
  getStats: () => ReportStats
}

function generateId(): string {
  return `cr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export const useCropDoctorStore = create<CropDoctorState>()(
  persist(
    (set, get) => ({
      reports: [],
      tasks: [],

      addReport: (report) => set((s) => ({ reports: [report, ...s.reports] })),

      updateReport: (id, data) =>
        set((s) => ({
          reports: s.reports.map((r) =>
            r.id === id ? { ...r, ...data, updatedAt: new Date().toISOString() } : r
          ),
        })),

      removeReport: (id) =>
        set((s) => ({
          reports: s.reports.filter((r) => r.id !== id),
          tasks: s.tasks.filter((t) => t.reportId !== id),
        })),

      addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),

      updateTask: (id, data) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
        })),

      removeTask: (id) =>
        set((s) => ({
          tasks: s.tasks.filter((t) => t.id !== id),
        })),

      toggleTaskStatus: (id) =>
        set((s) => ({
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, status: t.status === 'pending' ? 'completed' : 'pending' } : t
          ),
        })),

      getReportsByPlot: (plotId) => get().reports.filter((r) => r.plotId === plotId),

      getTasksByPlot: (plotId) => get().tasks.filter((t) => t.plotId === plotId),

      getTasksByReport: (reportId) => get().tasks.filter((t) => t.reportId === reportId),

      getStats: () => {
        const { reports } = get()
        const now = new Date()
        const thisMonth = reports.filter((r) => {
          const d = new Date(r.diagnosedAt)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        }).length

        const diseaseCounts: Record<string, number> = {}
        const plotCounts: Record<string, number> = {}
        const plotHealth: Record<string, number[]> = {}
        let active = 0

        for (const r of reports) {
          diseaseCounts[r.diseaseName] = (diseaseCounts[r.diseaseName] || 0) + 1
          plotCounts[r.plotName] = (plotCounts[r.plotName] || 0) + 1
          if (!plotHealth[r.plotId]) plotHealth[r.plotId] = []
          plotHealth[r.plotId].push(r.severity === 'low' ? 30 : r.severity === 'medium' ? 60 : 90)
          if (r.treatmentStatus === 'pending' || r.treatmentStatus === 'in-progress') active++
        }

        let mostCommonDisease = 'N/A'
        let maxCount = 0
        for (const [d, c] of Object.entries(diseaseCounts)) {
          if (c > maxCount) { maxCount = c; mostCommonDisease = d }
        }

        let mostAffected = 'N/A'
        let maxPlot = 0
        let healthiest = 'N/A'
        let minAvg = Infinity
        const plots = get().reports.map((r) => ({ id: r.plotId, name: r.plotName }))
        const uniquePlots = plots.filter((p, i, a) => a.findIndex((x) => x.id === p.id) === i)

        for (const [pid, sevs] of Object.entries(plotHealth)) {
          const avg = sevs.reduce((a, b) => a + b, 0) / sevs.length
          if (sevs.length > maxPlot) { maxPlot = sevs.length; mostAffected = uniquePlots.find((p) => p.id === pid)?.name || 'N/A' }
          if (avg < minAvg) { minAvg = avg; healthiest = uniquePlots.find((p) => p.id === pid)?.name || 'N/A' }
        }

        return {
          total: reports.length,
          thisMonth,
          mostCommonDisease,
          mostAffectedPlot: mostAffected,
          healthiestPlot: healthiest,
          activeTreatments: active,
        }
      },
    }),
    {
      name: 'vaagai-crop-doctor',
      partialize: (state) => ({
        reports: state.reports,
        tasks: state.tasks,
      }),
    }
  )
)

export function createDiseaseReport(params: {
  plotId: string
  plotName: string
  cropType: string
  plantName: string
  scientificName: string
  diseaseName: string
  severity: Severity
  confidence: number
  photos: string[]
  symptoms: string[]
  growthStage: string
  description: string
  causes: string[]
  organicTreatment: string[]
  chemicalTreatment: string[]
  treatmentSteps: TreatmentStep[]
  prevention: string[]
  recoveryTimeline: string
  spreadRisk: Severity
}): DiseaseReport {
  const now = new Date().toISOString()
  return {
    id: generateId(),
    ...params,
    treatmentStatus: 'pending',
    notes: [],
    diagnosedAt: now,
    updatedAt: now,
  }
}

export function createTreatmentTasks(report: DiseaseReport, plotId: string): FarmTask[] {
  const now = new Date()
  const tasks: FarmTask[] = []

  for (const step of report.treatmentSteps) {
    const due = new Date(now)
    due.setDate(due.getDate() + step.day)
    tasks.push({
      id: generateId(),
      plotId,
      reportId: report.id,
      title: step.title,
      description: step.description,
      type: step.day === 1 ? 'treatment' : 'inspection',
      priority: step.day <= 3 ? 'high' : 'medium',
      dueDate: due.toISOString().split('T')[0],
      status: 'pending',
      createdAt: now.toISOString(),
    })
  }

  return tasks
}
