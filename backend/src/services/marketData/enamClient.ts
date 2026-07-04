import axios from 'axios'
import type { RawMarketPrice } from './types'

const ENAM_BASE_URL = process.env.ENAM_API_URL || 'https://enam.gov.in/web-api-trade-listing'
const ENAM_ENABLED = process.env.ENAM_ENABLED === 'true'

/**
 * eNAM (National Agriculture Market) client — secondary cross-verification source.
 * Used especially for Tamil Nadu and other eNAM-enabled mandis.
 *
 * eNAM does not expose a stable public API key system like data.gov.in; the
 * web trade-listing endpoint is used where available. If ENAM_ENABLED is not
 * set or the request fails, the client returns an empty array (no fabrication).
 */
class EnamClient {
  isConfigured(): boolean {
    return ENAM_ENABLED
  }

  async fetchPrices(filters?: {
    state?: string
    commodity?: string
    limit?: number
  }): Promise<RawMarketPrice[]> {
    if (!this.isConfigured()) {
      return []
    }

    const params = new URLSearchParams({
      limit: String(filters?.limit ?? 500),
    })
    if (filters?.state) params.append('stateName', filters.state)
    if (filters?.commodity) params.append('commodityName', filters.commodity)

    try {
      const response = await axios.get(`${ENAM_BASE_URL}?${params.toString()}`, {
        timeout: 20000,
        headers: { Accept: 'application/json' },
      })

      const records: any[] = response.data?.data || response.data?.records || []
      const fetchedAt = new Date().toISOString()

      return records.map((r) => this.normalizeRecord(r, fetchedAt)).filter((p) => p.modalPrice > 0)
    } catch (error: any) {
      console.error('[EnamClient] Fetch failed:', error?.message || error)
      return []
    }
  }

  private normalizeRecord(record: any, fetchedAt: string): RawMarketPrice {
    const parsePrice = (val: any): number => {
      const n = parseFloat(String(val || '0').replace(/[^0-9.]/g, ''))
      return isNaN(n) ? 0 : n
    }

    const rawDate = record.tradeDate || record.arrival_date || record.tradedate
    let arrivalDate = new Date().toISOString().split('T')[0]
    if (rawDate) {
      const d = new Date(rawDate)
      if (!isNaN(d.getTime())) arrivalDate = d.toISOString().split('T')[0]
    }

    return {
      source: 'enam',
      state: (record.stateName || record.state || '').trim(),
      district: (record.districtName || record.district || '').trim(),
      market: (record.apmcName || record.market || record.apmc || '').trim(),
      commodity: (record.commodityName || record.commodity || '').trim(),
      variety: (record.variety || 'Standard').trim(),
      minPrice: parsePrice(record.minPrice),
      maxPrice: parsePrice(record.maxPrice),
      modalPrice: parsePrice(record.modalPrice || record.avgPrice),
      arrivalDate,
      fetchedAt,
    }
  }
}

export const enamClient = new EnamClient()
export default enamClient
