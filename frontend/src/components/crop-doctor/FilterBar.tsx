import { Search, SlidersHorizontal, X, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import type { Severity } from '../../stores/cropDoctorStore'
import { useLanguage } from '../../contexts/LanguageContext'

export interface FilterState {
  search: string
  severity: Severity | 'all'
  plotId: string
  dateRange: 'all' | '7d' | '30d' | '90d'
  sort: 'newest' | 'oldest' | 'severity'
}

interface FilterBarProps {
  filters: FilterState
  onChange: (filters: FilterState) => void
  plotOptions: { id: string; name: string }[]
  resultCount: number
}

export default function FilterBar({ filters, onChange, plotOptions, resultCount }: FilterBarProps) {
  const { t } = useLanguage()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const update = (partial: Partial<FilterState>) => onChange({ ...filters, ...partial })

  const hasActive = filters.search || filters.severity !== 'all' || filters.plotId || filters.dateRange !== 'all'

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder={t('cropDoctor.filter.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="input pl-9 pr-8 text-sm"
          />
          {filters.search && (
            <button type="button" onClick={() => update({ search: '' })} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-3 py-2 rounded-xl text-sm transition-all"
          style={{
            background: showAdvanced || hasActive ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
            color: showAdvanced || hasActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
            border: '1px solid var(--color-border)',
          }}
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {showAdvanced && (
        <div
          className="p-3 rounded-xl space-y-3 animate-fade-in"
          style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex flex-wrap gap-2">
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                {t('cropDoctor.filter.severity')}
              </label>
              <select
                value={filters.severity}
                onChange={(e) => update({ severity: e.target.value as Severity | 'all' })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="all">{t('cropDoctor.filter.all')}</option>
                <option value="low">{t('cropDoctor.filter.low')}</option>
                <option value="medium">{t('cropDoctor.filter.medium')}</option>
                <option value="high">{t('cropDoctor.filter.high')}</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                {t('cropDoctor.filter.timeRange')}
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => update({ dateRange: e.target.value as FilterState['dateRange'] })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="all">{t('cropDoctor.filter.allTime')}</option>
                <option value="7d">{t('cropDoctor.filter.last7Days')}</option>
                <option value="30d">{t('cropDoctor.filter.last30Days')}</option>
                <option value="90d">{t('cropDoctor.filter.last90Days')}</option>
              </select>
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                {t('cropDoctor.filter.cropPlot')}
              </label>
              <select
                value={filters.plotId}
                onChange={(e) => update({ plotId: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="">{t('cropDoctor.filter.allPlots')}</option>
                {plotOptions.map((p, i) => (
                  <option key={`${p.id}-${i}`} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1 min-w-[100px]">
              <label className="text-[10px] font-medium mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
                {t('cropDoctor.filter.sort')}
              </label>
              <select
                value={filters.sort}
                onChange={(e) => update({ sort: e.target.value as FilterState['sort'] })}
                className="w-full px-2.5 py-1.5 rounded-lg text-xs"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="newest">{t('cropDoctor.filter.newestFirst')}</option>
                <option value="oldest">{t('cropDoctor.filter.oldestFirst')}</option>
                <option value="severity">{t('cropDoctor.filter.severityDesc')}</option>
              </select>
            </div>
          </div>
          {hasActive && (
            <button
              type="button"
              onClick={() => onChange({ search: '', severity: 'all', plotId: '', dateRange: 'all', sort: 'newest' })}
              className="text-xs flex items-center gap-1 font-medium"
              style={{ color: 'var(--color-primary)' }}
            >
              <X size={12} /> {t('cropDoctor.filter.clearFilters')}
            </button>
          )}
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            {`${resultCount} result${resultCount > 1 ? 's' : ''}`}
          </div>
        </div>
      )}

      {/* Quick filter chips */}
      <div className="flex gap-1.5 flex-wrap">
        {(['all', 'high', 'medium', 'low'] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => update({ severity: s })}
            className="px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all"
            style={{
              background: filters.severity === s ? 'var(--color-primary-light)' : 'var(--color-surface-2)',
              color: filters.severity === s ? 'var(--color-primary)' : 'var(--color-text-muted)',
              border: `1px solid ${filters.severity === s ? 'var(--color-primary)' : 'var(--color-border)'}`,
            }}
          >
            {s === 'all' ? t('cropDoctor.filter.all') : s === 'low' ? t('cropDoctor.filter.low') : s === 'medium' ? t('cropDoctor.filter.medium') : t('cropDoctor.filter.high')}
          </button>
        ))}
      </div>
    </div>
  )
}
