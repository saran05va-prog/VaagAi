import type { PipelineRequest, PipelineResponse, PipelineProgress, ValidationReport, AgentInput } from '../types'
import { coordinator } from '../agents/coordinator'
import { detectIntent } from '../agents/intent'
import { retrievalPipeline } from '../rag/retriever'
import { cagCache } from '../cag/cache'
import { groqProvider } from '../assistant/groq'
import { memoryService } from '../memory'
import { toolRegistry } from '../tools/registry'
import { actionRegistry } from '../actions/registry'
import { validate } from '../validators'
import { aiConfig } from '../config'

export async function* runPipeline(request: PipelineRequest): AsyncGenerator<PipelineProgress> {
  const { query, sessionId, userId, context, stream = false } = request

  const startTime = Date.now()

  yield {
    type: 'progress',
    phase: 'intent',
    message: aiConfig.prompts?.phases?.intent || 'Analyzing your query...',
    timestamp: Date.now(),
  }

  const intent = await detectIntent(query)
  yield { type: 'intent', data: intent, timestamp: Date.now() }

  const cacheKey = `p:${query.toLowerCase().trim()}`
  const cached = cagCache.get(cacheKey)
  if (cached && cached.confidence >= 0.9) {
    yield { type: 'progress', phase: 'response', message: aiConfig.prompts?.phases?.response || 'Generating response...', timestamp: Date.now() }
    const response: PipelineResponse = {
      query,
      answer: cached.data,
      confidence: cached.confidence,
      cached: true,
      citations: cached.metadata?.citations || [],
      sessionId,
      latency: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    }
    yield { type: 'result', data: response, timestamp: Date.now() }
    yield { type: 'progress', phase: 'done', message: aiConfig.prompts?.phases?.done || 'Done.', timestamp: Date.now() }
    return
  }

  const input: AgentInput = { query, sessionId, userId, context }

  for await (const chunk of coordinator.processStream(input)) {
    if (chunk.type === 'phase') {
      yield { type: 'progress', phase: chunk.data.phase, message: chunk.data.message, timestamp: Date.now() }
    } else if (chunk.type === 'intent') {
      yield { type: 'intent', data: chunk.data, timestamp: Date.now() }
    } else if (chunk.type === 'knowledge') {
      const knowledgeData = chunk.data as any
      if (knowledgeData.results) {
        yield { type: 'progress', phase: 'knowledge', message: `Found ${knowledgeData.results.length} relevant documents`, timestamp: Date.now() }
      }
      yield { type: 'knowledge', data: chunk.data, timestamp: Date.now() }
    } else if (chunk.type === 'response') {
      let answer = (chunk.data as any)?.content || ''
      if (!answer) {
        answer = aiConfig.prompts?.fallback || 'I encountered an error processing your query. Please try rephrasing.'
      }
      const response: PipelineResponse = {
        query,
        answer,
        confidence: intent.confidence,
        cached: false,
        citations: [],
        sessionId,
        latency: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      }
      memoryService.addMessage(sessionId, { role: 'user', content: query })
      memoryService.addMessage(sessionId, { role: 'assistant', content: answer })
      yield { type: 'result', data: response, timestamp: Date.now() }
    }
  }

  yield { type: 'progress', phase: 'done', message: aiConfig.prompts?.phases?.done || 'Done.', timestamp: Date.now() }
}

export async function* runStreamingPipeline(request: PipelineRequest): AsyncGenerator<PipelineProgress | string> {
  const { query, sessionId, userId, context } = request
  const startTime = Date.now()

  yield JSON.stringify({ type: 'phase', phase: 'intent', message: aiConfig.prompts?.phases?.intent || 'Analyzing your query...' })

  const intent = await detectIntent(query)

  const cacheKey = `p:${query.toLowerCase().trim()}`
  const cached = cagCache.get(cacheKey)
  if (cached && cached.confidence >= 0.9) {
    yield JSON.stringify({ type: 'phase', phase: 'response', message: 'Generating response...' })
    yield JSON.stringify({ type: 'token', data: cached.data })
    yield JSON.stringify({ type: 'done', cached: true })
    return
  }

  if (intent.tools && intent.tools.length > 0) {
    yield JSON.stringify({ type: 'phase', phase: 'tools', message: aiConfig.prompts?.phases?.tools || 'Running analysis...' })
    for (const toolCall of intent.tools) {
      const result = await toolRegistry.execute(toolCall.name, toolCall.params, context || {})
      yield JSON.stringify({ type: 'tool_result', tool: toolCall.name, success: result.success })
    }
  }

  if (intent.actions && intent.actions.length > 0) {
    for (const actionName of intent.actions) {
      const result = await actionRegistry.execute(actionName, {}, context || {})
      yield JSON.stringify({ type: 'action_result', action: actionName, success: result.success })
    }
  }

  yield JSON.stringify({ type: 'phase', phase: 'knowledge', message: aiConfig.prompts?.phases?.knowledge || 'Searching knowledge base...' })

  const knowledge = await retrievalPipeline(query, {
    crop: intent.entities?.crop || context?.currentCrop,
  })
  if (knowledge.length > 0) {
    yield JSON.stringify({ type: 'knowledge', count: knowledge.length })
  }

  yield JSON.stringify({ type: 'phase', phase: 'response', message: aiConfig.prompts?.phases?.response || 'Generating response...' })

  const messages = memoryService.getMessages(sessionId) || []
  const systemPrompt = aiConfig.prompts?.main || 'You are an agricultural AI assistant.'
  const llmMessages = [
    { role: 'system' as const, content: systemPrompt },
    ...messages.slice(-10),
    { role: 'user', content: query },
  ]

  const tools = toolRegistry.getSchemas()
  let fullContent = ''

  try {
    for await (const chunk of groqProvider.generateStream(llmMessages, tools.length > 0 ? tools : undefined)) {
      if (chunk.type === 'content' && chunk.data) {
        fullContent += chunk.data
        yield JSON.stringify({ type: 'token', data: chunk.data })
      } else if (chunk.type === 'tool_calls' && chunk.data) {
        yield JSON.stringify({ type: 'tool_calls', data: chunk.data })
      } else if (chunk.type === 'error') {
        yield JSON.stringify({ type: 'error', message: chunk.data })
      }
    }
  } catch (err) {
    fullContent = aiConfig.prompts?.fallback || 'I encountered an error. Please try again.'
    yield JSON.stringify({ type: 'token', data: fullContent })
  }

  if (fullContent) {
    memoryService.addMessage(sessionId, { role: 'user', content: query })
    memoryService.addMessage(sessionId, { role: 'assistant', content: fullContent })
    cagCache.set(cacheKey, fullContent, { confidence: 0.8, collection: 'general', query })
  }

  const report: ValidationReport = await validate(fullContent, { query, sessionId, userId, context })
  if (!report.isValid) {
    yield JSON.stringify({ type: 'warning', message: report.issues?.[0] || 'Response may need review.' })
  }

  const latency = Date.now() - startTime
  yield JSON.stringify({ type: 'latency', data: `${latency}ms` })
  yield JSON.stringify({ type: 'done' })
}
