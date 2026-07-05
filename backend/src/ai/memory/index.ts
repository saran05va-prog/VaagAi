import type { ConversationMessage, FarmContext, SessionMemory } from '../types'
import { aiConfig } from '../config'

const sessions = new Map<string, SessionMemory>()

export class MemoryService {
  private sessions: Map<string, SessionMemory> = sessions

  async createSession(sessionId: string, userId?: string): Promise<SessionMemory> {
    const session: SessionMemory = {
      sessionId,
      userId,
      messages: [],
      farmContext: null,
      currentPage: '/farm',
      currentAction: null,
      createdAt: Date.now(),
      lastActivity: Date.now(),
    }
    this.sessions.set(sessionId, session)
    return session
  }

  async getSession(sessionId: string): Promise<SessionMemory | null> {
    return this.sessions.get(sessionId) || null
  }

  async addMessage(sessionId: string, message: ConversationMessage): Promise<void> {
    let session = await this.getSession(sessionId)
    if (!session) session = await this.createSession(sessionId)
    session.messages.push(message)
    session.lastActivity = Date.now()
    if (session.messages.length > aiConfig.memory.maxMessages) {
      session.messages = session.messages.slice(-aiConfig.memory.maxMessages)
    }
  }

  async getHistory(sessionId: string, count?: number): Promise<ConversationMessage[]> {
    const session = await this.getSession(sessionId)
    if (!session) return []
    const take = count || aiConfig.memory.maxHistory
    return session.messages.slice(-take)
  }

  async updateFarmContext(sessionId: string, context: Partial<FarmContext>): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return
    session.farmContext = { ...(session.farmContext || DEFAULT_FARM_CONTEXT), ...context }
    session.lastActivity = Date.now()
  }

  async getFarmContext(sessionId: string): Promise<FarmContext | null> {
    const session = await this.getSession(sessionId)
    return session?.farmContext || null
  }

  async updateCurrentPage(sessionId: string, page: string): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return
    session.currentPage = page
    session.lastActivity = Date.now()
  }

  async updateCurrentAction(sessionId: string, action: string | null): Promise<void> {
    const session = await this.getSession(sessionId)
    if (!session) return
    session.currentAction = action
    session.lastActivity = Date.now()
  }

  async getContextSummary(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId)
    if (!session) return ''
    const ctx = session.farmContext
    if (!ctx) return 'No farm context available.'
    return `Farm: ${ctx.farmName} | Location: ${ctx.location} | Soil: ${ctx.soilType} | Size: ${ctx.farmSize}ha | Crops: ${ctx.crops.map(c => `${c.name} (${c.stage})`).join(', ')} | Weather: ${ctx.weather?.condition || 'N/A'} | Language: ${ctx.preferredLanguage}`
  }

  async clearSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId)
  }

  async pruneOldSessions(maxAgeMs: number = 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now()
    let count = 0
    for (const [id, session] of this.sessions) {
      if (now - session.lastActivity > maxAgeMs) {
        this.sessions.delete(id)
        count++
      }
    }
    return count
  }

  getActiveSessionCount(): number {
    return this.sessions.size
  }
}

const DEFAULT_FARM_CONTEXT: FarmContext = {
  farmName: 'My Farm',
  location: 'India',
  soilType: 'loamy',
  crops: [],
  farmSize: 0,
  preferredLanguage: 'en',
}

export const memoryService = new MemoryService()
