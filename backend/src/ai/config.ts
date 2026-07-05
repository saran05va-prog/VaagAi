import path from 'path'

export const aiConfig = {
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    embeddingModel: process.env.GROQ_EMBEDDING_MODEL || 'nomic-embed-text-v1',
    maxTokens: parseInt(process.env.GROQ_MAX_TOKENS || '2048', 10),
    temperature: parseFloat(process.env.GROQ_TEMPERATURE || '0.3'),
    baseUrl: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  },

  embedding: {
    provider: process.env.EMBEDDING_PROVIDER || 'groq',
    dimension: parseInt(process.env.EMBEDDING_DIMENSION || '768', 10),
    batchSize: parseInt(process.env.EMBEDDING_BATCH_SIZE || '10', 10),
  },

  vector: {
    provider: process.env.VECTOR_PROVIDER || 'memory',
    chunkSize: parseInt(process.env.CHUNK_SIZE || '600', 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '100', 10),
    topK: parseInt(process.env.RETRIEVAL_TOP_K || '10', 10),
    minScore: parseFloat(process.env.RETRIEVAL_MIN_SCORE || '0.5'),
  },

  cag: {
    ttl: {
      faq: parseInt(process.env.CACHE_TTL_FAQ || '86400', 10),
      api: parseInt(process.env.CACHE_TTL_API || '21600', 10),
      weather: parseInt(process.env.CACHE_TTL_WEATHER || '3600', 10),
      market: parseInt(process.env.CACHE_TTL_MARKET || '86400', 10),
    },
    maxEntries: parseInt(process.env.CACHE_MAX_ENTRIES || '500', 10),
  },

  memory: {
    maxMessages: parseInt(process.env.MEMORY_MAX_MESSAGES || '50', 10),
    maxHistory: parseInt(process.env.MEMORY_MAX_HISTORY || '20', 10),
  },

  pipeline: {
    minConfidence: parseFloat(process.env.PIPELINE_MIN_CONFIDENCE || '0.7'),
    minEvidence: parseFloat(process.env.PIPELINE_MIN_EVIDENCE || '0.6'),
    enableStreaming: process.env.ENABLE_STREAMING !== 'false',
    enableCAG: process.env.ENABLE_CAG !== 'false',
    enableRAG: process.env.ENABLE_RAG !== 'false',
  },

  security: {
    maxInputLength: parseInt(process.env.MAX_INPUT_LENGTH || '2000', 10),
    blockedPatterns: [
      /ignore previous instructions/i,
      /system prompt/i,
      /you are (an? )?ai/i,
      /forget everything/i,
      /new instructions/i,
    ],
  },

  prompts: {
    main: process.env.AI_SYSTEM_PROMPT || `You are VAAGAI, an expert AI farming assistant for Indian farmers. You ONLY answer questions related to agriculture, farming, crops, soil, weather, pests, diseases, irrigation, fertilizers, market prices, and government farming schemes. If asked about anything outside agriculture, politely respond that you can only assist with agricultural and farming topics. Keep responses concise, practical, and actionable. When recommending treatments, prefer locally available and affordable options. You can execute farm actions when requested.`,
    phases: {
      intent: 'Analyzing your query...',
      tools: 'Running analysis...',
      knowledge: 'Searching knowledge base...',
      response: 'Generating response...',
      done: 'Done.',
    },
    fallback: 'I encountered an error processing your query. Please try rephrasing your farming question.',
  },

  knowledge: {
    seedPath: path.join(__dirname, '..', 'knowledge', 'seed-data.json'),
    maxDocumentsPerCollection: parseInt(process.env.MAX_DOCS_PER_COLLECTION || '1000', 10),
  },

  logging: {
    level: process.env.AI_LOG_LEVEL || 'info',
    logToolCalls: process.env.LOG_TOOL_CALLS !== 'false',
    logRetrieval: process.env.LOG_RETRIEVAL !== 'false',
    logCost: process.env.LOG_COST !== 'false',
  },
}
