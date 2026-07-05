import type { CacheEntry, CacheTTL, RetrievalResponse, SearchResult } from '../types'
import { aiConfig } from '../config'

interface CachePayload {
  answer: string
  citations: SearchResult[]
  retrieval?: RetrievalResponse
}

export class CAGCache {
  private store: Map<string, CacheEntry<CachePayload>> = new Map()
  private maxEntries: number

  constructor() {
    this.maxEntries = aiConfig.cag.maxEntries
  }

  private resolveTTL(ttl: CacheTTL): number {
    if (typeof ttl === 'number') return ttl * 1000
    const map: Record<string, number> = { '1h': 3600, '6h': 21600, '24h': 86400 }
    return (map[ttl] || 3600) * 1000
  }

  private makeKey(query: string, filters?: string): string {
    return `${query.toLowerCase().trim()}|${filters || ''}`
  }

  get(query: string, filters?: string): CachePayload | null {
    const key = this.makeKey(query, filters)
    const entry = this.store.get(key)
    if (!entry) return null
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key)
      return null
    }
    entry.hitCount++
    return entry.value
  }

  set(query: string, value: CachePayload, ttl: CacheTTL = '24h', filters?: string): void {
    if (this.store.size >= this.maxEntries) {
      const oldest = this.store.entries().next().value
      if (oldest) this.store.delete(oldest[0])
    }

    const key = this.makeKey(query, filters)
    const ttlMs = this.resolveTTL(ttl)

    this.store.set(key, {
      key,
      value,
      createdAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
      hitCount: 0,
      ttl: ttlMs,
    })
  }

  getStats(): { size: number; hitRate: number; entries: { key: string; age: number; hits: number }[] } {
    const entries = Array.from(this.store.entries()).map(([key, entry]) => ({
      key,
      age: Math.floor((Date.now() - entry.createdAt) / 1000),
      hits: entry.hitCount,
    }))
    const totalHits = entries.reduce((a, e) => a + e.hits, 0)
    return { size: this.store.size, hitRate: entries.length > 0 ? totalHits / (totalHits + this.store.size) : 0, entries }
  }

  invalidate(pattern?: string): number {
    if (!pattern) {
      const count = this.store.size
      this.store.clear()
      return count
    }
    let count = 0
    for (const key of this.store.keys()) {
      if (key.includes(pattern)) {
        this.store.delete(key)
        count++
      }
    }
    return count
  }

  clear(): void {
    this.store.clear()
  }

  async checkCache(query: string, filters?: string): Promise<{ hit: boolean; payload: CachePayload | null; confidence: number }> {
    const cached = this.get(query, filters)
    if (!cached) return { hit: false, payload: null, confidence: 0 }
    return { hit: true, payload: cached, confidence: 0.9 }
  }

  async storeWithTTL(query: string, payload: CachePayload, ttl: CacheTTL = '24h', filters?: string): Promise<void> {
    this.set(query, payload, ttl, filters)
  }
}

export const cagCache = new CAGCache()
