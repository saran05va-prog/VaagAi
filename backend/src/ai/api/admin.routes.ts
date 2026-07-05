import { Router, Request, Response } from 'express'
import { memoryService } from '../memory'
import { cagCache } from '../cag/cache'
import { toolRegistry } from '../tools/registry'
import { actionRegistry } from '../actions/registry'
import { retriever } from '../rag/retriever'
import { coordinator } from '../agents/coordinator'
import { seedKnowledge } from '../knowledge/seed'
import { aiConfig } from '../config'

const router = Router()

function adminAuth(req: Request, res: Response, next: Function) {
  const apiKey = req.headers['x-api-key'] as string
  const validKey = process.env.ADMIN_API_KEY || 'vaagai-admin-key-2024'

  if (!apiKey || apiKey !== validKey) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing API key' })
    return
  }
  next()
}

router.use(adminAuth)

router.get('/agents', (_req: Request, res: Response) => {
  try {
    const agents = coordinator.agents.map(a => ({
      name: a.name,
      description: a.description,
    }))
    res.json({ agents })
  } catch (err) {
    console.error('Admin agents error:', err)
    res.status(500).json({ error: 'Failed to list agents' })
  }
})

router.get('/tools', (_req: Request, res: Response) => {
  try {
    res.json({ tools: toolRegistry.getAll(), actions: actionRegistry.getAll() })
  } catch (err) {
    console.error('Admin tools error:', err)
    res.status(500).json({ error: 'Failed to list tools' })
  }
})

router.post('/knowledge/reload', async (_req: Request, res: Response) => {
  try {
    const collection = retriever['store'] as any
    if (collection && typeof collection.clear === 'function') {
      await collection.clear()
    }
    retriever['collectionCache'] = new Map()
    retriever['documentCache'] = new Map()
    const docs = seedKnowledge()
    let count = 0
    for (const doc of docs) {
      await retriever.ingest(doc)
      count++
    }
    res.json({ success: true, count })
  } catch (err) {
    console.error('Admin knowledge reload error:', err)
    res.status(500).json({ error: 'Failed to reload knowledge' })
  }
})

router.get('/memory/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const messages = memoryService.getMessages(sessionId)
    const context = memoryService.getFarmContext(sessionId)
    res.json({ sessionId, messageCount: messages?.length || 0, messages, context })
  } catch (err) {
    console.error('Admin memory error:', err)
    res.status(500).json({ error: 'Failed to fetch memory' })
  }
})

router.get('/memory', (_req: Request, res: Response) => {
  try {
    const sessions = (memoryService as any).getAllSessions?.() || []
    const summary = sessions.map((s: any) => ({
      sessionId: s.id,
      messageCount: s.messages?.length || 0,
      lastActive: s.updatedAt || s.createdAt,
    }))
    res.json({ sessions: summary, total: summary.length })
  } catch (err) {
    console.error('Admin memory list error:', err)
    res.status(500).json({ error: 'Failed to list sessions' })
  }
})

router.get('/cache', (_req: Request, res: Response) => {
  try {
    const stats = cagCache.getStats()
    const entries = (cagCache as any).cache
      ? Array.from((cagCache as any).cache.entries()).map(([key, value]: [string, any]) => ({
          key,
          expiresAt: value.expiresAt,
          confidence: value.confidence,
          collection: value.metadata?.collection,
        }))
      : []
    res.json({ stats, entries, total: entries.length })
  } catch (err) {
    console.error('Admin cache error:', err)
    res.status(500).json({ error: 'Failed to list cache' })
  }
})

router.post('/cache/flush', (_req: Request, res: Response) => {
  try {
    cagCache.clear()
    res.json({ success: true })
  } catch (err) {
    console.error('Admin cache flush error:', err)
    res.status(500).json({ error: 'Failed to flush cache' })
  }
})

router.get('/config', (_req: Request, res: Response) => {
  try {
    const safeConfig = {
      groq: { model: aiConfig.groq.model, embeddingModel: aiConfig.groq.embeddingModel },
      rag: { chunkSize: aiConfig.rag.chunkSize, chunkOverlap: aiConfig.rag.chunkOverlap },
      cag: { defaultTtl: aiConfig.cag.defaultTtl, maxEntries: aiConfig.cag.maxEntries },
      memory: { maxMessages: aiConfig.memory.maxMessagesPerSession },
      pipeline: { maxToolsPerQuery: aiConfig.pipeline.maxToolsPerQuery },
      security: { maxResponseLength: aiConfig.security.maxResponseLength },
      logging: { level: aiConfig.logging.level },
    }
    res.json(safeConfig)
  } catch (err) {
    console.error('Admin config error:', err)
    res.status(500).json({ error: 'Failed to get config' })
  }
})

router.get('/health', (_req: Request, res: Response) => {
  try {
    const cacheStats = cagCache.getStats()
    res.json({
      status: 'ok',
      toolCount: toolRegistry.getAll().length,
      actionCount: actionRegistry.getAll().length,
      agentCount: coordinator.agents.length,
      cache: cacheStats,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('Admin health error:', err)
    res.status(500).json({ error: 'Health check failed' })
  }
})

export default router
