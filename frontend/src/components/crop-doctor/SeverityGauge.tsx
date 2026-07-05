import { motion } from 'framer-motion'
import type { Severity } from '../../stores/cropDoctorStore'
import { useLanguage } from '../../contexts/LanguageContext'

const severityConfig: Record<Severity, { color: string; bg: string; label: string; percent: number }> = {
  low: { color: '#22c55e', bg: 'rgba(34,197,94,0.12)', label: 'Low', percent: 33 },
  medium: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Medium', percent: 66 },
  high: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'High', percent: 100 },
}

export default function SeverityGauge({
  severity,
  confidence,
  size = 'md',
}: {
  severity: Severity
  confidence?: number
  size?: 'sm' | 'md' | 'lg'
}) {
  const { t } = useLanguage()
  const cfg = severityConfig[severity]
  const dim = size === 'sm' ? 56 : size === 'lg' ? 120 : 80
  const stroke = size === 'sm' ? 5 : size === 'lg' ? 10 : 7
  const radius = (dim - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (cfg.percent / 100) * circumference

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle cx={dim / 2} cy={dim / 2} r={radius} fill="none" stroke="var(--color-border)" strokeWidth={stroke} />
          <motion.circle
            cx={dim / 2}
            cy={dim / 2}
            r={radius}
            fill="none"
            stroke={cfg.color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center font-bold"
          style={{ color: cfg.color, fontSize: size === 'sm' ? 10 : size === 'lg' ? 18 : 14 }}
        >
          {cfg.percent}%
        </div>
      </div>
      <div>
        <div className="text-sm font-semibold" style={{ color: cfg.color }}>
          {t(`cropDoctor.severity.${severity}`)}{size !== 'sm' && t('cropDoctor.severity.label')}
        </div>
        {confidence !== undefined && (
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {t('cropDoctor.severity.confidence_prefix')}{confidence !== undefined ? ` ${Math.round(confidence)}%` : ''}
          </div>
        )}
      </div>
    </div>
  )
}
