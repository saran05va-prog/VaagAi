import { Router, Response } from 'express'
import axios from 'axios'
import config from '../../config'

const router = Router()

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8001'

interface AskRequestBody {
  question: string
}

interface AgentRequestBody {
  question: string
  session_id?: string
}

interface RAGResponse {
  answer: string
  citations: Array<{
    source: string
    content: string
    score: number
  }>
  question: string
  tool_used: string
}

interface AgentResponse {
  answer: string
  tool_used: string
  sources: Array<{
    content: string
  }>
}

interface RAGError {
  detail: string
}

// POST /api/ask - Proxy to Python RAG service (Phase 1)
router.post('/ask', async (req, res: Response): Promise<void> => {
  try {
    const { question } = req.body as AskRequestBody

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' })
      return
    }

    if (question.length > 1000) {
      res.status(400).json({ error: 'Question too long (max 1000 characters)' })
      return
    }

    const response = await axios.post<RAGResponse>(
      `${RAG_SERVICE_URL}/ask`,
      { question },
      {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    res.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'RAG service is unavailable. Please ensure the Python RAG service is running on port 8001.'
        })
        return
      }
      if (error.response) {
        res.status(error.response.status).json(error.response.data)
        return
      }
    }
    console.error('RAG proxy error:', error)
    res.status(500).json({ error: 'Failed to process question' })
  }
})

// POST /api/ask/agent - Proxy to agent endpoint (Phase 2)
router.post('/agent', async (req, res: Response): Promise<void> => {
  try {
    const { question, session_id } = req.body as AgentRequestBody

    if (!question || typeof question !== 'string') {
      res.status(400).json({ error: 'Question is required' })
      return
    }

    if (question.length > 1000) {
      res.status(400).json({ error: 'Question too long (max 1000 characters)' })
      return
    }

    const response = await axios.post<AgentResponse>(
      `${RAG_SERVICE_URL}/agent/ask`,
      { question, session_id: session_id || 'default' },
      {
        timeout: 60000, // Longer timeout for agent
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    res.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        res.status(503).json({
          error: 'RAG service is unavailable. Please ensure the Python RAG service is running on port 8001.'
        })
        return
      }
      if (error.response) {
        res.status(error.response.status).json(error.response.data)
        return
      }
    }
    console.error('Agent proxy error:', error)
    res.status(500).json({ error: 'Failed to process agent question' })
  }
})

// GET /api/ask/health - Check RAG service health
router.get('/health', async (req, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${RAG_SERVICE_URL}/health`, {
      timeout: 5000,
    })
    res.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      res.status(503).json({
        status: 'error',
        message: 'RAG service is unavailable',
      })
      return
    }
    res.status(500).json({ error: 'Failed to check RAG service health' })
  }
})

// GET /api/ask/documents/count - Get document count
router.get('/documents/count', async (req, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${RAG_SERVICE_URL}/documents/count`, {
      timeout: 5000,
    })
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get document count' })
  }
})

// POST /api/ask/feedback - Submit feedback
interface FeedbackRequestBody {
  question: string
  answer: string
  tool_used: string
  rating: number
  session_id?: string
}

router.post('/feedback', async (req, res: Response): Promise<void> => {
  try {
    const { question, answer, tool_used, rating, session_id } = req.body as FeedbackRequestBody

    if (rating === undefined || ![0, 1].includes(rating)) {
      res.status(400).json({ error: 'Rating must be 0 (thumbs down) or 1 (thumbs up)' })
      return
    }

    const response = await axios.post(
      `${RAG_SERVICE_URL}/feedback`,
      { question, answer, tool_used, rating, session_id: session_id || 'default' },
      {
        timeout: 10000,
        headers: { 'Content-Type': 'application/json' },
      }
    )

    res.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === 'ECONNREFUSED') {
      res.status(503).json({ error: 'RAG service unavailable' })
      return
    }
    console.error('Feedback error:', error)
    res.status(500).json({ error: 'Failed to submit feedback' })
  }
})

// GET /api/ask/feedback/summary - Get feedback summary
router.get('/feedback/summary', async (req, res: Response): Promise<void> => {
  try {
    const response = await axios.get(`${RAG_SERVICE_URL}/feedback/summary`, {
      timeout: 5000,
    })
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to get feedback summary' })
  }
})

export default router