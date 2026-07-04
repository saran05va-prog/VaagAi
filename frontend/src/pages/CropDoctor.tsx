import { useState, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, AlertCircle, CheckCircle2, Download, Share2, Clock,
  Leaf, Bug, FlaskConical, Shield, Thermometer, Droplets,
  ArrowRight, ArrowLeft, X, Sprout, ScrollText, CalendarDays,
  Sparkles, FlaskRound as Flask, Syringe, BarChart3, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { jsPDF } from 'jspdf'
import { useFarmStore } from '../components/farm3d/farmStore'
import { CROP_TYPES } from '../components/farm3d/farmStore'
import {
  useCropDoctorStore,
  createDiseaseReport,
  createTreatmentTasks,
  type DiseaseReport,
  type Severity,
} from '../stores/cropDoctorStore'
import {
  diseaseDatabase,
  diagnoseDisease,
  symptomOptions,
  growthStages,
  allCropKeys,
  type DiseaseInfo,
} from '../data/diseaseData'
import PhotoCapture from '../components/crop-doctor/PhotoCapture'
import PlotSelector from '../components/crop-doctor/PlotSelector'
import SeverityGauge from '../components/crop-doctor/SeverityGauge'
import { useLanguage } from '../contexts/LanguageContext'

type Step = 'input' | 'analyzing' | 'results'

const plantAutocompleteOptions = allCropKeys.map((k) => ({
  value: k,
  label: k.charAt(0).toUpperCase() + k.slice(1),
}))

export default function CropDoctor() {
  const { t } = useLanguage()

  const stageMessages = [
    { label: t('cropDoctor.scanning'), percent: 20 },
    { label: t('cropDoctor.identifying'), percent: 45 },
    { label: t('cropDoctor.analyzingSeverity'), percent: 65 },
    { label: t('cropDoctor.generatingTreatment'), percent: 85 },
    { label: t('cropDoctor.preparingReport'), percent: 100 },
  ]

  const navigate = useNavigate()
  const { addReport, addTask, reports } = useCropDoctorStore()
  const crops = useFarmStore((s) => s.crops)

  const [step, setStep] = useState<Step>('input')
  const [photos, setPhotos] = useState<string[]>([])
  const [plantName, setPlantName] = useState('')
  const [plotId, setPlotId] = useState('')
  const [plotName, setPlotName] = useState('')
  const [cropType, setCropType] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([])
  const [growthStage, setGrowthStage] = useState('vegetative')
  const [notes, setNotes] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisMsg, setAnalysisMsg] = useState(stageMessages[0].label)
  const [diseaseResult, setDiseaseResult] = useState<DiseaseInfo | null>(null)
  const [generatedReport, setGeneratedReport] = useState<DiseaseReport | null>(null)
  const [savedToast, setSavedToast] = useState(false)
  const [expandedSection, setExpandedSection] = useState<string | null>('description')
  const resultRef = useRef<HTMLDivElement>(null)

  const filteredPlants = useMemo(() => {
    if (!plantName) return plantAutocompleteOptions
    return plantAutocompleteOptions.filter((p) =>
      p.label.toLowerCase().includes(plantName.toLowerCase())
    )
  }, [plantName])

  const canAnalyze = photos.length > 0 && plantName.trim().length > 0

  const toggleSymptom = (s: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  const handleAnalyze = useCallback(async () => {
    if (!canAnalyze) return
    setStep('analyzing')
    setAnalysisProgress(0)

    for (const msg of stageMessages) {
      setAnalysisMsg(msg.label)
      setAnalysisProgress(msg.percent)
      await new Promise((r) => setTimeout(r, 600))
    }

    const result = diagnoseDisease(plantName, selectedSymptoms)
    if (!result) {
      const fallback: DiseaseInfo = {
        id: 'unknown',
        diseaseName: 'Unknown Condition',
        scientificName: 'Unidentified',
        severity: 'low',
        confidence: 40,
        description: 'The symptoms do not closely match our disease database. Please consult an agricultural expert for accurate diagnosis.',
        causes: ['Unidentified pathogen or environmental stress', 'Nutrient deficiency possible', 'Pest damage possible'],
        symptoms: selectedSymptoms,
        organicTreatment: ['Apply neem oil as general preventive', 'Ensure balanced nutrition', 'Improve soil health with compost'],
        chemicalTreatment: ['Consult local agriculture officer for specific treatment'],
        treatmentSteps: [
          { title: 'Monitor', description: 'Observe plant for 3-5 days for changes', day: 1 },
          { title: 'Collect Sample', description: 'Take samples to local agricultural lab', day: 3 },
        ],
        prevention: ['Maintain good farm hygiene', 'Regular monitoring', 'Balanced fertilization'],
        recoveryTimeline: 'Depends on underlying cause — consult expert',
        spreadRisk: 'low',
        similarDiseases: [],
      }
      setDiseaseResult(fallback)
    } else {
      setDiseaseResult(result)
    }

    setStep('results')
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 300)
  }, [canAnalyze, plantName, selectedSymptoms])

  const handleSaveReport = useCallback(() => {
    if (!diseaseResult) return
    const now = new Date()
    const plot = crops.find((c) => c.id === plotId)

    const report = createDiseaseReport({
      plotId: plotId || 'unknown',
      plotName: plotName || 'Unassigned',
      cropType: cropType || plantName,
      plantName: plantName.charAt(0).toUpperCase() + plantName.slice(1),
      scientificName: diseaseResult.scientificName,
      diseaseName: diseaseResult.diseaseName,
      severity: diseaseResult.severity,
      confidence: diseaseResult.confidence,
      photos,
      symptoms: selectedSymptoms,
      growthStage,
      description: diseaseResult.description,
      causes: diseaseResult.causes,
      organicTreatment: diseaseResult.organicTreatment,
      chemicalTreatment: diseaseResult.chemicalTreatment,
      treatmentSteps: diseaseResult.treatmentSteps,
      prevention: diseaseResult.prevention,
      recoveryTimeline: diseaseResult.recoveryTimeline,
      spreadRisk: diseaseResult.spreadRisk,
    })

    addReport(report)
    const tasks = createTreatmentTasks(report, plotId || 'unknown')
    tasks.forEach((t) => addTask(t))

    setGeneratedReport(report)
    setSavedToast(true)
    setTimeout(() => setSavedToast(false), 4000)
  }, [diseaseResult, plotId, plotName, cropType, plantName, photos, selectedSymptoms, growthStage, addReport, addTask, crops])

  const generatePDF = useCallback(async () => {
    const report = generatedReport || (diseaseResult ? {
      ...createDiseaseReport({
        plotId: plotId || 'unknown',
        plotName: plotName || 'Unassigned',
        cropType: cropType || plantName,
        plantName: plantName.charAt(0).toUpperCase() + plantName.slice(1),
        scientificName: diseaseResult!.scientificName,
        diseaseName: diseaseResult!.diseaseName,
        severity: diseaseResult!.severity,
        confidence: diseaseResult!.confidence,
        photos,
        symptoms: selectedSymptoms,
        growthStage,
        description: diseaseResult!.description,
        causes: diseaseResult!.causes,
        organicTreatment: diseaseResult!.organicTreatment,
        chemicalTreatment: diseaseResult!.chemicalTreatment,
        treatmentSteps: diseaseResult!.treatmentSteps,
        prevention: diseaseResult!.prevention,
        recoveryTimeline: diseaseResult!.recoveryTimeline,
        spreadRisk: diseaseResult!.spreadRisk,
      }),
    } : null)
    if (!report) return

    const doc = new jsPDF('p', 'mm', 'a4')
    const pageW = 210
    let y = 20

    const addLine = (text: string, size = 11, bold = false, color = '#333') => {
      if (y > 275) { doc.addPage(); y = 20 }
      doc.setFontSize(size)
      doc.setFont('helvetica', bold ? 'bold' : 'normal')
      doc.setTextColor(color)
      doc.text(text, 15, y)
      y += size * 0.45
    }

    // Header
    doc.setFillColor(45, 122, 45)
    doc.rect(0, 0, pageW, 35, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('VaagAi Smart Farm', 15, 14)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Crop Disease Diagnostic Report', 15, 22)
    doc.text(new Date(report.diagnosedAt).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' }), 15, 28)
    doc.text(`Report ID: ${report.id}`, pageW - 15, 14, { align: 'right' })

    y = 45
    // Info section
    doc.setTextColor(45, 122, 45)
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.text('Diagnosis Summary', 15, y)
    y += 7
    doc.setTextColor(51)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const infoLines = [
      `Plant: ${report.plantName} (${report.scientificName})`,
      `Disease: ${report.diseaseName}`,
      `Severity: ${report.severity.toUpperCase()} (${report.confidence}% confidence)`,
      `Plot: ${report.plotName}`,
      `Growth Stage: ${report.growthStage}`,
      `Spread Risk: ${report.spreadRisk.toUpperCase()}`,
    ]
    for (const line of infoLines) { addLine(line, 10) }

    y += 5
    doc.setTextColor(45, 122, 45)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    addLine('Description', 13, true)
    doc.setTextColor(51)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)

    const descLines = doc.splitTextToSize(report.description, 180)
    for (const l of descLines) { addLine(l, 10) }

    y += 5
    doc.setTextColor(45, 122, 45)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    addLine('Causes', 13, true)
    doc.setTextColor(51)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    for (const c of report.causes) { addLine(`  • ${c}`, 10) }

    y += 5
    doc.setTextColor(45, 122, 45)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    addLine('Treatment Schedule', 13, true)

    // Treatment table
    doc.setFillColor(240, 253, 240)
    doc.rect(15, y - 2, 180, 8, 'F')
    doc.setTextColor(51)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text('Day', 20, y + 4)
    doc.text('Action', 40, y + 4)
    doc.text('Details', 90, y + 4)
    y += 10

    doc.setFont('helvetica', 'normal')
    for (const step of report.treatmentSteps) {
      if (y > 265) { doc.addPage(); y = 20 }
      doc.setFillColor(249, 250, 251)
      doc.rect(15, y - 2, 180, 8, 'F')
      doc.setFontSize(9)
      doc.text(`Day ${step.day}`, 20, y + 4)
      doc.setFont('helvetica', 'bold')
      doc.text(step.title, 40, y + 4)
      doc.setFont('helvetica', 'normal')
      const details = doc.splitTextToSize(step.description, 85)
      doc.text(details, 90, y + 4)
      y += 10
    }

    y += 5
    doc.setTextColor(45, 122, 45)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    addLine('Preventive Measures', 13, true)
    doc.setTextColor(51)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    for (const p of report.prevention) { addLine(`  • ${p}`, 10) }

    y += 8
    doc.setFontSize(8)
    doc.setTextColor(153)
    doc.setFont('helvetica', 'italic')
    addLine('This report is generated for reference. Consult an agricultural expert for accurate diagnosis and treatment.', 8)

    doc.save(`Crop_Doctor_Report_${report.plantName.replace(/\s+/g, '_')}.pdf`)
  }, [generatedReport, diseaseResult, plotId, plotName, cropType, plantName, photos, selectedSymptoms, growthStage])

  const handleStartOver = () => {
    setStep('input')
    setPhotos([])
    setPlantName('')
    setPlotId('')
    setPlotName('')
    setCropType('')
    setSelectedSymptoms([])
    setNotes('')
    setDiseaseResult(null)
    setGeneratedReport(null)
    setAnalysisProgress(0)
  }

  const severityColor = diseaseResult?.severity === 'high' ? '#ef4444' : diseaseResult?.severity === 'medium' ? '#f59e0b' : '#22c55e'

  return (
    <div className="page-container max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl" style={{ background: 'var(--color-primary-light)' }}>
            <Bug size={20} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>{t('cropDoctor.title')}</h1>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{t('cropDoctor.subtitle')}</p>
          </div>
        </div>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {(['input', 'analyzing', 'results'] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all"
              style={{
                background: step === s ? 'var(--color-primary)' : step === 'results' && s === 'input' || step === 'results' && s === 'analyzing' ? 'var(--color-primary)' : 'var(--color-surface-2)',
                color: step === s || (step === 'results' && ['input', 'analyzing'].includes(s)) ? 'white' : 'var(--color-text-muted)',
              }}
            >
              {step === 'results' && ['input', 'analyzing'].includes(s) ? <CheckCircle2 size={14} /> : i + 1}
            </div>
            <span className="text-xs font-medium" style={{
              color: step === s ? 'var(--color-text)' : 'var(--color-text-muted)',
              display: step === s ? 'block' : 'none',
              whiteSpace: 'nowrap',
            }}>
              {s === 'input' ? t('cropDoctor.stepInput') : s === 'analyzing' ? t('cropDoctor.stepAnalyzing') : t('cropDoctor.stepResults')}
            </span>
            {i < 2 && <div className="w-8 h-px" style={{ background: step !== 'input' ? 'var(--color-primary)' : 'var(--color-border)' }} />}
          </div>
        ))}
      </div>

      {/* ===== INPUT STEP ===== */}
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <div className="card p-6 space-y-6">
              <PhotoCapture photos={photos} onChange={setPhotos} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">{t('cropDoctor.plantName')}</label>
                  <div className="relative">
                    <Leaf size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
                    <input
                      type="text"
                      placeholder={t('cropDoctor.plantPlaceholder')}
                      value={plantName}
                      onChange={(e) => { setPlantName(e.target.value); setShowAutocomplete(true) }}
                      onFocus={() => setShowAutocomplete(true)}
                      onBlur={() => setTimeout(() => setShowAutocomplete(false), 200)}
                      className="input pl-10"
                      autoComplete="off"
                    />
                    {showAutocomplete && filteredPlants.length > 0 && plantName && (
                      <div
                        className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden shadow-xl"
                        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                      >
                        {filteredPlants.map((p) => (
                          <button
                            key={p.value}
                            type="button"
                            onMouseDown={() => { setPlantName(p.value); setShowAutocomplete(false) }}
                            className="w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[var(--color-surface-2)]"
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <PlotSelector
                  value={plotId}
                  onChange={(id, name, type) => { setPlotId(id); setPlotName(name); setCropType(type) }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="label">{t('cropDoctor.growthStage')}</label>
                  <select value={growthStage} onChange={(e) => setGrowthStage(e.target.value)}
                    className="input">
                    {growthStages.map((s) => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="label mb-2">{t('cropDoctor.observedSymptoms')}</label>
                <div className="flex flex-wrap gap-2">
                  {symptomOptions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSymptom(s)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{
                        background: selectedSymptoms.includes(s) ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
                        color: selectedSymptoms.includes(s) ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        border: `1px solid ${selectedSymptoms.includes(s) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      }}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
                <p className="text-xs mt-2" style={{ color: 'var(--color-text-muted)' }}>
                  {selectedSymptoms.length === 0 ? t('cropDoctor.tapSymptoms') : t('cropDoctor.symptomsSelected').replace('{n}', String(selectedSymptoms.length))}
                </p>
              </div>

              <div>
                <label className="label">{t('cropDoctor.notes')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('cropDoctor.notesPlaceholder')}
                  className="input min-h-[80px] resize-none"
                />
              </div>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={!canAnalyze}
                className="w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 text-base transition-all"
                style={{
                  background: canAnalyze ? 'var(--color-primary)' : 'var(--color-border)',
                  color: canAnalyze ? 'white' : 'var(--color-text-muted)',
                }}
              >
                <Sparkles size={20} />
                {t('cropDoctor.analyzeBtn')}
              </button>

              {!canAnalyze && (
                <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>
                  {t('cropDoctor.addPhotoHint')}
                </p>
              )}
            </div>
          </motion.div>
        )}

        {/* ===== ANALYZING STEP ===== */}
        {step === 'analyzing' && (
          <motion.div key="analyzing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-12 text-center space-y-6">
            <div className="relative w-24 h-24 mx-auto">
              <svg className="animate-spin" viewBox="0 0 24 24" width={96} height={96}>
                <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-border)" strokeWidth="3" />
                <circle cx="12" cy="12" r="10" fill="none" stroke="var(--color-primary)" strokeWidth="3"
                  strokeDasharray={62.83} strokeDashoffset={62.83 - (analysisProgress / 100) * 62.83}
                  strokeLinecap="round" className="-rotate-90" style={{ transformOrigin: '12px 12px' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Search size={28} style={{ color: 'var(--color-primary)' }} />
              </div>
            </div>
            <div>
              <div className="text-lg font-semibold mb-1">{analysisMsg}</div>
              <div className="text-sm" style={{ color: 'var(--color-text-muted)' }}>{analysisProgress}%</div>
            </div>
            <div className="max-w-md mx-auto h-2 rounded-full" style={{ background: 'var(--color-border)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'var(--color-primary)', width: `${analysisProgress}%` }}
                layout
              />
            </div>
          </motion.div>
        )}

        {/* ===== RESULTS STEP ===== */}
        {step === 'results' && diseaseResult && (
          <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div ref={resultRef} className="space-y-6">
              {/* Header banner */}
              <div className="card p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-5"
                  style={{ background: severityColor, transform: 'translate(30%, -30%)' }} />
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                      style={{ background: `${severityColor}15` }}>
                      <Bug size={32} style={{ color: severityColor }} />
                    </div>
                    <div>
                      <div className="text-xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
                        {diseaseResult.diseaseName}
                      </div>
                      <div className="text-sm italic" style={{ color: 'var(--color-text-muted)' }}>
                        {diseaseResult.scientificName}
                      </div>
                      <div className="flex items-center gap-3 mt-1.5">
                        <SeverityGauge severity={diseaseResult.severity} confidence={diseaseResult.confidence} size="sm" />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <button type="button" onClick={generatePDF}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                      <Download size={15} /> {t('cropDoctor.pdf')}
                    </button>
                    <button type="button" onClick={handleSaveReport} disabled={!!generatedReport}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                      style={{
                        background: generatedReport ? 'rgba(34,197,94,0.12)' : 'var(--color-primary)',
                        color: generatedReport ? '#22c55e' : 'white',
                      }}>
                      {generatedReport ? <CheckCircle2 size={15} /> : <ScrollText size={15} />}
                      {generatedReport ? t('cropDoctor.saved') : t('cropDoctor.saveSchedule')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Success toast */}
              {savedToast && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} style={{ color: '#22c55e' }} />
                    <div>
                      <div className="font-semibold text-sm" style={{ color: '#15803d' }}>{t('cropDoctor.reportSaved')}</div>
                      <div className="text-xs" style={{ color: '#166534' }}>
                        {t('cropDoctor.tasksAdded')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => navigate('/disease-history')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#15803d' }}>
                      {t('cropDoctor.viewHistory')}
                    </button>
                    <button type="button" onClick={() => navigate('/calendar')}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                      style={{ background: 'rgba(34,197,94,0.15)', color: '#15803d' }}>
                      {t('cropDoctor.viewTasks')}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Analysis details */}
              <div className="card p-6 space-y-4">
                {/* Disease description */}
                <Section title={t('cropDoctor.description')} icon={AlertCircle} id="description" expanded={expandedSection} onToggle={setExpandedSection}>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                    {diseaseResult.description}
                  </p>
                </Section>

                {/* Causes */}
                <Section title={t('cropDoctor.causes')} icon={Bug} id="causes" expanded={expandedSection} onToggle={setExpandedSection}>
                  <ul className="space-y-2">
                    {diseaseResult.causes.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: 'var(--color-danger)' }} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{c}</span>
                      </li>
                    ))}
                  </ul>
                </Section>

                {/* Treatment options */}
                <Section title={t('cropDoctor.treatmentPlan')} icon={FlaskConical} id="treatment" expanded={expandedSection} onToggle={setExpandedSection}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf size={16} style={{ color: '#22c55e' }} />
                        <span className="font-semibold text-sm">{t('cropDoctor.organicOptions')}</span>
                      </div>
                      <ul className="space-y-1">
                        {diseaseResult.organicTreatment.map((t, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                            <span>•</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Syringe size={16} style={{ color: '#3b82f6' }} />
                        <span className="font-semibold text-sm">{t('cropDoctor.chemicalOptions')}</span>
                      </div>
                      <ul className="space-y-1">
                        {diseaseResult.chemicalTreatment.map((t, i) => (
                          <li key={i} className="text-xs flex items-start gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                            <span>•</span> {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div>
                    <div className="font-semibold text-sm mb-3">{t('cropDoctor.stepSchedule')}</div>
                    <div className="space-y-2">
                      {diseaseResult.treatmentSteps.map((step, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ background: 'var(--color-surface-2)' }}>
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0"
                            style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                            D{step.day}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{step.title}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{step.description}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Section>

                {/* Prevention */}
                <Section title={t('cropDoctor.preventiveMeasures')} icon={Shield} id="prevention" expanded={expandedSection} onToggle={setExpandedSection}>
                  <ul className="space-y-2">
                    {diseaseResult.prevention.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-success)' }} />
                        <span style={{ color: 'var(--color-text-secondary)' }}>{p}</span>
                      </li>
                    ))}
                  </ul>
                </Section>

                {/* Additional info */}
                <Section title={t('cropDoctor.recoverySpread')} icon={BarChart3} id="recovery" expanded={expandedSection} onToggle={setExpandedSection}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <Clock size={14} style={{ color: 'var(--color-primary)' }} />
                        <span className="text-sm font-medium">{t('cropDoctor.recoveryTimeline')}</span>
                      </div>
                      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{diseaseResult.recoveryTimeline}</p>
                    </div>
                    <div className="p-4 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                      <div className="flex items-center gap-2 mb-1">
                        <BarChart3 size={14} style={{ color: 'var(--color-primary)' }} />
                        <span className="text-sm font-medium">{t('cropDoctor.spreadRisk')}</span>
                      </div>
                      <div className={`text-xs font-semibold ${diseaseResult.spreadRisk === 'high' ? 'text-red-600' : diseaseResult.spreadRisk === 'medium' ? 'text-amber-600' : 'text-green-600'}`}>
                        {diseaseResult.spreadRisk.toUpperCase()}
                      </div>
                    </div>
                  </div>
                </Section>
              </div>

              {/* Bottom actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between">
                <button type="button" onClick={handleStartOver}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                  <ArrowLeft size={16} /> {t('cropDoctor.diagnoseAnother')}
                </button>
                <div className="flex gap-2">
                  <button type="button" onClick={() => navigate('/disease-history')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <ScrollText size={16} /> {t('cropDoctor.viewAllReports')}
                  </button>
                  <button type="button" onClick={() => navigate('/calendar')}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}>
                    <CalendarDays size={16} /> {t('cropDoctor.viewCalendar')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Section({
  title, icon: Icon, id, expanded, onToggle, children,
}: {
  title: string
  icon: React.ElementType
  id: string
  expanded: string | null
  onToggle: (id: string | null) => void
  children: React.ReactNode
}) {
  const isOpen = expanded === id
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
      <button
        type="button"
        onClick={() => onToggle(isOpen ? null : id)}
        className="w-full flex items-center justify-between p-4 text-left transition-colors"
        style={{ background: 'var(--color-surface-2)' }}
      >
        <div className="flex items-center gap-2">
          <Icon size={16} style={{ color: 'var(--color-primary)' }} />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        {isOpen ? <ChevronUp size={16} style={{ color: 'var(--color-text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--color-text-muted)' }} />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="p-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
