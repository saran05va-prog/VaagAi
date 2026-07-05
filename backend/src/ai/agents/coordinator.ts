import type { Agent, AgentInput, AgentOutput, ValidationReport } from '../types'
import { detectIntent } from './intent'
import { groqProvider } from '../assistant/groq'
import { memoryService } from '../memory'
import { retrievalPipeline } from '../rag/retriever'
import { cagCache } from '../cag/cache'
import { toolRegistry } from '../tools/registry'
import { actionRegistry } from '../actions/registry'
import { validate } from '../validators'
import { aiConfig } from '../config'

class IntentAgent implements Agent {
  name = 'intent-detector'
  description = 'Detects user intent and extracts entities from queries'

  async process(input: AgentInput): Promise<AgentOutput> {
    const result = await detectIntent(input.query)
    return {
      agent: this.name,
      type: 'intent',
      data: result,
      confidence: result.confidence,
    }
  }
}

class KnowledgeAgent implements Agent {
  name = 'knowledge-retriever'
  description = 'Retrieves relevant knowledge from the agricultural knowledge base'

  async process(input: AgentInput): Promise<AgentOutput> {
    const { query, intent, context } = input
    const entityCrop = intent?.entities?.crop

    const cacheKey = `k:${query.toLowerCase().trim()}`
    const cached = cagCache.get(cacheKey)
    if (cached && cached.confidence >= 0.9) {
      return {
        agent: this.name,
        type: 'knowledge',
        data: { results: cached.data, cached: true, confidence: cached.confidence },
        confidence: cached.confidence,
      }
    }

    const results = await retrievalPipeline(query, {
      crop: entityCrop || context?.currentCrop,
    })

    cagCache.set(cacheKey, results, { confidence: results.length > 0 ? 0.85 : 0.1, collection: 'knowledge', query })

    return {
      agent: this.name,
      type: 'knowledge',
      data: { results, cached: false },
      confidence: results.length > 0 ? 0.85 : 0.1,
    }
  }
}

class ToolAgent implements Agent {
  name = 'tool-executor'
  description = 'Executes tools and actions based on user intent'

  async process(input: AgentInput): Promise<AgentOutput> {
    const { query, intent, context } = input
    const outputs: Record<string, unknown>[] = []
    const actionsToExecute: string[] = []

    if (intent?.tools) {
      for (const toolCall of intent.tools) {
        const result = await toolRegistry.execute(toolCall.name, toolCall.params, context || {})
        outputs.push({ tool: toolCall.name, result })
      }
    }

    if (intent?.actions) {
      for (const actionName of intent.actions) {
        const result = await actionRegistry.execute(actionName, {}, context || {})
        actionsToExecute.push(actionName)
        outputs.push({ action: actionName, result })
      }
    }

    if (intent?.action) {
      const result = await actionRegistry.execute(intent.action, intent.actionParams || {}, context || {})
      actionsToExecute.push(intent.action)
      outputs.push({ action: intent.action, result })
    }

    return {
      agent: this.name,
      type: 'tool',
      data: { outputs, actionsExecuted: actionsToExecute },
      confidence: outputs.length > 0 ? 1 : 0,
    }
  }
}

class GenerationAgent implements Agent {
  name = 'response-generator'
  description = 'Generates natural language responses using LLM'

  async process(input: AgentInput): Promise<AgentOutput> {
    const { query, intent, context } = input
    const messages = memoryService.getMessages(input.sessionId) || []

    const systemPrompt = aiConfig.prompts?.main || 'You are an agricultural AI assistant. Provide helpful, concise advice.'
    const llmMessages = [{ role: 'system' as const, content: systemPrompt }, ...messages.slice(-10), { role: 'user', content: query }]

    const response = await groqProvider.generate(llmMessages)

    return {
      agent: this.name,
      type: 'response',
      data: { content: response.content },
      confidence: 1,
      latency: 0,
    }
  }
}

class ValidationAgent implements Agent {
  name = 'response-validator'
  description = 'Validates AI responses for safety and accuracy'

  async process(input: AgentInput): Promise<AgentOutput> {
    const response = input.context?.lastResponse || ''
    const report: ValidationReport = await validate(response, input)
    return {
      agent: this.name,
      type: 'validation',
      data: report,
      confidence: report.isValid ? 1 : 0,
    }
  }
}

export class Coordinator {
  agents: Agent[] = []
  private intentAgent = new IntentAgent()
  private knowledgeAgent = new KnowledgeAgent()
  private toolAgent = new ToolAgent()
  private generationAgent = new GenerationAgent()
  private validationAgent = new ValidationAgent()

  constructor() {
    this.agents = [this.intentAgent, this.knowledgeAgent, this.toolAgent, this.generationAgent, this.validationAgent]
  }

  async process(input: AgentInput): Promise<{
    intent: AgentOutput
    knowledge: AgentOutput
    tool: AgentOutput
    response: AgentOutput
    validation: AgentOutput
  }> {
    const intent = await this.intentAgent.process(input)
    const knowledge = await this.knowledgeAgent.process({ ...input, intent: intent.data })
    const tool = await this.toolAgent.process({ ...input, intent: intent.data })
    const knowledgeContext = (knowledge.data as any)?.results || []
    const toolContext = (tool.data as any)?.outputs || []

    const response = await this.generationAgent.process({
      ...input,
      intent: intent.data,
      context: {
        ...input.context,
        knowledge: knowledgeContext,
        tools: toolContext,
      },
    })

    const validation = await this.validationAgent.process({
      ...input,
      intent: intent.data,
      context: { ...input.context, lastResponse: (response.data as any)?.content },
    })

    return { intent, knowledge, tool, response, validation }
  }

  async *processStream(input: AgentInput): AsyncGenerator<{ agent: string; type: string; data: unknown }> {
    yield { agent: 'coordinator', type: 'phase', data: { phase: 'intent', message: aiConfig.prompts?.phases?.intent || 'Analyzing your query...' } }
    const intent = await this.intentAgent.process(input)
    yield { agent: 'intent-detector', type: 'intent', data: intent.data }

    if ((intent.data as any)?.tools?.length || (intent.data as any)?.actions?.length) {
      yield { agent: 'coordinator', type: 'phase', data: { phase: 'tools', message: aiConfig.prompts?.phases?.tools || 'Running analysis...' } }
      const tool = await this.toolAgent.process({ ...input, intent: intent.data })
      yield { agent: 'tool-executor', type: 'tool', data: tool.data }
    }

    yield { agent: 'coordinator', type: 'phase', data: { phase: 'knowledge', message: aiConfig.prompts?.phases?.knowledge || 'Searching knowledge base...' } }
    const knowledge = await this.knowledgeAgent.process({ ...input, intent: intent.data })
    yield { agent: 'knowledge-retriever', type: 'knowledge', data: knowledge.data }

    yield { agent: 'coordinator', type: 'phase', data: { phase: 'response', message: aiConfig.prompts?.phases?.response || 'Generating response...' } }
    const response = await this.generationAgent.process({
      ...input,
      intent: intent.data,
      context: { ...input.context, knowledge: (knowledge.data as any)?.results || [], tools: [] },
    })
    yield { agent: 'response-generator', type: 'response', data: response.data }

    const validation = await this.validationAgent.process({
      ...input,
      intent: intent.data,
      context: { ...input.context, lastResponse: (response.data as any)?.content },
    })
    yield { agent: 'response-validator', type: 'validation', data: validation.data }
    yield { agent: 'coordinator', type: 'phase', data: { phase: 'done', message: aiConfig.prompts?.phases?.done || 'Done.' } }
  }
}

export const coordinator = new Coordinator()
