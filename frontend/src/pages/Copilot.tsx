import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useCopilotStore, type CopilotMessage } from '../stores/copilotStore'
import {
  Send, Bot, User, Loader2, Sparkles, Sprout, Thermometer, Droplets,
  Search, Bug, DollarSign, Leaf, MessageSquare, Trash2, WifiOff,
  CheckCircle2, BookOpen, Lightbulb, Brain, Globe,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'

const quickActions = [
  { label: 'Crop Planning', icon: Sprout, prompt: 'What crops grow best in this season?' },
  { label: 'Pest Control', icon: Bug, prompt: 'How do I prevent pests in my farm?' },
  { label: 'Irrigation', icon: Droplets, prompt: 'What is the best irrigation schedule?' },
  { label: 'Soil Health', icon: Leaf, prompt: 'How can I improve my soil quality?' },
  { label: 'Weather', icon: Thermometer, prompt: 'How does weather affect my crops?' },
  { label: 'Market Prices', icon: DollarSign, prompt: 'What are the best crop prices right now?' },
]

const suggestions = [
  'Why are my rice leaves turning yellow?',
  'How much urea for 1 acre of wheat?',
  'How do I prevent leaf blight?',
]

const phaseIcons: Record<string, typeof Bot> = {
  intent: Brain,
  tools: Lightbulb,
  knowledge: BookOpen,
  response: Globe,
}

export default function Copilot() {
  const { isGuest } = useAuth()
  const { openAuthModal } = useAuthModal()
  const {
    messages, isStreaming, isOffline, streamingContent, phase, phaseMessage,
    addMessage, setStreaming, setStreamingContent, appendStreamingContent,
    setPhase, setSessionId, setOffline, clearMessages,
  } = useCopilotStore()
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  const sendMessage = useCallback(async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || isStreaming) return
    if (isGuest) { openAuthModal('signup', 'Sign up to use the VaagAi Copilot'); return }

    setInput('')
    setStreamingContent('')

    const userMsg: CopilotMessage = { role: 'user', content: messageText, timestamp: Date.now() }
    addMessage(userMsg)
    setStreaming(true)
    setPhase('intent')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch(`${API_URL}/api/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
        signal: controller.signal,
      })

      if (!res.ok) {
        if (res.status === 0 || res.status >= 500) throw new Error('Backend offline')
        throw new Error(`HTTP ${res.status}`)
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
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') continue

          try {
            const data = JSON.parse(payload)
            switch (data.type) {
              case 'phase':
                setPhase(data.phase, data.message)
                break
              case 'token':
                appendStreamingContent(data.data)
                break
              case 'session':
                setSessionId(data.sessionId)
                break
              case 'tool_result':
                if (!data.success) appendStreamingContent(`\n\n⚠️ Tool "${data.tool}" encountered an issue.\n`)
                break
              case 'knowledge':
                setPhase('response', `Found relevant information`)
                break
              case 'warning':
                appendStreamingContent(`\n\n> ⚠️ ${data.message}`)
                break
              case 'error':
                appendStreamingContent(`\n\n⚠️ ${data.message}`)
                break
              case 'latency':
                break
              case 'done':
                break
            }
          } catch { /* skip malformed */ }
        }
      }

      setPhase('done')

      const finalContent = useCopilotStore.getState().streamingContent
      if (finalContent) {
        addMessage({ role: 'assistant', content: finalContent, timestamp: Date.now() })
        setStreamingContent('')
      } else {
        addMessage({
          role: 'assistant',
          content: "I'm not sure I can answer that. Try asking about crop management, pest control, or farming practices.",
          timestamp: Date.now(),
        })
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return
      setOffline(true)
      addMessage({
        role: 'assistant',
        content: getFallbackResponse(messageText),
        timestamp: Date.now(),
      })
    } finally {
      setStreaming(false)
      setPhase('idle')
      abortRef.current = null
    }
  }, [input, isStreaming, addMessage, setStreaming, setStreamingContent, appendStreamingContent, setPhase, setSessionId, setOffline])

  const stopGeneration = () => {
    abortRef.current?.abort()
    setStreaming(false)
    setPhase('idle')
    const content = streamingContent
    if (content) {
      addMessage({ role: 'assistant', content, timestamp: Date.now() })
      setStreamingContent('')
    }
  }

  const getFallbackResponse = (message: string): string => {
    const lower = message.toLowerCase()

    const agriKeywords = ['crop', 'plant', 'farm', 'soil', 'seed', 'rice', 'wheat', 'corn', 'tomato',
      'weather', 'rain', 'irrigation', 'water', 'fertilizer', 'nutrient', 'pest', 'disease',
      'weed', 'harvest', 'yield', 'market', 'price', 'organic', 'pesticide', 'fungicide',
      'prune', 'spray', 'grow', 'leaf', 'root', 'blight', 'rust', 'mildew', 'fungus',
      'urea', 'NPK', 'compost', 'manure', 'drip', 'sprinkler', 'field', 'plot', 'acre',
      'hectare', 'subsidy', 'scheme', 'govt', 'loan', 'insurance', 'tractor', 'drone',
      'sensor', 'greenhouse', 'polyhouse', 'mulch', 'seedling', 'transplant', 'tillage']

    const isAgri = agriKeywords.some((kw) => lower.includes(kw))

    if (!isAgri && !lower.match(/^(hello|hi|hey|thanks|thank you|good morning|good evening)/)) {
      return "I'm a farming assistant designed to help with agricultural topics only. I can answer questions about crops, pests, soil, weather, irrigation, fertilizers, market prices, and government schemes. Please ask something related to farming or agriculture."
    }

    if (lower.includes('crop') || lower.includes('plant')) return 'For crop recommendations, I analyze soil type, climate, and market prices. Would you like me to suggest the best crops for your farm?'
    if (lower.includes('weather') || lower.includes('rain')) return 'I can help you track weather patterns. Check the Weather page for detailed forecasts.'
    if (lower.includes('price') || lower.includes('market')) return 'Visit the Market page to see current prices for your crops.'
    if (lower.includes('water') || lower.includes('irrigation')) return 'Proper irrigation is crucial for crop yield. I can help optimize your watering schedule.'
    if (lower.includes('fertilizer') || lower.includes('nutrient')) return 'Fertilizer requirements depend on soil test results and crop needs.'
    if (lower.includes('pest') || lower.includes('disease')) return 'For pest management, I recommend integrated pest management (IPM) practices.'
    if (lower.includes('hello') || lower.includes('hi')) return "Hello! I'm your VAAGAI farming assistant. How can I help you today?"
    return "I'm your smart farming assistant. I can help with crop planning, weather, market prices, irrigation, and more. What would you like to know?"
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearHistory = () => {
    clearMessages()
  }

  const displayedMessages = messages
  const isShowingStream = isStreaming && streamingContent

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto page-container" style={{ paddingBottom: 0 }}>
      <div className="pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
              <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="text-gradient">VaagAi Copilot</span>
          </h1>
          <p className="page-subtitle">Enterprise-grade agricultural intelligence</p>
        </div>
        <div className="flex items-center gap-2">
          {isOffline && (
            <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: '#fef3c7', color: '#92400e' }}>
              <WifiOff size={12} /> Offline
            </span>
          )}
          <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <CheckCircle2 size={12} /> Online
          </span>
          {messages.length > 0 && (
            <button onClick={clearHistory} className="btn btn-ghost btn-sm" title="Clear history">
              <Trash2 size={14} /> Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && !isShowingStream && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-lg w-full px-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{
                background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent-light))',
                boxShadow: '0 8px 24px rgba(45,122,45,0.12)',
              }}>
                <Bot size={40} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3 className="font-bold text-xl mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>How can I help you farm better?</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
                Ask about crops, pests, weather, market prices, or anything farming-related.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
                {quickActions.map((qa, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qa.prompt)}
                    className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200"
                    style={{
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      animation: `fadeUp 0.35s ease-out both`,
                      animationDelay: `${i * 60}ms`,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.boxShadow = 'var(--shadow-primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-surface-2)' }}>
                      <qa.icon size={18} style={{ color: 'var(--color-primary)' }} />
                    </div>
                    <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>{qa.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="btn btn-ghost btn-sm animate-fade-up flex items-center gap-1"
                    style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', animationDelay: `${i * 100 + 360}ms` }}
                  >
                    <MessageSquare size={12} />
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {displayedMessages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            style={{ animation: 'fadeUp 0.25s ease-out both' }}
          >
            {msg.role === 'assistant' && (
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
                <Bot size={20} style={{ color: 'var(--color-primary)' }} />
              </div>
            )}
            <div className={msg.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
                <User size={20} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {isShowingStream && (
          <div className="flex gap-3" style={{ animation: 'fadeUp 0.25s ease-out both' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
              <Bot size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="chat-bubble-assistant">
              <div className="flex items-center gap-2 mb-2">
                {phase !== 'idle' && phase !== 'done' && (
                  <span className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full" style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-muted)' }}>
                    {React.createElement(phaseIcons[phase] || Bot, { size: 10 })}
                    {phaseMessage || phase}
                  </span>
                )}
                {phase === 'response' && (
                  <Loader2 size={12} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{streamingContent}</p>
              {phase === 'response' && streamingContent && (
                <span className="inline-block w-2 h-4 ml-0.5 animate-pulse" style={{ background: 'var(--color-primary)' }} />
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="pt-4 pb-2" style={{ borderTop: '1px solid var(--color-border)' }}>
        <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }} />
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about farming, crops, pests, or markets..."
              className="input flex-1"
              style={{ paddingLeft: '36px', borderRadius: 'var(--radius-lg)' }}
              disabled={isStreaming}
            />
          </div>
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-lg)', padding: '10px 20px' }}
          >
            {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Send
          </button>
          {isStreaming && (
            <button
              type="button"
              onClick={stopGeneration}
              className="btn btn-ghost"
              style={{ borderRadius: 'var(--radius-lg)', padding: '10px 16px' }}
            >
              Stop
            </button>
          )}
        </form>
        <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
          Powered by Groq AI — Enterprise Agricultural Intelligence
        </p>
      </div>
    </div>
  )
}

