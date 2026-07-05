import { useMemo } from 'react'
import { Sprout, Plus, X } from 'lucide-react'
import { useFarmStore } from '../farm3d/farmStore'
import { CROP_TYPES } from '../farm3d/farmStore'
import { useLanguage } from '../../contexts/LanguageContext'

export default function PlotSelector({
  value,
  onChange,
  onAddPlot,
}: {
  value: string
  onChange: (id: string, name: string, cropType: string) => void
  onAddPlot?: () => void
}) {
  const { t } = useLanguage()
  const crops = useFarmStore((s) => s.crops)

  const plotOptions = useMemo(
    () =>
      crops.map((c) => ({
        id: c.id,
        name: c.name,
        cropType: c.cropType,
        icon: CROP_TYPES[c.cropType]?.icon || '🌾',
      })),
    [crops]
  )

  return (
    <div>
      <label className="label">{t('cropDoctor.plotSelector.label')}</label>
      <div className="relative">
        <Sprout size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
        <select
          value={value}
          onChange={(e) => {
            const opt = plotOptions.find((p) => p.id === e.target.value)
            if (opt) onChange(opt.id, opt.name, opt.cropType)
          }}
          className="input pl-10 appearance-none cursor-pointer"
          style={{ background: 'var(--color-surface)' }}
        >
          <option value="">{t('cropDoctor.plotSelector.placeholder')}</option>
          {plotOptions.map((p, i) => (
            <option key={`${p.id}-${i}`} value={p.id}>
              {p.icon} {p.name}
            </option>
          ))}
        </select>
        {onAddPlot && (
          <button
            type="button"
            onClick={onAddPlot}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg"
            style={{ color: 'var(--color-primary)' }}
            title={t('cropDoctor.plotSelector.goToFarm')}
          >
            <Plus size={16} />
          </button>
        )}
      </div>
      {plotOptions.length === 0 && (
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          {t('cropDoctor.plotSelector.noPlots')}
        </p>
      )}
    </div>
  )
}
