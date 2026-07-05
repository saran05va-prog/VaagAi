import { create } from 'zustand'

export interface CopilotMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  citations?: { title?: string; source?: string }[]
}

export interface CopilotState {
  messages: CopilotMessage[]
  sessionId: string | null
  isStreaming: boolean
  isOffline: boolean
  streamingContent: string
  phase: 'idle' | 'intent' | 'tools' | 'knowledge' | 'response' | 'done'
  phaseMessage: string
  addMessage: (msg: CopilotMessage) => void
  setStreaming: (v: boolean) => void
  setStreamingContent: (v: string) => void
  appendStreamingContent: (v: string) => void
  setPhase: (phase: CopilotState['phase'], message?: string) => void
  setSessionId: (id: string) => void
  setOffline: (v: boolean) => void
  clearMessages: () => void
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

export const useCopilotStore = create<CopilotState>((set, get) => ({
  messages: [],
  sessionId: null,
  isStreaming: false,
  isOffline: false,
  streamingContent: '',
  phase: 'idle',
  phaseMessage: '',

  addMessage: (msg) => set(s => ({ messages: [...s.messages, msg] })),

  setStreaming: (v) => set({ isStreaming: v }),

  setStreamingContent: (v) => set({ streamingContent: v }),

  appendStreamingContent: (v) => set(s => ({ streamingContent: s.streamingContent + v })),

  setPhase: (phase, message) => set({ phase, phaseMessage: message || '' }),

  setSessionId: (id) => set({ sessionId: id }),

  setOffline: (v) => set({ isOffline: v }),

  clearMessages: () => set({ messages: [], streamingContent: '', phase: 'idle', phaseMessage: '' }),
}))
