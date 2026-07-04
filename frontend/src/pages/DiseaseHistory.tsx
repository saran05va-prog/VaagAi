import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScrollText, Search, X, Download, Trash2, Eye, Share2,
  Grid3X3, List, Timeline, AlertCircle, CalendarDays,
  Bug, Sprout, TrendingUp, Activity, BarChart3, PieChart,
  Loader2, ChevronRight, ArrowUp, FileText, Camera,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, LineChart, Line } from 'recharts'
import { useCropDoctorStore, type DiseaseReport, type Severity } from '../stores/cropDoctorStore'
import { CROP_TYPES } from '../components/farm3d/farmStore'
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
  const { reports, tasks, removeReport, getStats, toggleTaskStatus } = useCropDoctorStore()

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
          className="card p-12 text-center space-y-4">
          <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
            <Bug size={40} style={{ color: 'var(--color-primary)' }} />
          </div>
          <h2 className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{t('diseaseHistory.noDiagnoses')}</h2>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--color-text-muted)' }}>
            {t('diseaseHistory.noDiagnosesDesc')}
          </p>
          <button type="button" onClick={() => navigate('/crop-doctor')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}>
            <Bug size={18} /> {t('diseaseHistory.openCropDoctor')}
          </button>
        </motion.div>
      ) : (
        <>
          {/* Stats Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { icon: Bug, label: t('diseaseHistory.totalDiagnoses'), value: stats.total, color: '#2d7a2d' },
              { icon: TrendingUp, label: t('diseaseHistory.thisMonth'), value: stats.thisMonth, color: '#2563eb' },
              { icon: Activity, label: t('diseaseHistory.activeTreatments'), value: stats.activeTreatments, color: '#f59e0b' },
              { icon: AlertCircle, label: t('diseaseHistory.commonDisease'), value: stats.mostCommonDisease, color: '#7c3aed', small: true },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="card p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <stat.icon size={14} style={{ color: stat.color }} />
                  <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{stat.label}</span>
                </div>
                <div className={`font-bold ${stat.small ? 'text-sm truncate' : 'text-2xl'}`} style={{ fontFamily: 'Sora, sans-serif' }}>
                  {stat.value}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Analytics Charts */}
          {reports.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <PieChart size={14} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{t('diseaseHistory.diseaseFrequency')}</span>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <RePie>
                    <Pie data={diseaseFrequency} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                      {diseaseFrequency.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </RePie>
                </ResponsiveContainer>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={14} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{t('diseaseHistory.severityDistribution')}</span>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={severityDist}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {severityDist.map((entry) => (
                        <Cell key={entry.name} fill={entry.name === 'Low' ? '#22c55e' : entry.name === 'Medium' ? '#f59e0b' : '#ef4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} style={{ color: 'var(--color-primary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--color-text-muted)' }}>{t('diseaseHistory.diagnosesOverTime')}</span>
                </div>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={timelineData}>
                    <XAxis dataKey="month" tick={{ fontSize: 8 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#2d7a2d" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="card p-4 mb-6">
            <FilterBar filters={filters} onChange={setFilters} plotOptions={plotOptions} resultCount={filtered.length} />
          </div>

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
                <button key={v.id} type="button" onClick={() => setViewMode(v.id)}
                  className="p-1.5 rounded-md transition-all"
                  style={{ background: viewMode === v.id ? 'var(--color-surface)' : 'transparent' }}>
                  <v.icon size={16} style={{ color: viewMode === v.id ? 'var(--color-primary)' : 'var(--color-text-muted)' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Report Grid/List */}
          <div className={viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
            : 'space-y-3'}>
            <AnimatePresence>
              {filtered.map((report, i) => (
                <motion.div
                  key={report.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {viewMode === 'grid' ? (
                    <div className="card p-0 overflow-hidden group relative">
                      {report.photos[0] && (
                        <div className="h-36 overflow-hidden bg-black/10">
                          <img src={report.photos[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-sm">{report.diseaseName}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                              {report.plantName} · {report.plotName}
                            </div>
                          </div>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: `${severityColors[report.severity]}15`,
                              color: severityColors[report.severity],
                            }}>
                            {report.severity}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          <CalendarDays size={11} />
                          {formatDate(report.diagnosedAt)} · {daysAgo(report.diagnosedAt)}
                        </div>
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className={`w-2 h-2 rounded-full ${report.treatmentStatus === 'completed' ? 'bg-green-500' : report.treatmentStatus === 'in-progress' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                          <span className="text-[10px] font-medium capitalize" style={{ color: 'var(--color-text-muted)' }}>
                            {report.treatmentStatus.replace('-', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button type="button" onClick={() => setSelectedReport(report)}
                          className="p-1.5 rounded-lg bg-white/90 shadow-sm"><Eye size={13} /></button>
                        <button type="button" onClick={() => generatePDF(report)}
                          className="p-1.5 rounded-lg bg-white/90 shadow-sm"><Download size={13} /></button>
                        <button type="button" onClick={() => setConfirmDelete(report.id)}
                          className="p-1.5 rounded-lg bg-white/90 shadow-sm"><Trash2 size={13} style={{ color: '#ef4444' }} /></button>
                      </div>
                      <button type="button" onClick={() => setSelectedReport(report)}
                        className="absolute inset-0" />
                    </div>
                  ) : (
                    <div className="card p-4 flex items-center gap-4 relative group">
                      {report.photos[0] && (
                        <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={report.photos[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm truncate">{report.diseaseName}</span>
                          <span className="text-xs font-semibold px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{ background: `${severityColors[report.severity]}15`, color: severityColors[report.severity] }}>
                            {report.severity}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${report.treatmentStatus === 'completed' ? 'bg-green-500' : report.treatmentStatus === 'in-progress' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                        </div>
                        <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                          {report.plantName} · {report.plotName} · {daysAgo(report.diagnosedAt)}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={() => setSelectedReport(report)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)]"><Eye size={14} /></button>
                        <button type="button" onClick={() => generatePDF(report)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)]"><Download size={14} /></button>
                        <button type="button" onClick={() => setConfirmDelete(report.id)} className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)]"><Trash2 size={14} style={{ color: '#ef4444' }} /></button>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <Search size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('diseaseHistory.noFilterMatch')}</p>
            </div>
          )}
        </>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-12 pb-6 overflow-y-auto"
            onClick={() => setSelectedReport(null)}>
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden"
              style={{ background: 'var(--color-surface)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-3" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${severityColors[selectedReport.severity]}15` }}>
                    <Bug size={20} style={{ color: severityColors[selectedReport.severity] }} />
                  </div>
                  <div>
                    <div className="font-bold text-sm">{selectedReport.diseaseName}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{formatDate(selectedReport.diagnosedAt)}</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => generatePDF(selectedReport)} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)]"><Download size={16} /></button>
                  <button type="button" onClick={() => setSelectedReport(null)} className="p-2 rounded-lg hover:bg-[var(--color-surface-2)]"><X size={16} /></button>
                </div>
              </div>

              <div className="p-5 space-y-6 max-h-[80vh] overflow-y-auto">
                <div className="flex flex-wrap gap-4">
                  <SeverityGauge severity={selectedReport.severity} confidence={selectedReport.confidence} size="sm" />
                  <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                    <Sprout size={14} style={{ color: 'var(--color-primary)' }} />
                    {selectedReport.plantName} · {selectedReport.plotName}
                  </div>
                  <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                    <span className={`w-2 h-2 rounded-full ${selectedReport.treatmentStatus === 'completed' ? 'bg-green-500' : selectedReport.treatmentStatus === 'in-progress' ? 'bg-amber-500' : 'bg-gray-400'}`} />
                    <span className="capitalize">{selectedReport.treatmentStatus.replace('-', ' ')}</span>
                  </div>
                </div>

                {selectedReport.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedReport.photos.map((p, i) => (
                      <div key={i} className="w-40 h-28 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={p} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-sm mb-2">{t('diseaseHistory.description')}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{selectedReport.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">{t('diseaseHistory.causes')}</h3>
                  <ul className="space-y-1">
                    {selectedReport.causes.map((c, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-red-500 flex-shrink-0" />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-3">{t('diseaseHistory.treatmentTasks')}</h3>
                  <div className="space-y-2">
                    {relatedTasks.length === 0 ? (
                      <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('diseaseHistory.noTasks')}</p>
                    ) : (
                      relatedTasks.map((task) => (
                        <div key={task.id}
                          className="flex items-center gap-3 p-3 rounded-lg"
                          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                          <button
                            type="button"
                            onClick={() => toggleTaskStatus(task.id)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${task.status === 'completed' ? 'text-white' : ''}`}
                            style={{
                              background: task.status === 'completed' ? 'var(--color-primary)' : 'transparent',
                              border: `2px solid ${task.status === 'completed' ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            }}
                          >
                            {task.status === 'completed' && <CheckIcon size={12} />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className={`text-sm ${task.status === 'completed' ? 'line-through' : ''}`} style={{ color: task.status === 'completed' ? 'var(--color-text-muted)' : 'var(--color-text)' }}>
                              {task.title}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{task.dueDate} · {task.description}</div>
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${task.priority === 'high' ? 'text-red-600 bg-red-50 dark:bg-red-950/30' : task.priority === 'medium' ? 'text-amber-600 bg-amber-50' : 'text-green-600 bg-green-50'}`}>
                            {task.priority}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm mb-2">{t('diseaseHistory.prevention')}</h3>
                  <ul className="space-y-1">
                    {selectedReport.prevention.map((p, i) => (
                      <li key={i} className="text-sm flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 bg-green-500 flex-shrink-0" />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
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
            <div className="absolute inset-0 bg-black/40" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative w-full max-w-sm rounded-2xl p-6" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center mb-4 mx-auto">
                <AlertCircle size={24} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-center mb-2">{t('diseaseHistory.deleteTitle')}</h3>
              <p className="text-sm text-center mb-6" style={{ color: 'var(--color-text-muted)' }}>
                {t('diseaseHistory.deleteWarning')}
              </p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  {t('diseaseHistory.cancel')}
                </button>
                <button type="button" onClick={() => { removeReport(confirmDelete); setConfirmDelete(null) }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                  style={{ background: '#ef4444' }}>
                  {t('diseaseHistory.delete')}
                </button>
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
