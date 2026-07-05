import type { Chunk, ChunkMetadata, Collection, SearchResult, RetrievalRequest, RetrievalResponse } from '../types'
import { aiConfig } from '../config'

export interface VectorStore {
  name: string
  insertChunks(chunks: Chunk[]): Promise<void>
  search(request: RetrievalRequest): Promise<RetrievalResponse>
  deleteCollection(collection: Collection): Promise<void>
  getCollectionStats(): Promise<{ name: Collection; count: number }[]>
  health(): Promise<boolean>
}

const CHUNK_META_KEYS: (keyof ChunkMetadata)[] = ['title', 'crop', 'country', 'state', 'language', 'source', 'collection']

export class InMemoryVectorStore implements VectorStore {
  readonly name = 'in-memory'
  private collections: Map<Collection, { chunks: Chunk[]; index: Map<string, Set<number>> }> = new Map()

  constructor() {
    for (const coll of this.collectionsList()) {
      this.collections.set(coll, { chunks: [], index: new Map() })
    }
  }

  async insertChunks(chunks: Chunk[]): Promise<void> {
    for (const chunk of chunks) {
      const coll = chunk.metadata.collection
      if (!this.collections.has(coll)) {
        this.collections.set(coll, { chunks: [], index: new Map() })
      }
      const store = this.collections.get(coll)!
      const idx = store.chunks.length
      store.chunks.push(chunk)

      const words = chunk.content.toLowerCase().split(/\W+/).filter(Boolean)
      for (const word of words) {
        if (!store.index.has(word)) store.index.set(word, new Set())
        store.index.get(word)!.add(idx)
      }
    }
  }

  async search(request: RetrievalRequest): Promise<RetrievalResponse> {
    const start = Date.now()
    const topK = request.topK || aiConfig.vector.topK
    const collections = request.collections || this.collectionsList()
    const query = request.query.toLowerCase()
    const queryWords = query.split(/\W+/).filter(Boolean)

    const scored: { chunk: Chunk; score: number }[] = []

    for (const coll of collections) {
      const store = this.collections.get(coll)
      if (!store) continue

      for (let i = 0; i < store.chunks.length; i++) {
        const chunk = store.chunks[i]
        const content = chunk.content.toLowerCase()

        if (!this.matchesFilter(chunk.metadata, request.filters)) continue

        let score = 0
        let matchCount = 0

        for (const word of queryWords) {
          if (content.includes(word)) {
            score += 1
            matchCount++
          }
          if (store.index.get(word)?.has(i)) {
            score += 0.5
          }
        }

        if (matchCount > 0) {
          const normalizedScore = score / (queryWords.length * 1.5)
          if (normalizedScore >= request.minScore || 0) {
            scored.push({ chunk, score: normalizedScore })
          }
        }
      }
    }

    scored.sort((a, b) => b.score - a.score)
    const top = scored.slice(0, topK)

    return {
      results: top.map(r => ({ ...r, retrievalMethod: 'keyword' as const })),
      totalFound: scored.length,
      latency: Date.now() - start,
      cacheHit: false,
    }
  }

  async deleteCollection(collection: Collection): Promise<void> {
    this.collections.set(collection, { chunks: [], index: new Map() })
  }

  async getCollectionStats(): Promise<{ name: Collection; count: number }[]> {
    return this.collectionsList().map(name => ({
      name,
      count: this.collections.get(name)?.chunks.length || 0,
    }))
  }

  async health(): Promise<boolean> { return true }

  private matchesFilter(meta: ChunkMetadata, filter?: Partial<ChunkMetadata>): boolean {
    if (!filter) return true
    for (const key of CHUNK_META_KEYS) {
      const val = filter[key]
      if (val !== undefined && meta[key] !== val) return false
    }
    return true
  }

  private collectionsList(): Collection[] {
    return ['crop_guides', 'soil_management', 'fertilizer', 'disease', 'government_schemes', 'weather_guides', 'market_reports', 'economics', 'faq', 'policies', 'best_practices']
  }
}

let _instance: VectorStore | null = null

export async function getVectorStore(): Promise<VectorStore> {
  if (_instance) return _instance
  const provider = aiConfig.vector.provider
  switch (provider) {
    case 'chroma':
      throw new Error('ChromaDB not configured. Falling back to in-memory.')
    case 'pinecone':
      throw new Error('Pinecone not configured. Falling back to in-memory.')
    case 'qdrant':
      throw new Error('Qdrant not configured. Falling back to in-memory.')
    case 'memory':
    default:
      _instance = new InMemoryVectorStore()
      return _instance
  }
}
