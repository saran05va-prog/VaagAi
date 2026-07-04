import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface HistoryPoint {
  date: string
  price: number
  confidence?: string
}

interface MarketTrendChartProps {
  commodity: string
  history: HistoryPoint[]
  isLoading?: boolean
}

export default function MarketTrendChart({ commodity, history, isLoading }: MarketTrendChartProps) {
  const chartData = useMemo(() => {
    return [...history]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(p => ({ date: p.date, price: p.price }))
  }, [history])

  if (isLoading) {
    return (
      <Card>
        <CardHeader><CardTitle className="text-sm">Trend: {commodity}</CardTitle></CardHeader>
        <CardContent><div className="skeleton h-[200px] rounded-lg" /></CardContent>
      </Card>
    )
  }

  if (chartData.length < 2) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp size={16} className="text-emerald-500" />
          Price Trend: {commodity}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
              <XAxis
                dataKey="date"
                tickFormatter={(d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                stroke="var(--color-text-muted-foreground)"
                fontSize={12}
              />
              <YAxis
                stroke="var(--color-text-muted-foreground)"
                fontSize={12}
                tickFormatter={(v) => '\u20B9' + v}
              />
              <Tooltip
                contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px' }}
                labelFormatter={(d) => new Date(d).toLocaleDateString('en-IN')}
                formatter={(value: number) => ['\u20B9' + value, 'Modal Price']}
              />
              <Legend />
              <Line type="monotone" dataKey="price" stroke="var(--color-primary)" strokeWidth={2.5} dot={false} name="Modal Price" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}