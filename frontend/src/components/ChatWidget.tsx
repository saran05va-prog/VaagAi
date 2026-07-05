import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2, Minus, Sparkles } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'
interface Message {
  role: 'user' | 'assistant'
  content: string
}

const agriKeywords = ['crop', 'plant', 'farm', 'soil', 'seed', 'rice', 'wheat', 'corn', 'tomato',
  'weather', 'rain', 'irrigation', 'water', 'fertilizer', 'nutrient', 'pest', 'disease',
  'weed', 'harvest', 'yield', 'market', 'price', 'organic', 'pesticide', 'fungicide',
  'prune', 'spray', 'grow', 'leaf', 'root', 'blight', 'rust', 'mildew', 'fungus',
  'urea', 'compost', 'manure', 'drip', 'sprinkler', 'field', 'plot', 'acre',
  'hectare', 'subsidy', 'scheme', 'loan', 'insurance', 'tractor', 'drone',
  'sensor', 'greenhouse', 'mulch', 'seedling', 'transplant', 'tillage']

function getAgriFallback(text: string): string {
  const lower = text.toLowerCase()
  if (!agriKeywords.some(kw => lower.includes(kw)) && !lower.match(/^(hello|hi|hey|thanks)/)) {
    return "I'm VaagAi, your farming assistant. I only answer agricultural questions — crops, pests, soil, weather, irrigation, fertilizers, and market prices. Please ask something farm-related."
  }
  if (lower.includes('crop') || lower.includes('plant')) return 'For crop recommendations, I analyze soil type, climate, and market prices.'
  if (lower.includes('weather') || lower.includes('rain')) return 'Check the Weather page for detailed forecasts in your area.'
  if (lower.includes('price') || lower.includes('market')) return 'Visit the Market page to see current prices for your crops.'
  if (lower.includes('water') || lower.includes('irrigation')) return 'Proper irrigation is crucial for crop yield. I can help optimize your schedule.'
  if (lower.includes('fertilizer') || lower.includes('nutrient')) return 'Fertilizer needs depend on soil test results and crop type.'
  if (lower.includes('pest') || lower.includes('disease')) return 'Use integrated pest management — remove affected parts, apply neem oil, and ensure airflow.'
  if (lower.includes('hello') || lower.includes('hi')) return "Hello! I'm VaagAi, your farming assistant. How can I help you today?"
  return "I'm VaagAi, your smart farming assistant. I can help with crops, pests, weather, market prices, and more."
}

export default function VaagAiChat() {
  const { t } = useLanguage()
  const { isGuest } = useAuth()
  const { openAuthModal } = useAuthModal()
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    if (isGuest) { openAuthModal('signup', 'Sign up to ask questions to VaagAi'); return }

    const text = input
    setMessages(prev => [...prev, { role: 'user', content: text }])
    setInput('')
    setLoading(true)
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002'
      const res = await fetch(`${API_URL}/api/copilot/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      const reply = data.answer || data.response || t('chatWidget.noResponse')
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: getAgriFallback(text) }])
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg transition-transform hover:scale-110 hover:shadow-xl active:scale-95"
        style={{
          background: 'linear-gradient(135deg, #2d7a2d, #1a4d1a)',
          boxShadow: '0 4px 20px rgba(45,122,45,0.4)',
        }}
      >
        <Sparkles size={22} className="text-white" />
      </button>
    )
  }

  return (
    <div
      className={`fixed z-50 ${minimized ? 'bottom-6 right-6' : 'bottom-6 right-6'}`}
      style={{ width: minimized ? 'auto' : '360px' }}
    >
      <div
        className="rounded-2xl shadow-2xl border overflow-hidden"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          height: minimized ? 'auto' : '520px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ background: 'linear-gradient(135deg, #2d7a2d, #1a4d1a)' }}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-white" />
            <span className="text-sm font-semibold text-white">VaagAi Assistant</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimized(!minimized)} className="p-1 hover:bg-white/10 rounded">
              <Minus size={16} className="text-white/80" />
            </button>
            <button onClick={() => { setOpen(false); setMinimized(false) }} className="p-1 hover:bg-white/10 rounded">
              <X size={16} className="text-white/80" />
            </button>
          </div>
        </div>

        {!minimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3" style={{ minHeight: 0 }}>
              {messages.length === 0 && (
                <div className="text-center py-6">
                  <Bot size={32} className="mx-auto mb-2" style={{ color: 'var(--color-primary)' }} />
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{t('chatWidget.placeholder')}</p>
                  <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                    {[t('chatWidget.questionLeaves'), t('chatWidget.questionUrea'), t('chatWidget.questionSoil')].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => { setInput(q); setTimeout(() => sendMessage(), 100) }}
                        className="px-2.5 py-1 text-xs rounded-full transition"
                        style={{ background: 'var(--color-surface-2)', color: 'var(--color-text-secondary)' }}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(16,185,129,0.1)' }}>
                      <Bot size={12} style={{ color: 'var(--color-primary)' }} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-1.5 rounded-xl text-sm ${
                      msg.role === 'user' ? 'text-white' : ''
                    }`}
                    style={{
                      background: msg.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface-2)',
                      color: msg.role === 'user' ? 'white' : 'var(--color-text)',
                    }}
                  >
                    {msg.content}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--color-primary)' }}>
                      <User size={12} className="text-white" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                    <Bot size={12} style={{ color: 'var(--color-primary)' }} />
                  </div>
                  <div className="px-3 py-1.5 rounded-xl" style={{ background: 'var(--color-surface-2)' }}>
                    <Loader2 size={14} className="animate-spin" style={{ color: 'var(--color-primary)' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <form onSubmit={(e) => { e.preventDefault(); sendMessage() }} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={t('chatWidget.inputPlaceholder')}
                  className="flex-1 px-3 py-1.5 text-sm rounded-xl border outline-none"
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface-2)', color: 'var(--color-text)' }}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-xl disabled:opacity-50 transition"
                  style={{ background: 'var(--color-primary)', color: 'white' }}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}