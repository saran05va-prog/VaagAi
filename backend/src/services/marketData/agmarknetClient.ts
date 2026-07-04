import axios from 'axios'
import config from '../../config'
import type { RawMarketPrice } from './types'

const AGMARKNET_RESOURCE_ID = config.agmarknet.resourceId || '9ef84268-d588-465a-a308-a864a43d0070'
const DATA_GOV_BASE = 'https://api.data.gov.in/resource'

/**
 * Agmarknet data.gov.in client.
 * Fetches daily mandi prices filterable by state, district, market, and commodity.
 * Uses AGMARKNET_API_KEY from env — never hardcode keys.
 */
class AgmarknetClient {
  private apiKey: string

  constructor() {
    this.apiKey = config.agmarknet.apiKey || process.env.AGMARKNET_API_KEY || ''
  }

  isConfigured(): boolean {
    return !!this.apiKey
  }

  /**
   * Fetch raw mandi prices from the Agmarknet data.gov.in resource API.
   * All filters are optional; omitting them returns the latest records.
   */
  async fetchPrices(filters?: {
    state?: string
    district?: string
    market?: string
    commodity?: string
    limit?: number
    offset?: number
  }): Promise<RawMarketPrice[]> {
    if (!this.isConfigured()) {
      console.warn('[AgmarknetClient] No API key configured — skipping fetch')
      return []
    }

    const params = new URLSearchParams({
      'api-key': this.apiKey,
      format: 'json',
      limit: String(filters?.limit ?? 1000),
      offset: String(filters?.offset ?? 0),
    })

    // data.gov.in supports server-side filters via the `filters` param (JSON object)
    const serverFilters: Record<string, string> = {}
    if (filters?.state) serverFilters['state'] = filters.state
    if (filters?.district) serverFilters['district'] = filters.district
    if (filters?.market) serverFilters['market'] = filters.market
    if (filters?.commodity) serverFilters['commodity'] = filters.commodity
    if (Object.keys(serverFilters).length > 0) {
      params.append('filters', JSON.stringify(serverFilters))
    }

    const url = `${DATA_GOV_BASE}/${AGMARKNET_RESOURCE_ID}?${params.toString()}`

    try {
      const response = await axios.get(url, {
        timeout: 20000,
        headers: { Accept: 'application/json' },
      })

      const records: any[] = response.data?.records || []
      const fetchedAt = new Date().toISOString()

      return records.map((r) => this.normalizeRecord(r, fetchedAt)).filter((p) => p.modalPrice > 0)
    } catch (error: any) {
      console.error('[AgmarknetClient] Fetch failed:', error?.message || error)
      // Do NOT fabricate data — return empty so the caller can surface staleness
      return []
    }
  }

  private normalizeRecord(record: any, fetchedAt: string): RawMarketPrice {
    const parsePrice = (val: any): number => {
      const n = parseFloat(String(val || '0').replace(/[^0-9.]/g, ''))
      return isNaN(n) ? 0 : n
    }

    const arrivalDate = this.normalizeDate(record.arrival_date || record.date)

    return {
      source: 'agmarknet',
      state: (record.state || record.state_name || '').trim(),
      district: (record.district || record.district_name || '').trim(),
      market: (record.market || record.market_name || '').trim(),
      commodity: (record.commodity || record.commodity_name || '').trim(),
      variety: (record.variety || 'Standard').trim(),
      minPrice: parsePrice(record.min_price),
      maxPrice: parsePrice(record.max_price),
      modalPrice: parsePrice(record.modal_price),
      arrivalDate,
      fetchedAt,
    }
  }

  private normalizeDate(raw: string): string {
    if (!raw) return new Date().toISOString().split('T')[0]
    // Agmarknet uses dd/mm/yyyy
    const dmy = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
    if (dmy) {
      return `${dmy[3]}-${dmy[2]}-${dmy[1]}`
    }
    // Already ISO or other parseable
    const d = new Date(raw)
    if (!isNaN(d.getTime())) {
      return d.toISOString().split('T')[0]
    }
    return new Date().toISOString().split('T')[0]
  }
}

export const agmarknetClient = new AgmarknetClient()
export default agmarknetClient
