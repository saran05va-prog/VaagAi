import { useState, useRef, useEffect, useCallback } from 'react'
import { useLanguage } from '../contexts/LanguageContext'
import { useLocation } from 'react-router-dom'
import {
  Send, Bot, User, Loader2, Sparkles, Sprout, Thermometer, Droplets,
  Search, Bug, DollarSign, Leaf, ChevronRight, MessageSquare, Trash2
} from 'lucide-react'
interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface QuickAction {
  label: string
  icon: typeof Sprout
  prompt: string
}

const suggestions = [
  'Why are my rice leaves turning yellow?',
  'How much urea for 1 acre of wheat?',
  'How do I prevent leaf blight?',
]

export default function Assistant() {
  const { t } = useLanguage()
  const quickActions: QuickAction[] = [
    { label: t('assistant.cropPlanning'), icon: Sprout, prompt: 'What crops grow best in this season?' },
    { label: t('assistant.pestControl'), icon: Bug, prompt: 'How do I prevent pests in my farm?' },
    { label: t('assistant.irrigation'), icon: Droplets, prompt: 'What is the best irrigation schedule?' },
    { label: t('assistant.soilHealth'), icon: Leaf, prompt: 'How can I improve my soil quality?' },
    { label: t('assistant.weatherAssistant'), icon: Thermometer, prompt: 'How does weather affect my crops?' },
    { label: t('assistant.marketAssistant'), icon: DollarSign, prompt: 'What are the best crop prices right now?' },
  ]
  const location = useLocation()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('vaagai_chat_history')
    if (saved) { try { setMessages(JSON.parse(saved)) } catch { /* ignore */ } }
  }, [])

  useEffect(() => {
    localStorage.setItem('vaagai_chat_history', JSON.stringify(messages))
  }, [messages])

  useEffect(() => {
    const state = location.state as { context?: string }
    if (state?.context) setInput(state.context)
  }, [location.state])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const clearHistory = () => {
    setMessages([])
    localStorage.removeItem('vaagai_chat_history')
  }

  const sendMessage = async (text?: string) => {
    const messageText = text || input
    if (!messageText.trim() || loading) return

    const userMessage: Message = { role: 'user', content: messageText }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
      const res = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          device_id: 'guest',
        }),
      })
      if (!res.ok) throw new Error('Failed to get response')
      const data = await res.json()
      const reply = data.reply || data.response || 'No response'
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: getFallbackResponse(messageText) }])
    } finally {
      setLoading(false)
    }
  }

  const getFallbackResponse = (message: string): string => {
    const lower = message.toLowerCase()
    if (lower.includes('crop') || lower.includes('plant')) return 'For crop recommendations, I analyze soil type, climate, and market prices. Would you like me to suggest the best crops for your farm?'
    if (lower.includes('weather') || lower.includes('rain')) return 'I can help you track weather patterns. Check the Weather page for detailed forecasts.'
    if (lower.includes('price') || lower.includes('market')) return 'Visit the Market page to see current prices for your crops.'
    if (lower.includes('water') || lower.includes('irrigation')) return 'Proper irrigation is crucial for crop yield. I can help optimize your watering schedule.'
    if (lower.includes('fertilizer') || lower.includes('nutrient')) return 'Fertilizer requirements depend on soil test results and crop needs.'
    if (lower.includes('pest') || lower.includes('disease')) return 'For pest management, I recommend integrated pest management (IPM).'
    if (lower.includes('hello') || lower.includes('hi')) return "Hello! I'm your VAAGAI farming assistant. How can I help you today?"
    return "I'm your smart farming assistant. I can help with crop planning, weather, market prices, irrigation, and more. What would you like to know?"
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] max-w-4xl mx-auto page-container" style={{ paddingBottom: 0 }}>
      <div className="pb-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1 className="page-title flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--color-primary-light)' }}>
              <Sparkles size={18} style={{ color: 'var(--color-primary)' }} />
            </div>
            <span className="text-gradient">{t('assistant.title')}</span>
          </h1>
          <p className="page-subtitle">{t('assistant.subtitle')}</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="btn btn-ghost btn-sm"
            title={t('assistant.clearTitle')}
          >
            <Trash2 size={14} />
            {t('assistant.clear')}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 space-y-4" style={{ minHeight: 0 }}>
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-lg w-full px-4">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{
                background: 'linear-gradient(135deg, var(--color-primary-light), var(--color-accent-light))',
                boxShadow: '0 8px 24px rgba(45,122,45,0.12)',
              }}>
                <Bot size={40} style={{ color: 'var(--color-primary)' }} />
              </div>
              <h3 className="font-bold text-xl mb-1" style={{ fontFamily: 'Sora, sans-serif' }}>{t('assistant.greeting')}</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>{t('assistant.greetingSub')}</p>

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

        {messages.map((msg, i) => (
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

        {loading && (
          <div className="flex gap-3" style={{ animation: 'fadeUp 0.25s ease-out both' }}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary-light)' }}>
              <Bot size={20} style={{ color: 'var(--color-primary)' }} />
            </div>
            <div className="chat-bubble-assistant">
              <div className="loading-dots">
                <span /><span /><span />
              </div>
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
              placeholder={t('assistant.placeholder')}
              className="input flex-1"
              style={{ paddingLeft: '36px', borderRadius: 'var(--radius-lg)' }}
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn btn-primary"
            style={{ borderRadius: 'var(--radius-lg)', padding: '10px 20px' }}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {t('assistant.send')}
          </button>
        </form>
        <p className="text-[11px] mt-2 text-center" style={{ color: 'var(--color-text-muted)' }}>
          {t('assistant.pressEnter')}
        </p>
      </div>
    </div>
  )
}
