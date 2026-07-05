import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScrollText, Search, X, Download, Trash2, Eye, Share2,
  Grid3X3, List, Timeline, AlertCircle, CalendarDays,
  Bug, Sprout, TrendingUp, Activity, BarChart3, PieChart,
  Loader2, ChevronRight, ArrowUp, FileText, Camera, CheckCircle2,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, LineChart, Line } from 'recharts'
import { useCropDoctorStore, createTreatmentTasks, type DiseaseReport, type Severity } from '../stores/cropDoctorStore'
import { useFarmStore, CROP_TYPES } from '../components/farm3d/farmStore'
import SeverityGauge from '../components/crop-doctor/SeverityGauge'
import FilterBar, { type FilterState } from '../components/crop-doctor/FilterBar'
import { jsPDF } from 'jspdf'
import { useLanguage } from '../contexts/LanguageContext'

type ViewMode = 'grid' | 'list'

const severityOrder: Record<Severity, number> = { high: 0, medium: 1, low: 2 }

const severityColors: Record<Severity, string> = {
  low: '#22c55e',
  medium: '#f59e0b',
  high: '#ef4444',
}

const CHART_COLORS = ['#2d7a2d', '#2563eb', '#7c3aed', '#ea580c', '#e11d48', '#0d9488', '#ca8a04', '#0891b2']

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}



function generatePDF(report: DiseaseReport) {
  const doc = new jsPDF('p', 'mm', 'a4')
  let y = 20

  doc.setFillColor(45, 122, 45)
  doc.rect(0, 0, 210, 35, 'F')
  doc.setTextColor(255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('VaagAi Smart Farm', 15, 14)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Crop Disease Diagnostic Report', 15, 22)
  doc.text(formatDate(report.diagnosedAt), 15, 28)
  doc.text(`Report ID: ${report.id}`, 195, 14, { align: 'right' })

  y = 45
  doc.setTextColor(45, 122, 45)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Diagnosis Summary', 15, y); y += 8
  doc.setTextColor(51)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const lines = [
    `Plant: ${report.plantName} (${report.scientificName})`,
    `Disease: ${report.diseaseName}`,
    `Severity: ${report.severity.toUpperCase()} (${report.confidence}%)`,
    `Plot: ${report.plotName}`,
    `Status: ${report.treatmentStatus}`,
  ]
  for (const l of lines) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(l, 15, y); y += 6
  }

  y += 5
  doc.setTextColor(45, 122, 45)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Description', 15, y); y += 8
  doc.setTextColor(51)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const desc = doc.splitTextToSize(report.description, 180)
  for (const l of desc) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(l, 15, y); y += 5
  }

  y += 5
  doc.setTextColor(45, 122, 45)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Causes', 15, y); y += 8
  doc.setTextColor(51)
  doc.setFontSize(10)
  for (const c of report.causes) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(`  • ${c}`, 15, y); y += 5
  }

  y += 5
  doc.setTextColor(45, 122, 45)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Treatment Schedule', 15, y); y += 8
  doc.setFillColor(240, 253, 240)
  doc.rect(15, y - 2, 180, 8, 'F')
  doc.setTextColor(51)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Day', 20, y + 4); doc.text('Action', 40, y + 4); doc.text('Details', 90, y + 4)
  y += 10
  doc.setFont('helvetica', 'normal')
  for (const s of report.treatmentSteps) {
    if (y > 265) { doc.addPage(); y = 20 }
    doc.setFillColor(249, 250, 251)
    doc.rect(15, y - 2, 180, 8, 'F')
    doc.setFontSize(9)
    doc.text(`Day ${s.day}`, 20, y + 4)
    doc.setFont('helvetica', 'bold')
    doc.text(s.title, 40, y + 4)
    doc.setFont('helvetica', 'normal')
    doc.text(doc.splitTextToSize(s.description, 85), 90, y + 4)
    y += 10
  }

  y += 5
  doc.setTextColor(45, 122, 45)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text('Prevention', 15, y); y += 8
  doc.setTextColor(51)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  for (const p of report.prevention) {
    if (y > 275) { doc.addPage(); y = 20 }
    doc.text(`  • ${p}`, 15, y); y += 5
  }

  doc.save(`Disease_Report_${report.plantName.replace(/\s+/g, '_')}.pdf`)
}

export default function DiseaseHistory() {
  const { t } = useLanguage()
  const navigate = useNavigate()
  const { reports, tasks, removeReport, updateReport, getStats, toggleTaskStatus } = useCropDoctorStore()

  const daysAgo = (iso: string): string => {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)
    if (diff === 0) return t('diseaseHistory.today')
    if (diff === 1) return t('diseaseHistory.yesterday')
    return t('diseaseHistory.daysAgo').replace('{n}', diff)
  }
  const stats = getStats()
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedReport, setSelectedReport] = useState<DiseaseReport | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [filters, setFilters] = useState<FilterState>({
    search: '', severity: 'all', plotId: '', dateRange: 'all', sort: 'newest',
  })

  const plotOptions = useMemo(() => {
    const seen = new Set<string>()
    return reports
      .map((r) => ({ id: r.plotId, name: r.plotName }))
      .filter((p) => { if (seen.has(p.id)) return false; seen.add(p.id); return true })
  }, [reports])

  const filtered = useMemo(() => {
    let list = [...reports]

    if (filters.search) {
      const q = filters.search.toLowerCase()
      list = list.filter((r) =>
        r.plantName.toLowerCase().includes(q) ||
        r.diseaseName.toLowerCase().includes(q) ||
        r.plotName.toLowerCase().includes(q)
      )
    }
    if (filters.severity !== 'all') list = list.filter((r) => r.severity === filters.severity)
    if (filters.plotId) list = list.filter((r) => r.plotId === filters.plotId)
    if (filters.dateRange !== 'all') {
      const cutoff = Date.now() - { '7d': 7, '30d': 30, '90d': 90 }[filters.dateRange] * 86400000
      list = list.filter((r) => new Date(r.diagnosedAt).getTime() > cutoff)
    }

    if (filters.sort === 'newest') list.sort((a, b) => new Date(b.diagnosedAt).getTime() - new Date(a.diagnosedAt).getTime())
    else if (filters.sort === 'oldest') list.sort((a, b) => new Date(a.diagnosedAt).getTime() - new Date(b.diagnosedAt).getTime())
    else if (filters.sort === 'severity') list.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    return list
  }, [reports, filters])

  // Analytics data
  const diseaseFrequency = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const r of reports) { counts[r.diseaseName] = (counts[r.diseaseName] || 0) + 1 }
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + '...' : name, value }))
  }, [reports])

  const timelineData = useMemo(() => {
    const months: Record<string, number> = {}
    for (const r of reports) {
      const d = new Date(r.diagnosedAt)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      months[key] = (months[key] || 0) + 1
    }
    return Object.entries(months).sort().slice(-12).map(([month, count]) => ({
      month,
      count,
    }))
  }, [reports])

  const severityDist = useMemo(() => {
    const counts = { low: 0, medium: 0, high: 0 }
    for (const r of reports) counts[r.severity]++
    return Object.entries(counts).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
  }, [reports])

  const relatedTasks = useMemo(() => {
    if (!selectedReport) return []
    return tasks.filter((t) => t.reportId === selectedReport.id).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [selectedReport, tasks])

  const { crops, updateCrop, addTask: addFarmTask } = useFarmStore()
  const { addTask } = useCropDoctorStore()
  const [actionToast, setActionToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const handleApplyTreatment = useCallback(() => {
    if (!selectedReport) return
    const plot = crops.find((c) => c.id === selectedReport.plotId)
    if (!plot) {
      setActionToast({ message: 'Plot not found. This report may not be linked to a plot.', type: 'error' })
      return
    }
    updateCrop(selectedReport.plotId, {
      health: Math.min(100, plot.health + 15),
      diseaseDetected: selectedReport.diseaseName,
      pestRisk: Math.max(0, plot.pestRisk - 20),
    })
    updateReport(selectedReport.id, { treatmentStatus: 'in-progress' })
    setActionToast({ message: `Treatment applied to ${plot.name}. Plot health improved.`, type: 'success' })
    setTimeout(() => setActionToast(null), 3500)
  }, [selectedReport, crops, updateCrop, updateReport])

  const handleScheduleTasks = useCallback(() => {
    if (!selectedReport) return
    const newTasks = createTreatmentTasks(selectedReport, selectedReport.plotId)
    newTasks.forEach((t) => addTask(t))
    selectedReport.treatmentSteps.forEach((step) => {
      addFarmTask(selectedReport.plotId, {
        id: `ft_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: step.day === 1 ? 'pesticide' : 'inspect',
        description: `${step.title}: ${step.description}`,
        date: new Date(Date.now() + step.day * 86400000).toISOString().split('T')[0],
        completed: false,
        priority: step.day <= 3 ? 'high' : 'medium',
      })
    })
    setActionToast({ message: `${newTasks.length} treatment tasks added to calendar.`, type: 'success' })
    setTimeout(() => setActionToast(null), 3500)
  }, [selectedReport, addTask, addFarmTask])

  return (
    <div className="page-container max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'var(--color-primary-light)' }}>
              <ScrollText size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{t('diseaseHistory.title')}</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('diseaseHistory.subtitle')}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {reports.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl p-12 text-center space-y-4"
          style={{
            background: 'linear-gradient(135deg, var(--color-surface), var(--color-surface-2))',
            border: '1px solid var(--color-border)',
          }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-[0.03]"
            style={{ background: 'var(--color-primary)', transform: 'translate(30%, -30%)' }} />
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
            <Bug size={40} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{t('diseaseHistory.noDiagnoses')}</h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            {t('diseaseHistory.noDiagnosesDesc')}
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button" onClick={() => navigate('/crop-doctor')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white shadow-lg"
            style={{
              background: 'linear-gradient(135deg, #2d7a2d, #1a4d1a)',
              boxShadow: '0 4px 16px rgba(45,122,45,0.3)',
            }}>
            <Bug size={18} /> {t('diseaseHistory.openCropDoctor')}
          </motion.button>
        </motion.div>
      ) : (
        <>
          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: Bug, label: t('diseaseHistory.totalDiagnoses'), value: stats.total, color: '#2d7a2d', gradient: 'linear-gradient(135deg, rgba(45,122,45,0.12), rgba(45,122,45,0.04))' },
              { icon: TrendingUp, label: t('diseaseHistory.thisMonth'), value: stats.thisMonth, color: '#2563eb', gradient: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))' },
              { icon: Activity, label: t('diseaseHistory.activeTreatments'), value: stats.activeTreatments, color: '#f59e0b', gradient: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))' },
              { icon: AlertCircle, label: t('diseaseHistory.commonDisease'), value: stats.mostCommonDisease, color: '#7c3aed', gradient: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(124,58,237,0.04))', small: true },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -2, transition: { duration: 0.2 } }}
                className="relative overflow-hidden rounded-xl p-4"
                style={{ background: stat.gradient, border: '1px solid var(--color-border)' }}>
                <div className="absolute top-0 right-0 w-24 h-24 rounded-full opacity-[0.06]"
                  style={{ background: stat.color, transform: 'translate(30%, -30%)' }} />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: `${stat.color}18` }}>
                      <stat.icon size={13} style={{ color: stat.color }} />
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</span>
                  </div>
                  <div className={`font-bold ${stat.small ? 'text-sm truncate' : 'text-2xl'}`} style={{ fontFamily: 'Sora, sans-serif', color: stat.color }}>
                    {stat.value}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Analytics Charts */}
          {reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {[
                { icon: PieChart, title: t('diseaseHistory.diseaseFrequency'), content: (
                  <ResponsiveContainer width="100%" height={150}>
                    <RePie>
                      <Pie data={diseaseFrequency} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                        {diseaseFrequency.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </RePie>
                  </ResponsiveContainer>
                )},
                { icon: BarChart3, title: t('diseaseHistory.severityDistribution'), content: (
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={severityDist}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {severityDist.map((entry) => (
                          <Cell key={entry.name} fill={entry.name === 'Low' ? '#22c55e' : entry.name === 'Medium' ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )},
                { icon: TrendingUp, title: t('diseaseHistory.diagnosesOverTime'), content: (
                  <ResponsiveContainer width="100%" height={150}>
                    <LineChart data={timelineData}>
                      <XAxis dataKey="month" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#2d7a2d" strokeWidth={2.5} dot={{ r: 3, fill: '#2d7a2d' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )},
              ].map((chart, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.06 }}
                  className="rounded-xl p-4"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div className="flex items-center gap-2 mb-3">
                    <chart.icon size={14} style={{ color: 'var(--color-primary)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{chart.title}</span>
                  </div>
                  {chart.content}
                </motion.div>
              ))}
            </div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-4 mb-6"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
            <FilterBar filters={filters} onChange={setFilters} plotOptions={plotOptions} resultCount={filtered.length} />
          </motion.div>

          {/* View Toggle */}
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {t('diseaseHistory.showing').replace('{filtered}', filtered.length).replace('{total}', reports.length)}
            </div>
            <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
              {([
                { id: 'grid', icon: Grid3X3 },
                { id: 'list', icon: List },
              ] as const).map((v) => (
                <motion.button
                  key={v.id}
                  type="button"
                  onClick={() => setViewMode(v.id)}
                  whileTap={{ scale: 0.9 }}
                  className="p-1.5 rounded-md transition-all"
                  style={{ background: viewMode === v.id ? 'var(--color-surface)' : 'transparent' }}>
                  <v.icon size={16} style={{ color: viewMode === v.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                </motion.button>
              ))}
            </div>
          </div>

          {/* Report Grid/List */}
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'}>
            <AnimatePresence mode="popLayout">
              {filtered.map((report, i) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 10, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
                >
                  {viewMode === 'grid' ? (
                    <motion.div
                      whileHover={{ y: -3 }}
                      className="relative overflow-hidden rounded-xl group cursor-pointer"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="absolute top-0 inset-x-0 h-1"
                        style={{ background: `linear-gradient(90deg, ${severityColors[report.severity]}, ${severityColors[report.severity]}88)` }} />
                      {report.photos[0] && (
                        <div className="h-36 overflow-hidden bg-black/5">
                          <img src={report.photos[0]} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-semibold text-sm truncate">{report.diseaseName}</div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              {report.plantName} · {report.plotName}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 uppercase tracking-wider"
                            style={{
                              background: `${severityColors[report.severity]}18`,
                              color: severityColors[report.severity],
                            }}>
                            {report.severity}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                            <CalendarDays size={11} />
                            {daysAgo(report.diagnosedAt)}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${report.treatmentStatus === 'completed' ? 'bg-green-500' : report.treatmentStatus === 'in-progress' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                            <span className="text-[10px] font-medium capitalize" style={{ color: 'var(--color-text-muted)' }}>
                              {report.treatmentStatus.replace('-', ' ')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); generatePDF(report) }}
                          className="p-2 rounded-lg shadow-md backdrop-blur-sm"
                          style={{ background: 'rgba(255,255,255,0.95)', color: 'var(--color-text-muted)' }}>
                          <Download size={13} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setConfirmDelete(report.id) }}
                          className="p-2 rounded-lg shadow-md backdrop-blur-sm"
                          style={{ background: 'rgba(255,255,255,0.95)', color: '#ef4444' }}>
                          <Trash2 size={13} />
                        </motion.button>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      whileHover={{ x: 3 }}
                      className="flex items-center gap-4 p-4 rounded-xl cursor-pointer group"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="w-1 h-10 rounded-full flex-shrink-0"
                        style={{ background: severityColors[report.severity] }} />
                      {report.photos[0] && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={report.photos[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{report.diseaseName}</span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 uppercase"
                            style={{ background: `${severityColors[report.severity]}15`, color: severityColors[report.severity] }}>
                            {report.severity}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                          {report.plantName} · {report.plotName} · {daysAgo(report.diagnosedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${report.treatmentStatus === 'completed' ? 'bg-green-500' : report.treatmentStatus === 'in-progress' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                        <span className="text-[10px] font-medium capitalize hidden sm:inline" style={{ color: 'var(--color-text-muted)' }}>
                          {report.treatmentStatus.replace('-', ' ')}
                        </span>
                      </div>
                      <ChevronRight size={15} style={{ color: 'var(--color-text-muted)' }} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'var(--color-surface-2)' }}>
                <Search size={28} style={{ color: 'var(--color-text-muted)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{t('diseaseHistory.noFilterMatch')}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Try adjusting your search or filters</p>
            </motion.div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 pb-6 overflow-y-auto"
            onClick={() => setSelectedReport(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
              }}
              onClick={(e) => e.stopPropagation()}>
              {/* Header with gradient accent */}
              <div className="absolute top-0 inset-x-0 h-1"
                style={{ background: `linear-gradient(90deg, ${severityColors[selectedReport.severity]}, ${severityColors[selectedReport.severity]}44, transparent)` }} />
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-3"
                style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <motion.div
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${severityColors[selectedReport.severity]}18` }}>
                    <Bug size={20} style={{ color: severityColors[selectedReport.severity] }} />
                  </motion.div>
                  <div>
                    <div className="font-bold text-sm">{selectedReport.diseaseName}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(selectedReport.diagnosedAt)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button" onClick={() => generatePDF(selectedReport)}
                    className="p-2 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                    <Download size={15} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button" onClick={() => setSelectedReport(null)}
                    className="p-2 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                    <X size={15} />
                  </motion.button>
                </div>
              </div>

              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                {/* Status badges */}
                <div className="flex flex-wrap gap-3">
                  <SeverityGauge severity={selectedReport.severity} confidence={selectedReport.confidence} size="sm" />
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                    style={{ background: 'var(--color-surface-2)' }}>
                    <Sprout size={14} style={{ color: 'var(--color-primary)' }} />
                    {selectedReport.plantName} · {selectedReport.plotName}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg"
                    style={{ background: 'var(--color-surface-2)' }}>
                    <span className={`w-2 h-2 rounded-full ${selectedReport.treatmentStatus === 'completed' ? 'bg-green-500' : selectedReport.treatmentStatus === 'in-progress' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                    <span className="capitalize font-medium">{selectedReport.treatmentStatus.replace('-', ' ')}</span>
                  </motion.div>
                </div>

                {/* Photos */}
                {selectedReport.photos.length > 0 && (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {selectedReport.photos.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="w-44 h-28 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-black/5"
                      >
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Description */}
                <div className="rounded-xl p-4" style={{ background: 'var(--color-surface-2)' }}>
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <AlertCircle size={14} style={{ color: 'var(--color-primary)' }} />
                    {t('diseaseHistory.description')}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{selectedReport.description}</p>
                </div>

                {/* Causes */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    {t('diseaseHistory.causes')}
                  </h3>
                  <div className="space-y-2">
                    {selectedReport.causes.map((c, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)' }}>
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-red-500 flex-shrink-0" />
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{c}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Treatment Tasks */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CalendarDays size={14} style={{ color: 'var(--color-primary)' }} />
                    {t('diseaseHistory.treatmentTasks')}
                  </h3>
                  <div className="space-y-2">
                    {relatedTasks.length === 0 ? (
                      <p className="text-sm py-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
                        {t('diseaseHistory.noTasks')}
                      </p>
                    ) : (
                      relatedTasks.map((task, i) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{
                            background: task.status === 'completed' ? 'rgba(34,197,94,0.04)' : 'var(--color-surface-2)',
                            border: `1px solid ${task.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'var(--color-border)'}`,
                          }}>
                          <motion.button
                            whileTap={{ scale: 0.85 }}
                            type="button"
                            onClick={() => toggleTaskStatus(task.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${task.status === 'completed' ? 'text-white' : ''}`}
                            style={{
                              background: task.status === 'completed' ? 'var(--color-primary)' : 'transparent',
                              border: `2px solid ${task.status === 'completed' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            }}
                          >
                            {task.status === 'completed' && <CheckIcon size={12} />}
                          </motion.button>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm ${task.status === 'completed' ? 'line-through' : ''}`}
                              style={{ color: task.status === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                              {task.title}
                            </div>
                            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                              {task.dueDate} · {task.description}
                            </div>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.priority === 'high' ? 'text-red-600 bg-red-50' :
                            task.priority === 'medium' ? 'text-amber-600 bg-amber-50' :
                            'text-green-600 bg-green-50'
                          }`}>
                            {task.priority}
                          </span>
                        </motion.div>
                      ))
                    )}
                  </div>
                </div>

                {/* Prevention */}
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 size={14} style={{ color: '#22c55e' }} />
                    {t('diseaseHistory.prevention')}
                  </h3>
                  <div className="space-y-2">
                    {selectedReport.prevention.map((p, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-start gap-3 p-3 rounded-lg"
                        style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.1)' }}>
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#22c55e' }} />
                        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{p}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Action buttons */}
                {selectedReport.treatmentStatus !== 'completed' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col sm:flex-row gap-3 pt-2"
                    style={{ borderTop: '1px solid var(--color-border)' }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button" onClick={handleApplyTreatment}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md"
                      style={{
                        background: 'linear-gradient(135deg, #2d7a2d, #1a4d1a)',
                        boxShadow: '0 4px 12px rgba(45,122,45,0.3)',
                      }}>
                      <Sprout size={16} /> Apply Treatment to Plot
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button" onClick={handleScheduleTasks}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                      <CalendarDays size={16} /> Schedule Calendar Tasks
                    </motion.button>
                  </motion.div>
                )}

                {/* Toast */}
                {actionToast && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-4 rounded-xl text-sm font-medium"
                    style={{
                      background: actionToast.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1px solid ${actionToast.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
                      color: actionToast.type === 'success' ? '#15803d' : '#dc2626',
                    }}>
                    {actionToast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                    {actionToast.message}
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="relative w-full max-w-sm rounded-2xl p-6 shadow-2xl"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-5 mx-auto"
                style={{ background: 'rgba(239,68,68,0.1)' }}>
                <AlertCircle size={28} style={{ color: '#ef4444' }} />
              </div>
              <h3 className="text-lg font-bold text-center mb-2" style={{ fontFamily: 'Sora, sans-serif' }}>{t('diseaseHistory.deleteTitle')}</h3>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
                {t('diseaseHistory.deleteWarning')}
              </p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button" onClick={() => setConfirmDelete(null)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  {t('diseaseHistory.cancel')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button" onClick={() => { removeReport(confirmDelete); setConfirmDelete(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white shadow-md"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                  {t('diseaseHistory.delete')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
