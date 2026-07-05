import { Router, Request, Response } from 'express'
import { runPipeline, runStreamingPipeline } from '../pipelines/copilot'
import { memoryService } from '../memory'
import { seedKnowledge } from '../knowledge/seed'
import { retriever } from '../rag/retriever'
import { cagCache } from '../cag/cache'
import { toolRegistry } from '../tools/registry'
import { registerAllTools } from '../tools/definitions'
import { actionRegistry, registerAllActions } from '../actions/registry'
import { detectIntent } from '../agents/intent'

registerAllTools()
registerAllActions()

const router = Router()

router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, context } = req.body
    if (!message) {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    const sid = sessionId || `session:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`
    const response = { answer: '', confidence: 0, cached: false, citations: [], sessionId: sid, latency: 0, timestamp: '' }

    for await (const progress of runPipeline({ query: message, sessionId: sid, userId: req.body.userId, context })) {
      if (progress.type === 'result' && progress.data) {
        response.answer = progress.data.answer
        response.confidence = progress.data.confidence
        response.cached = progress.data.cached
        response.citations = progress.data.citations
        response.latency = progress.data.latency
        response.timestamp = progress.data.timestamp
      }
    }

    res.json(response)
  } catch (err) {
    console.error('Copilot chat error:', err)
    res.status(500).json({ error: 'Failed to process chat', answer: 'I encountered an error processing your request. Please try again.' })
  }
})

router.post('/chat/stream', async (req: Request, res: Response) => {
  try {
    const { message, sessionId, context } = req.body
    if (!message) {
      res.status(400).json({ error: 'Message is required' })
      return
    }

    const sid = sessionId || `session:${Date.now()}:${Math.random().toString(36).slice(2, 9)}`

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    for await (const chunk of runStreamingPipeline({ query: message, sessionId: sid, userId: req.body.userId, context, stream: true })) {
      if (typeof chunk === 'string') {
        res.write(`data: ${chunk}\n\n`)
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'session', sessionId: sid })}\n\n`)
    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('Copilot stream error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream failed' })
    } else {
      res.write(`data: ${JSON.stringify({ type: 'error', message: 'Stream failed' })}\n\n`)
      res.write('data: [DONE]\n\n')
      res.end()
    }
  }
})

router.post('/intent', async (req: Request, res: Response) => {
  try {
    const { query } = req.body
    if (!query) {
      res.status(400).json({ error: 'Query is required' })
      return
    }
    const intent = await detectIntent(query)
    res.json(intent)
  } catch (err) {
    console.error('Intent detection error:', err)
    res.status(500).json({ error: 'Intent detection failed' })
  }
})

router.post('/search', async (req: Request, res: Response) => {
  try {
    const { query, crop, collection } = req.body
    if (!query) {
      res.status(400).json({ error: 'Query is required' })
      return
    }
    const results = await retriever.retrieve(query, {
      crop: crop || undefined,
      collection: collection || undefined,
    }, 10)
    res.json({ results })
  } catch (err) {
    console.error('Knowledge search error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

router.post('/session/clear', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body
    if (!sessionId) {
      res.status(400).json({ error: 'Session ID is required' })
      return
    }
    memoryService.clearSession(sessionId)
    res.json({ success: true })
  } catch (err) {
    console.error('Session clear error:', err)
    res.status(500).json({ error: 'Failed to clear session' })
  }
})

router.get('/session/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params
    const messages = memoryService.getMessages(sessionId)
    const context = memoryService.getFarmContext(sessionId)
    res.json({ messages, context })
  } catch (err) {
    console.error('Session fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch session' })
  }
})

router.post('/knowledge/seed', async (_req: Request, res: Response) => {
  try {
    const docs = seedKnowledge()
    let count = 0
    for (const doc of docs) {
      await retriever.ingest(doc)
      count++
    }
    res.json({ success: true, count, collections: [...new Set(docs.map(d => d.type))] })
  } catch (err) {
    console.error('Knowledge seed error:', err)
    res.status(500).json({ error: 'Failed to seed knowledge' })
  }
})

router.get('/tools', (_req: Request, res: Response) => {
  try {
    res.json({ tools: toolRegistry.getSchemas(), actions: actionRegistry.getAll().map(a => ({ name: a.name, description: a.description, permissions: a.permissions })) })
  } catch (err) {
    console.error('Tools list error:', err)
    res.status(500).json({ error: 'Failed to list tools' })
  }
})

router.post('/cache/clear', (_req: Request, res: Response) => {
  try {
    cagCache.clear()
    res.json({ success: true })
  } catch (err) {
    console.error('Cache clear error:', err)
    res.status(500).json({ error: 'Failed to clear cache' })
  }
})

router.get('/cache/stats', (_req: Request, res: Response) => {
  try {
    const stats = cagCache.getStats()
    res.json(stats)
  } catch (err) {
    console.error('Cache stats error:', err)
    res.status(500).json({ error: 'Failed to get cache stats' })
  }
})

export default router
