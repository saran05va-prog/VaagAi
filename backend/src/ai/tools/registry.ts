import type { ToolDefinition, ToolContext, ToolResult } from '../types'

const tools = new Map<string, ToolDefinition>()

export class ToolRegistry {
  register(tool: ToolDefinition): void {
    if (tools.has(tool.name)) {
      throw new Error(`Tool "${tool.name}" is already registered`)
    }
    tools.set(tool.name, tool)
  }

  get(name: string): ToolDefinition | undefined {
    return tools.get(name)
  }

  getAll(): ToolDefinition[] {
    return Array.from(tools.values())
  }

  getSchemas() {
    return this.getAll().map(t => ({
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    }))
  }

  async execute(name: string, params: Record<string, unknown>, context: ToolContext): Promise<ToolResult> {
    const tool = tools.get(name)
    if (!tool) {
      return { success: false, data: null, error: `Tool "${name}" not found`, latency: 0 }
    }

    const start = Date.now()
    let lastError: Error | null = null

    for (let attempt = 0; attempt <= tool.retries; attempt++) {
      try {
        const result = await tool.handler(params, context)
        result.latency = Date.now() - start
        return result
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err))
        if (attempt < tool.retries) {
          await new Promise(r => setTimeout(r, 1000 * (attempt + 1)))
        }
      }
    }

    return {
      success: false,
      data: null,
      error: lastError?.message || 'Tool execution failed',
      latency: Date.now() - start,
    }
  }
}

export const toolRegistry = new ToolRegistry()
