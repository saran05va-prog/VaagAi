import { aiConfig } from '../config'
import type { LLMMessage, LLMRequest, LLMResponse, GroqToolCall, StreamChunk, ToolSchema } from '../types'

interface GroqCompletionChunk {
  choices?: {
    delta?: { content?: string; tool_calls?: { index: number; id: string; type: 'function'; function: { name: string; arguments: string } }[] }
    finish_reason?: string | null
  }[]
  usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }
  model?: string
}

export class GroqProvider {
  private baseUrl: string
  private apiKey: string
  private model: string

  constructor() {
    this.baseUrl = aiConfig.groq.baseUrl
    this.apiKey = aiConfig.groq.apiKey
    this.model = aiConfig.groq.model
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const start = Date.now()
    const body = {
      model: request.model || this.model,
      messages: this.buildMessages(request),
      temperature: request.temperature ?? aiConfig.groq.temperature,
      max_tokens: request.maxTokens || aiConfig.groq.maxTokens,
      stream: false,
      tools: request.tools?.map(t => ({ type: 'function' as const, function: { name: t.name, description: t.description, parameters: { type: 'object', properties: this.buildParameters(t), required: Object.entries(t.parameters).filter(([_, v]) => v.required).map(([k]) => k) } } })),
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error')
      throw new Error(`Groq API error (${res.status}): ${err}`)
    }

    const data = await res.json()
    const choice = data.choices?.[0]
    const latency = Date.now() - start

    return {
      content: choice?.message?.content || '',
      toolCalls: choice?.message?.tool_calls?.map((tc: any) => ({
        id: tc.id,
        type: 'function' as const,
        function: { name: tc.function.name, arguments: tc.function.arguments },
      })) || undefined,
      tokensUsed: {
        prompt: data.usage?.prompt_tokens || 0,
        completion: data.usage?.completion_tokens || 0,
        total: data.usage?.total_tokens || 0,
      },
      model: data.model || this.model,
      latency,
    }
  }

  async *generateStream(request: LLMRequest): AsyncGenerator<StreamChunk> {
    const body = {
      model: request.model || this.model,
      messages: this.buildMessages(request),
      temperature: request.temperature ?? aiConfig.groq.temperature,
      max_tokens: request.maxTokens || aiConfig.groq.maxTokens,
      stream: true,
      tools: request.tools?.map(t => ({ type: 'function' as const, function: { name: t.name, description: t.description, parameters: { type: 'object', properties: this.buildParameters(t), required: Object.entries(t.parameters).filter(([_, v]) => v.required).map(([k]) => k) } } })),
    }

    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text().catch(() => 'Unknown error')
      yield { delta: '', done: false }
      throw new Error(`Groq streaming error (${res.status}): ${err}`)
    }

    const reader = res.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data: ')) continue
        const json = trimmed.slice(6)
        if (json === '[DONE]') continue

        try {
          const chunk: GroqCompletionChunk = JSON.parse(json)
          const delta = chunk.choices?.[0]?.delta
          const finish = chunk.choices?.[0]?.finish_reason

          if (delta?.content) {
            yield { delta: delta.content, done: false }
          }

          if (delta?.tool_calls) {
            yield {
              delta: '',
              toolCalls: delta.tool_calls.map(tc => ({
                id: tc.id,
                type: 'function' as const,
                function: { name: tc.function.name, arguments: '' },
              })),
              done: false,
            }
          }

          if (finish === 'stop') break
        } catch {
          // Skip malformed chunks
        }
      }
    }

    yield { delta: '', done: true }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model: aiConfig.groq.embeddingModel,
        input: text,
      }),
    })

    if (!res.ok) throw new Error(`Embedding API error: ${res.status}`)
    const data = await res.json()
    return data.data?.[0]?.embedding || []
  }

  private buildMessages(request: LLMRequest): { role: string; content: string; tool_call_id?: string }[] {
    const msgs: { role: string; content: string; tool_call_id?: string }[] = []
    if (request.systemPrompt) msgs.push({ role: 'system', content: request.systemPrompt })
    for (const m of request.messages) {
      msgs.push({ role: m.role, content: m.content, tool_call_id: m.tool_call_id })
    }
    return msgs
  }

  private buildParameters(tool: ToolSchema): Record<string, unknown> {
    const props: Record<string, unknown> = {}
    for (const [key, param] of Object.entries(tool.parameters)) {
      const p: Record<string, unknown> = { type: param.type, description: param.description }
      if (param.enum) p['enum'] = param.enum
      if (param.default !== undefined) p['default'] = param.default
      props[key] = p
    }
    return props
  }
}

export const groqProvider = new GroqProvider()
