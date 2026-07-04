import prisma from '../database'
import redisService from '../cache'
import agmarknetClient from './agmarknetClient'
import enamClient from './enamClient'
import marketPriceValidator from './marketPriceValidator'
import type { RawMarketPrice, SyncResult, Confidence } from './types'

const STALE_DAYS_THRESHOLD = 3

/**
 * Orchestrates the daily market data sync pipeline:
 *   1. Fetch raw prices from Agmarknet (+ eNAM where available)
 *   2. Flag anomalies against 7-day rolling median
 *   3. Persist raw rows (immutable audit trail)
 *   4. Recompute MarketPriceDaily aggregates (trend + confidence + staleness)
 *   5. Invalidate relevant Redis cache keys
 *
 * On any failure the pipeline surfaces the error — it NEVER fabricates data.
 */
class MarketSyncService {
  /**
   * Run a full sync. Returns a summary for logging to sync_logs.
   */
  async runSync(filters?: {
    state?: string
    commodity?: string
  }): Promise<SyncResult> {
    const startedAt = Date.now()
    let rowsFetched = 0
    let rowsAnomalous = 0
    let rowsAggregated = 0

    try {
      // ── Step 1: Fetch raw prices ──────────────────────────────
      const agmarknetPrices = await agmarknetClient.fetchPrices({
        state: filters?.state,
        commodity: filters?.commodity,
        limit: 5000,
      })

      const enamPrices = enamClient.isConfigured()
        ? await enamClient.fetchPrices({
            state: filters?.state,
            commodity: filters?.commodity,
            limit: 1000,
          })
        : []

      const allPrices = [...agmarknetPrices, ...enamPrices]
      rowsFetched = allPrices.length

      if (allPrices.length === 0) {
        const result: SyncResult = {
          status: 'partial',
          rowsFetched: 0,
          rowsAnomalous: 0,
          rowsAggregated: 0,
          errorMessage: 'No prices fetched — API unavailable or unconfigured',
          durationMs: Date.now() - startedAt,
        }
        await this.logSync(result)
        return result
      }

      // ── Step 2: Flag anomalies ────────────────────────────────
      const flagged = await marketPriceValidator.flagAnomalies(allPrices)
      rowsAnomalous = flagged.filter((f) => f.isAnomalous).length

      // ── Step 3: Persist raw rows ──────────────────────────────
      await this.persistRawRows(flagged)

      // ── Step 4: Recompute daily aggregates ────────────────────
      rowsAggregated = await this.recomputeDailyAggregates(allPrices)

      // ── Step 5: Invalidate cache ──────────────────────────────
      await redisService.delPattern('market:intel:*')

      const result: SyncResult = {
        status: 'success',
        rowsFetched,
        rowsAnomalous,
        rowsAggregated,
        durationMs: Date.now() - startedAt,
      }
      await this.logSync(result)
      console.log(`[MarketSync] Success: ${rowsFetched} fetched, ${rowsAnomalous} anomalous, ${rowsAggregated} aggregated in ${result.durationMs}ms`)
      return result
    } catch (error: any) {
      const result: SyncResult = {
        status: 'failure',
        rowsFetched,
        rowsAnomalous,
        rowsAggregated,
        errorMessage: error?.message || String(error),
        durationMs: Date.now() - startedAt,
      }
      await this.logSync(result)
      console.error('[MarketSync] Failure:', result.errorMessage)
      return result
    }
  }

  /**
   * Persist raw price rows. Each fetch is stored (never overwritten).
   * Anomalous rows are stored with isAnomalous = true so they remain in
   * the audit trail but are excluded from the clean view.
   */
  private async persistRawRows(
    flagged: { price: RawMarketPrice; isAnomalous: boolean }[],
  ): Promise<void> {
    // Batch insert in chunks to avoid overwhelming Postgres
    const CHUNK_SIZE = 200
    for (let i = 0; i < flagged.length; i += CHUNK_SIZE) {
      const chunk = flagged.slice(i, i + CHUNK_SIZE)
      await prisma.marketPriceRaw.createMany({
        data: chunk.map((f) => ({
          source: f.price.source,
          state: f.price.state,
          district: f.price.district,
          market: f.price.market,
          commodity: f.price.commodity,
          variety: f.price.variety || null,
          minPrice: f.price.minPrice,
          maxPrice: f.price.maxPrice,
          modalPrice: f.price.modalPrice,
          arrivalDate: new Date(f.price.arrivalDate),
          fetchedAt: new Date(f.price.fetchedAt),
          isAnomalous: f.isAnomalous,
        })),
        skipDuplicates: true,
      })
    }
  }

  /**
   * Recompute MarketPriceDaily for each unique (commodity, market, date)
   * present in the current fetch. Computes trend7d, trend30d, daysStale,
   * and confidence.
   */
  private async recomputeDailyAggregates(prices: RawMarketPrice[]): Promise<number> {
    // Get unique (state, district, market, commodity, date) keys
    const keys = new Set<string>()
    for (const p of prices) {
      keys.add(`${p.state}|${p.district}|${p.market}|${p.commodity}|${p.arrivalDate}`)
    }

    let aggregated = 0

    for (const key of keys) {
      const [state, district, market, commodity, dateStr] = key.split('|')
      const arrivalDate = new Date(dateStr)

      // Clean median modal price for this day (non-anomalous rows only)
      const cleanRows = await prisma.marketPriceRaw.findMany({
        where: {
          commodity: { equals: commodity, mode: 'insensitive' },
          market: { equals: market, mode: 'insensitive' },
          state: { equals: state, mode: 'insensitive' },
          arrivalDate,
          isAnomalous: false,
        },
        select: { modalPrice: true, source: true },
      })

      if (cleanRows.length === 0) continue

      const modalPrices = cleanRows.map((r) => Number(r.modalPrice)).sort((a, b) => a - b)
      const mid = Math.floor(modalPrices.length / 2)
      const modalPrice =
        modalPrices.length % 2 !== 0
          ? modalPrices[mid]
          : (modalPrices[mid - 1] + modalPrices[mid]) / 2

      // Trend vs 7 days ago
      const trend7d = await this.computeTrend(commodity, market, state, arrivalDate, 7)
      // Trend vs 30 days ago
      const trend30d = await this.computeTrend(commodity, market, state, arrivalDate, 30)

      // Staleness: days since the most recent clean entry for this market
      const daysStale = await this.computeStaleness(commodity, market, state, arrivalDate)

      // Confidence based on source agreement + staleness
      const sources = new Set(cleanRows.map((r) => r.source))
      const confidence = this.computeConfidence(sources.size, daysStale, cleanRows.length)

      // Upsert into MarketPriceDaily
      await prisma.marketPriceDaily.upsert({
        where: {
          state_district_market_commodity_date: {
            state,
            district,
            market,
            commodity,
            date: arrivalDate,
          },
        },
        create: {
          state,
          district,
          market,
          commodity,
          modalPrice,
          trend7d,
          trend30d,
          daysStale,
          confidence,
          date: arrivalDate,
        },
        update: {
          modalPrice,
          trend7d,
          trend30d,
          daysStale,
          confidence,
        },
      })
      aggregated++
    }

    return aggregated
  }

  /**
   * Compute percentage change vs N days ago for a (commodity, market, state).
   * Uses the clean median price from N days ago.
   */
  private async computeTrend(
    commodity: string,
    market: string,
    state: string,
    currentDate: Date,
    daysAgo: number,
  ): Promise<number> {
    const pastDate = new Date(currentDate)
    pastDate.setDate(pastDate.getDate() - daysAgo)

    // Look in a ±2 day window around the target date to handle weekend gaps
    const windowStart = new Date(pastDate)
    windowStart.setDate(windowStart.getDate() - 2)
    const windowEnd = new Date(pastDate)
    windowEnd.setDate(windowEnd.getDate() + 2)

    const pastRows = await prisma.marketPriceRaw.findMany({
      where: {
        commodity: { equals: commodity, mode: 'insensitive' },
        market: { equals: market, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
        arrivalDate: { gte: windowStart, lte: windowEnd },
        isAnomalous: false,
      },
      select: { modalPrice: true },
    })

    if (pastRows.length === 0) return 0

    const pastPrices = pastRows.map((r) => Number(r.modalPrice)).sort((a, b) => a - b)
    const mid = Math.floor(pastPrices.length / 2)
    const pastMedian =
      pastPrices.length % 2 !== 0 ? pastPrices[mid] : (pastPrices[mid - 1] + pastPrices[mid]) / 2

    if (pastMedian <= 0) return 0

    // We need the current clean median to compare — fetch it
    const currentRows = await prisma.marketPriceRaw.findMany({
      where: {
        commodity: { equals: commodity, mode: 'insensitive' },
        market: { equals: market, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
        arrivalDate: currentDate,
        isAnomalous: false,
      },
      select: { modalPrice: true },
    })

    if (currentRows.length === 0) return 0

    const currentPrices = currentRows.map((r) => Number(r.modalPrice)).sort((a, b) => a - b)
    const cmid = Math.floor(currentPrices.length / 2)
    const currentMedian =
      currentPrices.length % 2 !== 0 ? currentPrices[cmid] : (currentPrices[cmid - 1] + currentPrices[cmid]) / 2

    return Math.round(((currentMedian - pastMedian) / pastMedian) * 1000) / 10
  }

  /**
   * Compute days since the latest clean entry for this market.
   * If the latest entry IS the current date, staleness is 0.
   */
  private async computeStaleness(
    commodity: string,
    market: string,
    state: string,
    currentDate: Date,
  ): Promise<number> {
    const latest = await prisma.marketPriceRaw.findFirst({
      where: {
        commodity: { equals: commodity, mode: 'insensitive' },
        market: { equals: market, mode: 'insensitive' },
        state: { equals: state, mode: 'insensitive' },
        isAnomalous: false,
      },
      orderBy: { arrivalDate: 'desc' },
      select: { arrivalDate: true },
    })

    if (!latest) return STALE_DAYS_THRESHOLD + 1

    const diffMs = currentDate.getTime() - latest.arrivalDate.getTime()
    const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
    return Math.max(0, diffDays)
  }

  /**
   * Confidence heuristic:
   * - "high": both sources agree (or single source with multiple data points), fresh (<2 days stale)
   * - "medium": single source, 2-3 days stale, or limited data points
   * - "low": >3 days stale or very few data points
   */
  private computeConfidence(sourceCount: number, daysStale: number, dataPoints: number): Confidence {
    if (daysStale > STALE_DAYS_THRESHOLD) return 'low'
    if (sourceCount >= 2 && daysStale <= 1) return 'high'
    if (sourceCount >= 2 || (dataPoints >= 3 && daysStale <= 2)) return 'medium'
    if (dataPoints <= 1) return 'low'
    return 'medium'
  }

  private async logSync(result: SyncResult): Promise<void> {
    try {
      await prisma.syncLog.create({
        data: {
          jobName: 'market-sync',
          status: result.status,
          rowsFetched: result.rowsFetched,
          rowsAnomalous: result.rowsAnomalous,
          rowsAggregated: result.rowsAggregated,
          errorMessage: result.errorMessage || null,
          finishedAt: new Date(),
        },
      })
    } catch (err) {
      console.error('[MarketSync] Failed to write sync log:', err)
    }
  }
}

export const marketSyncService = new MarketSyncService()
export default marketSyncService
