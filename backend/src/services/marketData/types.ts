/**
 * Shared types for the Market Price Intelligence module.
 * All ingestion clients normalize to RawMarketPrice before persistence.
 */

export interface RawMarketPrice {
  source: 'agmarknet' | 'enam'
  state: string
  district: string
  market: string
  commodity: string
  variety: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  arrivalDate: string // ISO date string (yyyy-mm-dd)
  fetchedAt: string // ISO timestamp
}

export type Confidence = 'high' | 'medium' | 'low'

export interface MarketDailyPrice {
  id: string
  state: string
  district: string
  market: string
  commodity: string
  modalPrice: number
  trend7d: number
  trend30d: number
  daysStale: number
  confidence: Confidence
  date: string
  updatedAt: string
}

export interface PriceHistoryPoint {
  date: string
  price: number
  daysStale: number
}

export interface NearbyMarket {
  state: string
  district: string
  market: string
  commodity: string
  modalPrice: number
  trend7d: number
  trend30d: number
  confidence: Confidence
  daysStale: number
  distanceKm: number
  date: string
}

export interface SyncResult {
  status: 'success' | 'failure' | 'partial'
  rowsFetched: number
  rowsAnomalous: number
  rowsAggregated: number
  errorMessage?: string
  durationMs: number
}

export interface DiscrepancyReport {
  commodity: string
  market: string
  state: string
  date: string
  agmarknetPrice: number | null
  enamPrice: number | null
  deviationPercent: number
}
