import type { Collection, Chunk, ChunkMetadata, SearchResult, RetrievalRequest, RetrievalResponse, KnowledgeDocument } from '../types'
import { getVectorStore } from '../vector/store'
import { aiConfig } from '../config'

function chunkText(text: string, chunkSize: number, overlap: number): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start += chunkSize - overlap
  }
  return chunks
}

function buildMetadata(doc: KnowledgeDocument, chunkIndex: number, chunkContent: string): ChunkMetadata {
  return {
    title: doc.title,
    source: doc.source,
    country: doc.country,
    state: doc.state,
    crop: doc.crop,
    language: doc.language,
    tags: doc.tags,
    collection: doc.tags[0] as Collection || 'faq',
    chunkIndex,
  }
}

export class Retriever {
  async ingestDocument(doc: KnowledgeDocument): Promise<number> {
    const store = await getVectorStore()
    const chunkSize = aiConfig.vector.chunkSize
    const overlap = aiConfig.vector.chunkOverlap
    const texts = chunkText(doc.content, chunkSize, overlap)

    const chunks: Chunk[] = texts.map((text, i) => ({
      id: `${doc.id}_chunk_${i}`,
      documentId: doc.id,
      content: text,
      metadata: buildMetadata(doc, i, text),
    }))

    await store.insertChunks(chunks)
    return chunks.length
  }

  async ingestDocuments(docs: KnowledgeDocument[]): Promise<number> {
    let total = 0
    for (const doc of docs) {
      total += await this.ingestDocument(doc)
    }
    return total
  }

  async search(request: RetrievalRequest): Promise<RetrievalResponse> {
    const store = await getVectorStore()
    return store.search(request)
  }

  async retrieve(query: string, filters?: RetrievalRequest['filters'], topK?: number): Promise<SearchResult[]> {
    const res = await this.search({
      query,
      filters,
      topK: topK || aiConfig.vector.topK,
      minScore: aiConfig.vector.minScore,
    })
    return res.results
  }

  async searchByCrop(crop: string, query: string): Promise<SearchResult[]> {
    return this.retrieve(query, { crop, country: 'India' })
  }

  async searchByCollection(collection: Collection, query: string): Promise<SearchResult[]> {
    const res = await this.search({ query, collections: [collection], topK: 20 })
    return res.results
  }
}

export const retriever = new Retriever()
