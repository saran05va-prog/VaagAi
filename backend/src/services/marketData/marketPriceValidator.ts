import prisma from '../database'
import type { RawMarketPrice } from './types'

const ANOMALY_THRESHOLD = 0.4 // 40% deviation from 7-day rolling median
const ROLLING_WINDOW_DAYS = 7

/**
 * Anomaly detection & reliability layer.
 *
 * - Computes a 7-day rolling median per (commodity, market) from market_price_raw.
 * - Flags incoming prices that deviate >40% from that median as anomalous.
 * - Does NOT synthesize fake prices for missing days — the caller marks them stale.
 */
class MarketPriceValidator {
  /**
   * Compute the 7-day rolling median for a (commodity, market) pair,
   * using only non-anomalous rows from the last 7 days.
   */
  async getRollingMedian(
    commodity: string,
    market: string,
    arrivalDate: Date,
  ): Promise<number | null> {
    const since = new Date(arrivalDate)
    since.setDate(since.getDate() - ROLLING_WINDOW_DAYS)

    const rows = await prisma.marketPriceRaw.findMany({
      where: {
        commodity: { equals: commodity, mode: 'insensitive' },
        market: { equals: market, mode: 'insensitive' },
        arrivalDate: { gte: since, lt: arrivalDate },
        isAnomalous: false,
      },
      select: { modalPrice: true },
      orderBy: { arrivalDate: 'desc' },
    })

    if (rows.length === 0) return null

    const prices = rows.map((r) => Number(r.modalPrice)).sort((a, b) => a - b)
    return this.median(prices)
  }

  /**
   * Determine whether a raw price is anomalous relative to the rolling median.
   * Returns true if deviation exceeds the threshold.
   */
  isAnomalous(currentPrice: number, rollingMedian: number | null): boolean {
    if (rollingMedian === null || rollingMedian <= 0) return false
    const deviation = Math.abs(currentPrice - rollingMedian) / rollingMedian
    return deviation > ANOMALY_THRESHOLD
  }

  /**
   * Validate a batch of raw prices. Returns the same array with an
   * `isAnomalous` flag computed against the rolling median of each
   * (commodity, market) pair.
   *
   * To avoid N queries we group by (commodity, market) and compute one
   * median per group using existing DB rows.
   */
  async flagAnomalies(prices: RawMarketPrice[]): Promise<{ price: RawMarketPrice; isAnomalous: boolean }[]> {
    // Build a cache of rolling medians keyed by commodity|market
    const medianCache = new Map<string, number | null>()

    const results: { price: RawMarketPrice; isAnomalous: boolean }[] = []

    for (const price of prices) {
      const key = `${price.commodity.toLowerCase()}|${price.market.toLowerCase()}`
      let median = medianCache.get(key)
      if (median === undefined) {
        median = await this.getRollingMedian(price.commodity, price.market, new Date(price.arrivalDate))
        medianCache.set(key, median)
      }
      const anomalous = this.isAnomalous(price.modalPrice, median)
      results.push({ price, isAnomalous: anomalous })
    }

    return results
  }

  /**
   * Compute agreement score between Agmarknet and eNAM for the same
   * commodity/market/date. Returns the deviation percentage (0 = perfect agreement).
   */
  async computeSourceAgreement(
    commodity: string,
    market: string,
    date: Date,
  ): Promise<{ agmarknet: number | null; enam: number | null; deviationPercent: number }> {
    const rows = await prisma.marketPriceRaw.findMany({
      where: {
        commodity: { equals: commodity, mode: 'insensitive' },
        market: { equals: market, mode: 'insensitive' },
        arrivalDate: date,
        isAnomalous: false,
      },
      select: { source: true, modalPrice: true },
    })

    const agmarknetRows = rows.filter((r) => r.source === 'agmarknet')
    const enamRows = rows.filter((r) => r.source === 'enam')

    const agmarknet = agmarknetRows.length > 0
      ? this.median(agmarknetRows.map((r) => Number(r.modalPrice)))
      : null
    const enam = enamRows.length > 0
      ? this.median(enamRows.map((r) => Number(r.modalPrice)))
      : null

    let deviationPercent = 0
    if (agmarknet !== null && enam !== null && agmarknet > 0) {
      deviationPercent = (Math.abs(agmarknet - enam) / agmarknet) * 100
    }

    return { agmarknet, enam, deviationPercent }
  }

  /**
   * Find all commodity/market/date tuples where Agmarknet and eNAM disagree
   * beyond a threshold — surfaced to admins via the discrepancies endpoint.
   */
  async findDiscrepancies(deviationThreshold = 15, sinceDays = 7) {
    const since = new Date()
    since.setDate(since.getDate() - sinceDays)

    // Fetch recent non-anomalous rows grouped by source
    const rows = await prisma.marketPriceRaw.findMany({
      where: {
        arrivalDate: { gte: since },
        isAnomalous: false,
      },
      select: {
        source: true,
        commodity: true,
        market: true,
        state: true,
        arrivalDate: true,
        modalPrice: true,
      },
      orderBy: { arrivalDate: 'desc' },
    })

    // Group by commodity|market|date
    const groups = new Map<string, { commodity: string; market: string; state: string; date: Date; bySource: Map<string, number[]> }>()

    for (const r of rows) {
      const key = `${r.commodity}|${r.market}|${r.arrivalDate.toISOString().split('T')[0]}`
      let g = groups.get(key)
      if (!g) {
        g = { commodity: r.commodity, market: r.market, state: r.state, date: r.arrivalDate, bySource: new Map() }
        groups.set(key, g)
      }
      const arr = g.bySource.get(r.source) || []
      arr.push(Number(r.modalPrice))
      g.bySource.set(r.source, arr)
    }

    const discrepancies = []
    for (const g of groups.values()) {
      const sources = Array.from(g.bySource.keys())
      if (!sources.includes('agmarknet') || !sources.includes('enam')) continue

      const agmarknet = this.median(g.bySource.get('agmarknet')!)
      const enam = this.median(g.bySource.get('enam')!)
      if (agmarknet <= 0) continue

      const deviation = (Math.abs(agmarknet - enam) / agmarknet) * 100
      if (deviation >= deviationThreshold) {
        discrepancies.push({
          commodity: g.commodity,
          market: g.market,
          state: g.state,
          date: g.date.toISOString().split('T')[0],
          agmarknetPrice: Math.round(agmarknet),
          enamPrice: Math.round(enam),
          deviationPercent: Math.round(deviation * 10) / 10,
        })
      }
    }

    return discrepancies.sort((a, b) => b.deviationPercent - a.deviationPercent)
  }

  private median(values: number[]): number {
    if (values.length === 0) return 0
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }
}

export const marketPriceValidator = new MarketPriceValidator()
export default marketPriceValidator
