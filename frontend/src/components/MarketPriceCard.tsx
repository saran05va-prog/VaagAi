import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, MapPin } from 'lucide-react'

interface MarketPriceCardProps {
  commodity: string
  market: string
  district: string
  state: string
  modalPrice: number
  trend7d: number
  trend30d: number
  confidence: 'high' | 'medium' | 'low'
  daysStale: number
  distanceKm?: number
}

const confidenceColor = (c: string) =>
  c === 'high' ? 'var(--color-success)' : c === 'medium' ? 'var(--color-warning)' : 'var(--color-danger)'

const formatPrice = (v: number) => '\u20B9' + Math.round(v).toLocaleString('en-IN')

function TrendBadge({ value }: { value: number }) {
  if (value > 2) return <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-danger)' }}><TrendingUp size={14} /> +{value}%</span>
  if (value < -2) return <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-success)' }}><TrendingDown size={14} /> {value}%</span>
  return <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-muted)' }}><Minus size={14} /> Stable</span>
}

export default function MarketPriceCard({
  commodity, market, district, state, modalPrice,
  trend7d, trend30d, confidence, daysStale, distanceKm,
}: MarketPriceCardProps) {
  return (
    <Card className="overflow-hidden border" style={{ borderColor: confidenceColor(confidence) + '40' }}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{commodity}</CardTitle>
          <span
            className="text-[10px] uppercase font-medium px-2 py-0.5 rounded-full"
            style={{ background: confidenceColor(confidence) + '20', color: confidenceColor(confidence) }}
          >
            {confidence}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground flex items-center gap-1">
          <MapPin size={11} /> {market}, {district}, {state}
          {distanceKm !== undefined && <span className="ml-auto opacity-60">{distanceKm} km</span>}
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold">{formatPrice(modalPrice)}</span>
          <span className="text-xs text-muted-foreground">/kg</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <div><span className="text-muted-foreground">7d: </span><TrendBadge value={trend7d} /></div>
          <div><span className="text-muted-foreground">30d: </span><TrendBadge value={trend30d} /></div>
        </div>
        {daysStale > 0 && (
          <div className="flex items-center gap-1 mt-2 text-[10px]" style={{ color: 'var(--color-warning)' }}>
            <AlertTriangle size={10} /> Stale ({daysStale}d old)
          </div>
        )}
      </CardContent>
    </Card>
  )
}