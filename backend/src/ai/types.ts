/**
 * AI Copilot Type System
 * Foundation types for the entire AI pipeline
 */

// ─── Intent Detection ────────────────────────────────────────────

export type Intent =
  | 'GENERAL_AGRI'
  | 'CROP_SELECTION'
  | 'FERTILIZER'
  | 'DISEASE'
  | 'PEST'
  | 'SOIL'
  | 'WEATHER'
  | 'IRRIGATION'
  | 'MARKET_PRICE'
  | 'GOVERNMENT_SCHEME'
  | 'ECONOMICS'
  | 'FARM_ANALYSIS'
  | 'FIELD_DATA'
  | 'ACTION'
  | 'WEBSITE_NAVIGATION'
  | 'SMALL_TALK'
  | 'UNKNOWN'

export interface IntentResult {
  intent: Intent
  confidence: number
  entities: Record<string, string>
  reasoning: string
}

// ─── Knowledge & RAG ─────────────────────────────────────────────

export type Collection =
  | 'crop_guides' | 'soil_management' | 'fertilizer' | 'disease'
  | 'government_schemes' | 'weather_guides' | 'market_reports'
  | 'economics' | 'faq' | 'policies' | 'best_practices'

export interface KnowledgeDocument {
  id: string
  title: string
  source: string
  country: string
  state: string
  crop: string
  language: string
  tags: string[]
  content: string
  embedding?: number[]
  updatedAt: string
}

export interface Chunk {
  id: string
  documentId: string
  content: string
  metadata: ChunkMetadata
  embedding?: number[]
}

export interface ChunkMetadata {
  title: string
  source: string
  country: string
  state: string
  crop: string
  language: string
  tags: string[]
  collection: Collection
  chunkIndex: number
}

export interface SearchResult {
  chunk: Chunk
  score: number
  retrievalMethod: 'semantic' | 'keyword' | 'hybrid'
}

export interface RetrievalRequest {
  query: string
  collections?: Collection[]
  filters?: Partial<ChunkMetadata>
  topK?: number
  minScore?: number
}

export interface RetrievalResponse {
  results: SearchResult[]
  totalFound: number
  latency: number
  cacheHit: boolean
}

// ─── CAG (Cache) ─────────────────────────────────────────────────

export interface CacheEntry<T = unknown> {
  key: string
  value: T
  createdAt: number
  expiresAt: number
  hitCount: number
  ttl: number
}

export type CacheTTL = '1h' | '6h' | '24h' | number

// ─── Memory ──────────────────────────────────────────────────────

export interface ConversationMessage {
  id: string
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string
  timestamp: number
  metadata?: {
    intent?: Intent
    toolsUsed?: string[]
    actionsExecuted?: string[]
    citations?: Citation[]
    confidence?: number
    tokensUsed?: number
    latency?: number
  }
}

export interface FarmContext {
  farmName: string
  location: string
  soilType: string
  crops: { name: string; stage: string; health: number }[]
  farmSize: number
  recentDisease?: string
  weather?: { condition: string; temperature: number }
  preferredLanguage: string
}

export interface SessionMemory {
  sessionId: string
  userId?: string
  messages: ConversationMessage[]
  farmContext: FarmContext | null
  currentPage: string
  currentAction: string | null
  createdAt: number
  lastActivity: number
}

// ─── Tools ───────────────────────────────────────────────────────

export interface ToolSchema {
  name: string
  description: string
  parameters: Record<string, {
    type: 'string' | 'number' | 'boolean' | 'array' | 'object'
    description: string
    required: boolean
    enum?: string[]
    default?: unknown
  }>
}

export interface ToolDefinition extends ToolSchema {
  handler: (params: Record<string, unknown>, context: ToolContext) => Promise<ToolResult>
  timeout: number
  retries: number
}

export interface ToolContext {
  farmContext: FarmContext | null
  sessionMemory: SessionMemory | null
  userId?: string
}

export interface ToolResult {
  success: boolean
  data: unknown
  error?: string
  latency: number
}

export interface ToolCall {
  id: string
  name: string
  parameters: Record<string, unknown>
  result?: ToolResult
}

// ─── Actions ─────────────────────────────────────────────────────

export interface ActionDefinition {
  name: string
  description: string
  route?: string
  handler: (params: Record<string, unknown>, context: ToolContext) => Promise<ActionResult>
  permissions: string[]
  validation: (params: Record<string, unknown>) => boolean
}

export interface ActionResult {
  success: boolean
  action: string
  route?: string
  params?: Record<string, unknown>
  message: string
}

export interface ActionCall {
  id: string
  action: string
  params: Record<string, unknown>
  result?: ActionResult
}

// ─── LLM / Groq ──────────────────────────────────────────────────

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  tool_calls?: GroqToolCall[]
}

export interface GroqToolCall {
  id: string
  type: 'function'
  function: { name: string; arguments: string }
}

export interface LLMRequest {
  messages: LLMMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  tools?: ToolSchema[]
  stream?: boolean
  systemPrompt?: string
}

export interface LLMResponse {
  content: string
  toolCalls?: GroqToolCall[]
  tokensUsed: { prompt: number; completion: number; total: number }
  model: string
  latency: number
}

export interface StreamChunk {
  delta: string
  toolCalls?: GroqToolCall[]
  done: boolean
  metadata?: {
    intent?: Intent
    phase?: PipelinePhase
    citations?: Citation[]
    confidence?: number
    toolsUsed?: string[]
    actionsExecuted?: string[]
  }
}

// ─── Citations ───────────────────────────────────────────────────

export interface Citation {
  id: string
  title: string
  source: string
  snippet: string
  score: number
  collection: Collection
}

// ─── Pipeline ────────────────────────────────────────────────────

export type PipelinePhase =
  | 'thinking'
  | 'intent_detection'
  | 'retrieving_knowledge'
  | 'collecting_context'
  | 'executing_tools'
  | 'executing_action'
  | 'generating_answer'
  | 'validating'
  | 'completed'
  | 'error'

export interface PipelineRequest {
  message: string
  sessionId: string
  userId?: string
  farmContext?: FarmContext
  currentPage?: string
  history?: ConversationMessage[]
}

export interface PipelineResponse {
  answer: string
  intent: Intent
  citations: Citation[]
  confidence: number
  evidenceScore: number
  retrievalScore: number
  toolsUsed: string[]
  actionsExecuted: ActionCall[]
  phase: PipelinePhase
  latency: number
  tokensUsed: { prompt: number; completion: number; total: number }
  cacheHit: boolean
}

export interface PipelineProgress {
  phase: PipelinePhase
  message: string
  data?: unknown
  timestamp: number
}

// ─── Agents ──────────────────────────────────────────────────────

export type AgentType =
  | 'coordinator' | 'crop_expert' | 'disease_expert'
  | 'economics_expert' | 'weather_expert'
  | 'recommendation_agent' | 'action_agent' | 'validation_agent'

export interface Agent {
  type: AgentType
  canHandle: (intent: Intent) => boolean
  execute: (input: AgentInput) => Promise<AgentOutput>
}

export interface AgentInput {
  message: string
  intent: Intent
  entities: Record<string, string>
  context: ToolContext
  retrievalResults: SearchResult[]
  farmContext: FarmContext | null
}

export interface AgentOutput {
  response: string
  toolsUsed: string[]
  actionsExecuted: ActionCall[]
  citations: Citation[]
  confidence: number
}

// ─── Validation ──────────────────────────────────────────────────

export interface ValidationReport {
  isValid: boolean
  confidence: number
  evidenceScore: number
  retrievalScore: number
  issues: string[]
  suggestions: string[]
}

// ─── Logging ─────────────────────────────────────────────────────

export interface LogEntry {
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug'
  module: string
  message: string
  data?: Record<string, unknown>
  latency?: number
  tokensUsed?: number
  cost?: number
}
