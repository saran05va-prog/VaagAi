import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import {
  Sprout, ChevronRight, Sparkles, Shield, TrendingUp, Droplets, CloudSun, BarChart3, Leaf,
  X, Menu, Check, Star, ChevronDown, ArrowUp, Heart, Bookmark, Edit2, Plus, Trash2, Play,
  ArrowRight, Moon, Sun, Quote, MessageCircle, Code2, Share2, Video, Zap, Clock, Users,
  Globe, Bot, BarChart4
} from 'lucide-react'
import HeroFarmBackground from '../components/HeroFarmBackground'

const navLinks = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How It Works' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'faq', label: 'FAQ' },
]

const features = [
  { icon: Bot, title: 'AI Crop Advisor', description: 'Personalized planting, irrigation, and harvest recommendations powered by machine learning models trained on millions of farm data points.', color: '#2d7a2d', bg: '#d6f0d6' },
  { icon: Globe, title: 'Weather Intelligence', description: 'Hyperlocal 7-day forecasts, frost alerts, and rainfall predictions to protect your crops before conditions change.', color: '#2563eb', bg: '#dbeafe' },
  { icon: BarChart4, title: 'Market Analytics', description: 'Real-time commodity prices, demand forecasting, and sell-time optimization to maximize your profit per harvest.', color: '#d97706', bg: '#fef3c7' },
  { icon: Droplets, title: 'Irrigation AI', description: 'Smart watering schedules that adapt to soil moisture, crop stage, and weather — cutting water usage by up to 35%.', color: '#0891b2', bg: '#cffafe' },
  { icon: Shield, title: 'Disease Detection', description: 'AI vision that spots diseases, pests, and nutrient deficiencies from photos — before they spread across your farm.', color: '#7c3aed', bg: '#ede9fe' },
  { icon: TrendingUp, title: 'Yield Forecasting', description: 'Predict your harvest yield with 94% accuracy using satellite imagery, soil data, and growth-stage modeling.', color: '#2d7a4d', bg: '#d6f0d6' },
]

const steps = [
  { number: '01', icon: Leaf, title: 'Connect Your Farm', description: 'Add your farm location, soil type, and crops. Takes 2 minutes.' },
  { number: '02', icon: Zap, title: 'Get AI Recommendations', description: 'Receive tailored daily advice on irrigation, fertilizing, pest control, and harvest timing.' },
  { number: '03', icon: BarChart4, title: 'Track & Optimize', description: 'Monitor growth, compare seasons, and make data-driven decisions that boost yield.' },
]

const demoItems = [
  { id: 1, title: 'Rice Field - Plot A', status: 'Growing', stage: 'Vegetative', health: 92 },
  { id: 2, title: 'Wheat Field - Plot B', status: 'Ready', stage: 'Harvest', health: 88 },
  { id: 3, title: 'Tomato Greenhouse', status: 'Growing', stage: 'Flowering', health: 95 },
  { id: 4, title: 'Corn Field - Plot C', status: 'Planned', stage: 'Preparation', health: 0 },
]

const testimonials = [
  { name: 'Rajesh Kumar', role: 'Rice Farmer', company: 'Green Fields Co.', avatar: 'RK', rating: 5, text: 'VaagAi transformed my farm. Yield increased by 40% in the first season. The AI insights are incredibly accurate.' },
  { name: 'Priya Sharma', role: 'Vegetable Grower', company: 'Fresh Harvest Farms', avatar: 'PS', rating: 5, text: 'The irrigation automation alone saved us 30% on water bills. The pest detection feature caught an outbreak early.' },
  { name: 'Amit Patel', role: 'Farm Manager', company: 'AgroTech Solutions', avatar: 'AP', rating: 5, text: 'Managing multiple farms has never been easier. The dashboard gives me a complete overview of all operations.' },
  { name: 'Sunita Verma', role: 'Organic Farmer', company: 'Nature\'s Bounty', avatar: 'SV', rating: 4, text: 'The market insights helped me time my sales perfectly. I got 20% better prices compared to last year.' },
]

const pricingPlans = [
  { name: 'Starter', price: 'Free', period: 'forever', description: 'Perfect for small farms getting started with AI.', features: ['1 farm profile', 'Basic crop recommendations', '3-day weather forecast', 'Community support'], cta: 'Get Started', popular: false },
  { name: 'Pro', price: '\u20b9399', period: '/month', description: 'For serious farmers who want full control and insights.', features: ['Up to 5 farms', 'Advanced AI recommendations', '15-day weather forecast', 'Market price alerts', 'Disease detection (50 scans/mo)', 'Email support'], cta: 'Start Free Trial', popular: true },
  { name: 'Enterprise', price: '\u20b9599', period: '/month', description: 'For large operations and farming cooperatives.', features: ['Unlimited farms', 'API access & integrations', '30-day weather forecast', 'Satellite imagery analysis', 'Unlimited disease scans', 'Dedicated account manager', 'Priority support'], cta: 'Contact Sales', popular: false },
]

const faqs = [
  { q: 'What is VaagAi and how does it work?', a: 'VaagAi is an AI-powered agricultural platform that provides smart crop recommendations, weather forecasts, market insights, and pest management tools. It analyzes your farm data to deliver personalized advice.' },
  { q: 'Is VaagAi suitable for small farms?', a: 'Absolutely! VaagAi is designed for farms of all sizes. Our Free plan is perfect for small farms, and you can upgrade as your operation grows.' },
  { q: 'How accurate are the AI predictions?', a: 'Our AI models achieve over 90% accuracy in crop recommendations and pest detection. We continuously improve our models with new data.' },
  { q: 'Do I need internet connectivity?', a: 'An internet connection is required for real-time features. However, you can download reports and insights for offline viewing.' },
  { q: 'What kind of support do you offer?', a: 'Free users get community support. Pro users get email support, and Enterprise customers get priority support with a dedicated account manager.' },
  { q: 'Can I cancel my subscription anytime?', a: 'Yes, you can cancel anytime. There are no long-term contracts. Your data remains accessible even after cancellation.' },
  { q: 'Is my farm data secure?', a: 'We take security seriously. All data is encrypted in transit and at rest. We never share your data with third parties without your consent.' },
  { q: 'How do I get started?', a: 'Simply create a free account, set up your farm profile, and start exploring AI-powered recommendations tailored to your farm.' },
]

function SectionLabel({ children, icon }: { children: React.ReactNode; icon?: any }) {
  const Icon = icon || Sparkles
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6" style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary-dark)' }}>
      <Icon size={14} /> {children}
    </div>
  )
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h2 className={`text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.08] ${className}`} style={{ fontFamily: 'Geist, Sora, sans-serif' }}>{children}</h2>
}

function SectionDesc({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{children}</p>
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5 justify-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} fill={i < rating ? '#eab308' : 'none'} color={i < rating ? '#eab308' : 'var(--color-border)'} />
      ))}
    </div>
  )
}

function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true })

  useEffect(() => {
    if (!isInView) return
    let start = 0
    const duration = 1500
    const step = Math.ceil(target / (duration / 16))
    const timer = setInterval(() => {
      start += step
      if (start >= target) { clearInterval(timer); setCount(target) }
      else setCount(start)
    }, 16)
    return () => clearInterval(timer)
  }, [isInView, target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

function GuardButton({ onClick, children, className = '' }: { onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button onClick={onClick} className={className}>{children}</button>
  )
}

// ---- NavBar ----
function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('')
  const navigate = useNavigate()
  const { isAuthenticated, isGuest, logout } = useAuth()
  const { openAuthModal } = useAuthModal()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px' }
    )
    document.querySelectorAll('section[id]').forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500`}
      style={{
        background: scrolled ? 'rgba(255,255,255,0.8)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid var(--color-border)' : '1px solid transparent',
      }}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
          <div className="flex items-center justify-center rounded-xl shadow-md" style={{ width: 38, height: 38, background: 'linear-gradient(135deg, #7bf1a8 0%, #2e7d32 52%, #11361a 100%)' }}>
            <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
              <path d="M32 50 L32 30" stroke="white" strokeWidth={3.5} strokeLinecap="round" />
              <path d="M32 34 C24 34 18 28 18 20 C26 20 32 26 32 34 Z" fill="white" />
              <path d="M32 30 C40 30 46 24 46 16 C38 16 32 22 32 30 Z" fill="white" />
              <circle cx="32" cy="14" r="3" fill="#aaffcc" />
              <circle cx="32" cy="14" r="1.5" fill="white" />
            </svg>
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif', color: scrolled ? 'var(--color-text)' : 'white' }}>
            Vaag<span style={{ color: scrolled ? 'var(--color-primary)' : '#7bf1a8' }}>Ai</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => scrollTo(link.id)}
              className="min-h-[44px] px-3 text-sm font-medium rounded-xl transition-all duration-200"
              style={{
                color: activeSection === link.id ? 'var(--color-primary)' : scrolled ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.85)',
                background: activeSection === link.id ? 'var(--color-primary-light)' : 'transparent',
              }}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-3">
          {isGuest ? (
            <button onClick={() => navigate('/signup')} className="min-h-[44px] px-5 text-sm font-semibold rounded-xl" style={{ background: 'white', color: 'var(--color-primary)', border: '1px solid var(--color-border)' }}>
              Sign Up Free
            </button>
          ) : isAuthenticated ? (
            <button onClick={logout} className="min-h-[44px] px-4 text-sm font-medium rounded-xl" style={{ color: scrolled ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.8)' }}>
              Log out
            </button>
          ) : (
            <>
              <button onClick={() => openAuthModal('login')} className="min-h-[44px] px-4 text-sm font-medium rounded-xl transition-colors" style={{ color: scrolled ? 'var(--color-text-secondary)' : 'rgba(255,255,255,0.85)' }}>
                Log in
              </button>
              <button onClick={() => openAuthModal('signup')} className="min-h-[44px] px-5 text-sm font-semibold rounded-xl gap-1.5 inline-flex items-center" style={{ background: scrolled ? 'var(--color-primary)' : 'rgba(255,255,255,0.15)', color: 'white', boxShadow: scrolled ? 'var(--shadow-primary)' : 'none', border: scrolled ? 'none' : '1px solid rgba(255,255,255,0.2)' }}>
                Get Started <ChevronRight size={15} />
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(true)}
          className="md:hidden min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl transition-colors"
          style={{ color: scrolled ? 'var(--color-text-secondary)' : 'white' }}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[280px] max-w-[85vw] flex flex-col"
              style={{ background: 'var(--color-surface)', borderLeft: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between px-4 h-16 shrink-0" style={{ borderBottom: '1px solid var(--color-border)' }}>
                <div className="flex items-center gap-2">
                  <div className="flex items-center justify-center rounded-lg shadow-sm" style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #7bf1a8 0%, #2e7d32 52%, #11361a 100%)' }}>
                    <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
                      <path d="M32 50 L32 30" stroke="white" strokeWidth={3.5} strokeLinecap="round" />
                      <path d="M32 34 C24 34 18 28 18 20 C26 20 32 26 32 34 Z" fill="white" />
                      <path d="M32 30 C40 30 46 24 46 16 C38 16 32 22 32 30 Z" fill="white" />
                      <circle cx="32" cy="14" r="3" fill="#aaffcc" />
                      <circle cx="32" cy="14" r="1.5" fill="white" />
                    </svg>
                  </div>
                  <span className="font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>Vaag<span style={{ color: '#7bf1a8' }}>Ai</span></span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg" style={{ color: 'var(--color-text-secondary)' }} aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navLinks.map((link) => (
                  <button key={link.id} onClick={() => scrollTo(link.id)}
                    className="w-full text-left min-h-[44px] px-3 rounded-xl text-sm font-medium transition-colors flex items-center"
                    style={{
                      color: activeSection === link.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                      background: activeSection === link.id ? 'var(--color-primary-light)' : 'transparent',
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </div>
              <div className="px-3 py-4 shrink-0 space-y-2" style={{ borderTop: '1px solid var(--color-border)' }}>
                {isGuest ? (
                  <button onClick={() => openAuthModal('signup')} className="w-full min-h-[44px] rounded-xl text-sm font-semibold" style={{ background: 'var(--color-primary)', color: 'white' }}>
                    Sign Up Free
                  </button>
                ) : isAuthenticated ? (
                  <button onClick={logout} className="w-full min-h-[44px] rounded-xl text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    Log out
                  </button>
                ) : (
                  <>
                    <button onClick={() => openAuthModal('login')} className="w-full min-h-[44px] rounded-xl text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                      Log in
                    </button>
                    <button onClick={() => navigate('/signup')} className="w-full min-h-[44px] rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-1.5" style={{ background: 'var(--color-primary)', color: 'white' }}>
                      Get Started <ChevronRight size={16} />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}

// ---- Hero ----
function HeroSection() {
  const navigate = useNavigate()
  const { enterGuestMode } = useAuth()
  const [charCount, setCharCount] = useState(0)
  const fullText = 'The Future of Farming is Intelligent'
  const [typingComplete, setTypingComplete] = useState(false)
  const [liveMetrics, setLiveMetrics] = useState({ yield: 0, water: 0, health: 0 })

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setCharCount(i + 1)
      i++
      if (i >= fullText.length) {
        clearInterval(interval)
        setTypingComplete(true)
      }
    }, 40)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const target = { yield: 40, water: -30, health: 92 }
    const duration = 1500
    const startTime = Date.now()
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setLiveMetrics({
        yield: Math.round(target.yield * progress),
        water: Math.round(target.water * progress),
        health: Math.round(16 + target.health * progress * 0.009),
      })
      if (progress >= 1) clearInterval(timer)
    }, 30)
    return () => clearInterval(timer)
  }, [])

  const handleWatchDemo = () => {
    enterGuestMode()
    navigate('/farm')
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <HeroFarmBackground />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-black/30 to-transparent z-[1]" />
      <div className="relative z-10 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="max-w-xl">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-6" style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.12)' }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
                  The Future of Farming is Here
                </div>
              </motion.div>
              <motion.h1
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[0.98]"
                style={{ fontFamily: 'Geist, Sora, sans-serif', color: 'white', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                {charCount <= 25 ? (
                  <>
                    {fullText.slice(0, charCount)}
                    {!typingComplete && <span className="animate-pulse" style={{ color: '#4ade80' }}>|</span>}
                  </>
                ) : (
                  <>
                    The Future of Farming is{' '}
                    <span style={{ color: '#4ade80' }}>Intelligent</span>
                    {!typingComplete && <span className="animate-pulse" style={{ color: '#4ade80' }}>|</span>}
                  </>
                )}
              </motion.h1>
              <motion.p
                className="mt-5 text-base sm:text-lg leading-relaxed max-w-lg"
                style={{ color: 'rgba(255,255,255,0.75)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                Every decision — from sowing to harvest — powered by AI, weather intelligence, satellite imagery, and predictive analytics.
              </motion.p>
              <motion.div
                className="mt-8 flex flex-col sm:flex-row gap-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <button onClick={() => navigate('/signup')} className="min-h-[48px] px-6 text-base font-semibold rounded-2xl gap-2 inline-flex items-center justify-center" style={{ background: '#2d7a2d', color: 'white', boxShadow: '0 4px 20px rgba(45,122,45,0.4)' }}>
                  Start Free <ChevronRight size={18} />
                </button>
                <button onClick={handleWatchDemo} className="min-h-[48px] px-6 text-base font-medium rounded-2xl gap-2 inline-flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', backdropFilter: 'blur(12px)' }}>
                  <Play size={18} /> Watch Demo
                </button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="hidden lg:block"
            >
              <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.12)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#4ade80' }} />
                  <span className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.85)' }}>Farm Overview — Live</span>
                  <span className="ml-auto flex items-center gap-1 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#4ade80' }} />
                    AI Monitoring
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[TrendingUp, Droplets, Leaf].map((Icon, i) => {
                    const colors = ['#4ade80', '#60a5fa', '#4ade80']
                    const labels = ['Yield', 'Water Usage', 'Crop Health']
                    const values = [liveMetrics.yield, liveMetrics.water, liveMetrics.health]
                    const units = ['%', '%', '%']
                    return (
                      <div key={i} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center mx-auto mb-1.5" style={{ background: i === 1 ? 'rgba(96,165,250,0.15)' : 'rgba(74,222,128,0.15)' }}>
                          <Icon size={14} color={colors[i]} />
                        </div>
                        <div className="text-lg font-extrabold" style={{ color: values[i] < 0 ? '#60a5fa' : 'rgba(255,255,255,0.95)' }}>
                          {values[i] > 0 ? '+' : ''}{values[i]}{units[i]}
                        </div>
                        <div className="text-[10px] font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{labels[i]}</div>
                      </div>
                    )
                  })}
                </div>
                <div className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  AI-powered insights for your farm · Updated in real-time
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ---- Trusted By / Logo Carousel ----
const logos = ['AgroTech', 'GreenFarm', 'HarvestInc', 'FarmTech', 'BioGrow', 'EcoFarm', 'SmartAgri', 'PureHarvest']

function TrustedBySection() {
  return (
    <section className="py-12 md:py-16" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <p className="text-center text-sm font-medium mb-8" style={{ color: 'var(--color-text-muted)' }}>
          Trusted by <strong style={{ color: 'var(--color-text)' }}><AnimatedCounter target={10000} />+</strong> farmers worldwide
        </p>
        <div className="relative overflow-hidden">
          <motion.div
            className="flex gap-16 items-center"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          >
            {[...logos, ...logos].map((name, i) => (
              <div key={i} className="flex-shrink-0 text-base font-bold tracking-wider transition-all duration-300 grayscale hover:grayscale-0" style={{ color: 'var(--color-text-muted)', opacity: 0.4 }}>
                {name}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ---- Stats Bar ----
function StatsBar() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const stats = [
    { icon: Users, value: 10000, label: 'Farmers', suffix: '+' },
    { icon: Leaf, value: 250000, label: 'Acres Managed', suffix: '+' },
    { icon: TrendingUp, value: 40, label: 'Avg. Yield Increase', suffix: '%' },
    { icon: Clock, value: 98, label: 'Uptime', suffix: '%' },
  ]

  return (
    <section className="py-12 md:py-16" style={{ background: 'var(--color-surface-2)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <div className="text-3xl md:text-4xl font-extrabold mb-1" style={{ fontFamily: 'Geist, Sora, sans-serif', color: 'var(--color-primary)' }}>
                {isInView ? <AnimatedCounter target={s.value} suffix={s.label === 'Uptime' ? '%' : ''} /> : '0'}
                {s.label !== 'Uptime' && <span>{s.label === 'Avg. Yield Increase' ? '%' : '+'}</span>}
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>{s.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---- Features ----
function FeatureCard({ icon: Icon, title, description, index, color, bg }: { icon: any; title: string; description: string; index: number; color: string; bg: string }) {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-50px' })

  return (
    <motion.div
      ref={ref}
      className="group relative rounded-2xl p-6 sm:p-7 transition-all duration-300 cursor-default"
      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
    >
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300" style={{ background: bg }}>
          <Icon size={20} color={color} />
        </div>
        <h3 className="text-base font-bold mb-2" style={{ fontFamily: 'Geist, Sora, sans-serif', color: 'var(--color-text)' }}>{title}</h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>
      </div>
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `linear-gradient(135deg, ${color}04, transparent 60%)` }} />
    </motion.div>
  )
}

function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="features" className="py-20 md:py-28 relative overflow-hidden" style={{ background: 'var(--color-surface)' }}>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] opacity-[0.03] pointer-events-none" style={{ background: 'radial-gradient(ellipse at center, var(--color-primary) 0%, transparent 70%)' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionLabel>Platform Features</SectionLabel>
          <SectionTitle>Everything You Need to Farm Smarter</SectionTitle>
          <SectionDesc>Six integrated AI modules that work together to optimize every aspect of your farm operation.</SectionDesc>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6">
          {features.map((f, i) => (
            <FeatureCard key={i} {...f} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ---- How It Works ----
function HowItWorksSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section id="how-it-works" className="py-20 md:py-28" style={{ background: 'var(--color-surface-2)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          className="max-w-2xl mx-auto text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionLabel icon={Zap}>Simple Setup</SectionLabel>
          <SectionTitle>Get Started in Under 3 Minutes</SectionTitle>
          <SectionDesc>No technical expertise required. Just connect your farm and let AI do the rest.</SectionDesc>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-10">
          {steps.map((step, i) => {
            const cardRef = useRef(null)
            const stepInView = useInView(cardRef, { once: true, margin: '-60px' })
            return (
              <motion.div
                key={i}
                ref={cardRef}
                className="relative rounded-2xl p-6 sm:p-8 text-center"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                initial={{ opacity: 0, y: 30 }}
                animate={stepInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--color-primary-light)' }}>
                  <step.icon size={28} style={{ color: 'var(--color-primary)' }} />
                </div>
                <span className="text-xs font-bold tracking-widest mb-2 block" style={{ color: 'var(--color-primary)' }}>{step.number}</span>
                <h3 className="text-lg font-bold mb-3" style={{ fontFamily: 'Geist, Sora, sans-serif', color: 'var(--color-text)' }}>{step.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>{step.description}</p>
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                    <ChevronRight size={20} style={{ color: 'var(--color-text-muted)' }} />
                  </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ---- Interactive Demo ----
function DemoSec() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const { isAuthenticated, isGuest } = useAuth()
  const { openAuthModal } = useAuthModal()

  const handleGuardedAction = (action: string, itemTitle: string) => {
    if (!isAuthenticated) {
      openAuthModal('signup', `Create a free account to ${action} "${itemTitle}"`)
      return
    }
  }

  return (
    <section className="py-20 md:py-28" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionLabel>Interactive Demo</SectionLabel>
          <SectionTitle>See Your Farm Dashboard</SectionTitle>
          <SectionDesc>Preview the live farm management interface. Try clicking any action button to get started.</SectionDesc>
        </motion.div>
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)' }}>
            <div className="p-3 sm:p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface-2)' }}>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: '#ef4444' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#eab308' }} />
                  <div className="w-3 h-3 rounded-full" style={{ background: '#22c55e' }} />
                </div>
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>My Farm Dashboard</span>
              </div>
              <button
                onClick={() => {
                  if (!isAuthenticated) { openAuthModal('signup', 'Create a free account to add plots to your farm'); return }
                }}
                className="min-h-[44px] px-4 text-sm font-semibold rounded-xl gap-1.5 inline-flex items-center"
                style={{ background: 'var(--color-primary)', color: 'white' }}
              >
                <Plus size={14} /> Add Plot
              </button>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {demoItems.map((item) => (
                <div key={item.id} className="flex flex-col xs:flex-row xs:items-center justify-between p-3 sm:p-4 gap-2 hover:opacity-80 transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                      style={{
                        background: item.status === 'Ready' ? 'var(--color-success-bg)' : item.status === 'Planned' ? 'var(--color-surface-2)' : 'var(--color-primary-light)',
                        color: item.status === 'Ready' ? 'var(--color-success)' : item.status === 'Planned' ? 'var(--color-text-muted)' : 'var(--color-primary)',
                      }}
                    >
                      {item.title.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{item.title}</div>
                      <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                        {item.stage} · {item.health > 0 ? `${item.health}% health` : 'Not started'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 self-end xs:self-auto">
                    {[
                      { icon: Edit2, action: 'edit' },
                      { icon: Heart, action: 'like' },
                      { icon: Bookmark, action: 'bookmark' },
                      { icon: Trash2, action: 'delete' },
                    ].map(({ icon: Icon, action }) => (
                      <button
                        key={action}
                        onClick={() => handleGuardedAction(action, item.title)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <Icon size={16} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ---- Testimonials ----
function TestimonialsSection() {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(() => setCurrent((c) => (c + 1) % testimonials.length), 4000)
    return () => clearInterval(timer)
  }, [isPaused])

  return (
    <section id="testimonials" className="py-20 md:py-28" style={{ background: 'var(--color-surface-2)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionLabel>Testimonials</SectionLabel>
          <SectionTitle>What Farmers Say About Us</SectionTitle>
          <SectionDesc>Hear from farmers who transformed their operations with VaagAi.</SectionDesc>
        </motion.div>
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              className="rounded-2xl p-6 sm:p-8 md:p-10 text-center"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.4 }}
            >
              <Quote size={28} className="mx-auto mb-4" style={{ color: 'var(--color-primary)' }} />
              <p className="text-base sm:text-lg mb-6 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                &ldquo;{testimonials[current].text}&rdquo;
              </p>
              <StarRating rating={testimonials[current].rating} />
              <div className="flex items-center justify-center gap-3 mt-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: 'var(--color-primary)' }}>
                  {testimonials[current].avatar}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold" style={{ color: 'var(--color-text)' }}>{testimonials[current].name}</div>
                  <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{testimonials[current].role} · {testimonials[current].company}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="flex items-center justify-center gap-2 mt-6">
            {testimonials.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full transition-all">
                <span className="rounded-full transition-all" style={{ background: i === current ? 'var(--color-primary)' : 'var(--color-border)', width: i === current ? 24 : 8, height: 8 }} />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ---- Pricing ----
function PricingSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const navigate = useNavigate()

  return (
    <section id="pricing" className="py-20 md:py-28" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionLabel>Pricing</SectionLabel>
          <SectionTitle>Simple, Transparent Pricing</SectionTitle>
          <SectionDesc>Start free. Upgrade when you need more power. No hidden fees, no long-term contracts.</SectionDesc>
        </motion.div>
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
          {pricingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              className="relative rounded-2xl p-6 sm:p-8 flex flex-col transition-all duration-300"
              style={{
                background: plan.popular ? 'var(--color-surface)' : 'var(--color-surface-2)',
                border: plan.popular ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                boxShadow: plan.popular ? 'var(--shadow-primary-lg)' : 'var(--shadow-sm)',
              }}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4 }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold" style={{ background: 'var(--color-primary)', color: 'white' }}>
                  Most Popular
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-1" style={{ fontFamily: 'Geist, Sora, sans-serif', color: 'var(--color-text)' }}>{plan.name}</h3>
                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{plan.description}</p>
              </div>
              <div className="mb-6">
                <span className="text-3xl font-extrabold" style={{ fontFamily: 'Geist, Sora, sans-serif', color: 'var(--color-text)' }}>{plan.price}</span>
                {plan.period && <span className="text-sm" style={{ color: 'var(--color-text-muted)' }}> {plan.period}</span>}
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="shrink-0 mt-0.5" style={{ color: 'var(--color-success)' }} />
                    <span style={{ color: 'var(--color-text-secondary)' }}>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => navigate('/signup')}
                className="w-full min-h-[44px] rounded-xl text-sm font-semibold transition-all"
                style={{
                  background: plan.popular ? 'var(--color-primary)' : 'var(--color-surface-3)',
                  color: plan.popular ? 'white' : 'var(--color-text)',
                  border: plan.popular ? 'none' : '1px solid var(--color-border)',
                }}
              >
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ---- FAQ ----
function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="faq" className="py-20 md:py-28" style={{ background: 'var(--color-surface-2)' }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6" ref={ref}>
        <motion.div
          className="max-w-2xl mx-auto text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
        >
          <SectionLabel>FAQ</SectionLabel>
          <SectionTitle>Frequently Asked Questions</SectionTitle>
          <SectionDesc>Everything you need to know about VaagAi.</SectionDesc>
        </motion.div>
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', cursor: 'pointer' }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full min-h-[44px] flex items-center justify-between p-4 sm:p-5 text-left"
              >
                <span className="text-sm sm:text-base font-medium pr-4" style={{ color: 'var(--color-text)' }}>{faq.q}</span>
                <motion.div
                  animate={{ rotate: open === i ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>
              <AnimatePresence>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <p className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

// ---- CTA Banner ----
function CTABanner() {
  const navigate = useNavigate()
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="py-20 md:py-28 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, var(--color-primary), #0f3a0f)' }} />
      {[
        { size: 200, x: '5%', y: '10%' },
        { size: 150, x: '85%', y: '60%' },
        { size: 100, x: '50%', y: '80%' },
      ].map((s, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: s.size, height: s.size, background: 'rgba(255,255,255,0.04)', left: s.x, top: s.y }}
          animate={{ y: [0, -15, 0] }}
          transition={{ duration: 5 + i * 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        style={{ maxWidth: '42rem' }}
      >
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: 'Geist, Sora, sans-serif' }}>
          Ready to Transform Your Farm?
        </h2>
        <p className="text-white/70 mb-8 max-w-xl mx-auto text-sm sm:text-base">
          Join <strong className="text-white">10,000+</strong> farmers who are using VaagAi to increase yields, reduce costs, and grow smarter.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="w-full min-h-[48px] px-5 rounded-2xl text-sm"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', color: 'white' }}
          />
          <button onClick={() => navigate('/signup')} className="min-h-[48px] px-6 rounded-2xl font-semibold gap-1.5 inline-flex items-center shrink-0" style={{ background: 'white', color: 'var(--color-primary)' }}>
            Join Now <ArrowRight size={16} />
          </button>
        </div>
      </motion.div>
    </section>
  )
}

// ---- Footer ----
function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  return (
    <footer style={{ background: '#0a120a', color: '#e8f0e8' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-10 sm:mb-12">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center justify-center rounded-lg shadow-sm" style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #7bf1a8 0%, #2e7d32 52%, #11361a 100%)' }}>
                <svg width="20" height="20" viewBox="0 0 64 64" fill="none">
                  <path d="M32 50 L32 30" stroke="white" strokeWidth={3.5} strokeLinecap="round" />
                  <path d="M32 34 C24 34 18 28 18 20 C26 20 32 26 32 34 Z" fill="white" />
                  <path d="M32 30 C40 30 46 24 46 16 C38 16 32 22 32 30 Z" fill="white" />
                  <circle cx="32" cy="14" r="3" fill="#aaffcc" />
                  <circle cx="32" cy="14" r="1.5" fill="white" />
                </svg>
              </div>
              <span className="font-bold">Vaag<span style={{ color: '#7bf1a8' }}>Ai</span></span>
            </div>
            <p className="text-sm mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>
              AI-powered smart farming platform helping farmers optimize yields and grow smarter.
            </p>
            <div className="flex gap-3">
              {[MessageCircle, Code2, Share2, Video].map((Icon, i) => (
                <a key={i} href="#" className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>
          {[
            { title: 'Company', links: ['About', 'Blog', 'Careers', 'Press'] },
            { title: 'Product', links: ['Features', 'Integrations', 'API Docs'] },
            { title: 'Resources', links: ['Documentation', 'Help Center', 'Community', 'Status'] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm transition-colors min-h-[36px] flex items-center" style={{ color: 'rgba(255,255,255,0.4)' }}>{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 sm:pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
            &copy; {new Date().getFullYear()} VaagAi Smart Farm. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button onClick={scrollToTop} className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center transition-colors" style={{ background: 'rgba(255,255,255,0.08)' }}>
              <ArrowUp size={16} />
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ---- Main Landing ----
export default function Landing() {
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))

  const toggleDark = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div style={{ overflowX: 'hidden' }}>
      <NavBar />
      <HeroSection />
      <TrustedBySection />
      <StatsBar />
      <FeaturesSection />
      <HowItWorksSection />
      <DemoSec />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTABanner />
      <Footer />

      <button
        onClick={toggleDark}
        className="fixed bottom-6 right-6 z-40 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center shadow-lg transition-colors"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
      >
        {darkMode ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  )
}