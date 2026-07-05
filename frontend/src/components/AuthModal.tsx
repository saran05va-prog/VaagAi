import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'
import { useFarmStore } from './farm3d/farmStore'
import { useSettingsStore } from '../stores/settingsStore'
import { X, Eye, EyeOff, Sprout, Loader2, Tractor, Ruler, MapPin } from 'lucide-react'
import { toast } from 'sonner'

type Tab = 'login' | 'signup'
type SignupStep = 'farm' | 'credentials'

export default function AuthModal() {
  const { isOpen, initialTab, closeAuthModal, message: modalMessage } = useAuthModal()
  const { login, signup, isAuthenticated } = useAuth()
  const { setFarmName, setTotalArea } = useFarmStore()
  const s = useSettingsStore()

  const [tab, setTab] = useState<Tab>(initialTab)
  const [step, setStep] = useState<SignupStep>('farm')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [farmNameDraft, setFarmNameDraft] = useState('')
  const [farmLocation, setFarmLocation] = useState('')
  const [farmArea, setFarmArea] = useState('')

  useEffect(() => {
    setTab(initialTab)
    setStep('farm')
    setEmail('')
    setPassword('')
    setFirstName('')
    setLastName('')
    setConfirmPassword('')
    setFarmNameDraft('')
    setFarmLocation('')
    setFarmArea('')
    setError('')
    setShowPassword(false)
  }, [initialTab, isOpen])

  useEffect(() => {
    if (isAuthenticated) {
      closeAuthModal()
    }
  }, [isAuthenticated, closeAuthModal])

  if (!isOpen) return null

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Signed in successfully')
      closeAuthModal()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const areaNum = parseFloat(farmArea)
      await signup({
        email,
        password,
        firstName,
        lastName: lastName || undefined,
        farmName: farmNameDraft.trim() || undefined,
        farmLocation: farmLocation.trim() || undefined,
        farmArea: isNaN(areaNum) ? undefined : areaNum,
      })
      toast.success('Account created successfully')
      if (farmNameDraft.trim()) setFarmName(farmNameDraft.trim())
      if (!isNaN(areaNum) && areaNum > 0) setTotalArea(areaNum)
      s.setProfile({
        firstName,
        lastName: lastName || '',
        farmName: farmNameDraft.trim(),
        location: farmLocation.trim(),
      })
      closeAuthModal()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeAuthModal} />
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0d1810 0%, #112015 100%)', border: '1px solid rgba(123, 207, 137, 0.18)' }}
      >
        <button
          onClick={closeAuthModal}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.06)', color: '#7fb58a' }}
        >
          <X size={18} />
        </button>

        <div className="p-6 pb-4 text-center">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ background: 'rgba(16,185,129,0.12)' }}>
            <Sprout size={24} style={{ color: '#34d399' }} />
          </div>
          <h2 className="text-lg font-bold" style={{ color: '#eefdf0', fontFamily: 'Sora, sans-serif' }}>
            {tab === 'login' ? 'Welcome Back' : step === 'farm' ? 'Your Farm' : 'Create Account'}
          </h2>
          <p className="text-xs mt-1" style={{ color: '#8dbf96' }}>
            {tab === 'login' ? 'Sign in to continue' : step === 'farm' ? 'Tell us about your farm' : 'Set up your credentials'}
          </p>
        </div>

        {modalMessage && (
          <div className="mx-6 mb-3 px-3 py-2 rounded-lg text-xs font-medium text-center" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.15)' }}>
            {modalMessage}
          </div>
        )}

        <div className="flex mx-6 mb-4 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(123,207,137,0.1)' }}>
          <button
            onClick={() => { setTab('login'); setError('') }}
            className="flex-1 py-2 text-sm font-semibold transition-colors"
            style={{
              background: tab === 'login' ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: tab === 'login' ? '#34d399' : '#7fb58a',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setError('') }}
            className="flex-1 py-2 text-sm font-semibold transition-colors"
            style={{
              background: tab === 'signup' ? 'rgba(16,185,129,0.15)' : 'transparent',
              color: tab === 'signup' ? '#34d399' : '#7fb58a',
            }}
          >
            Sign Up
          </button>
        </div>

        {tab === 'signup' && step === 'farm' ? (
          <form onSubmit={(e) => { e.preventDefault(); setStep('credentials') }} className="px-6 pb-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#8dbf96' }}>First name</label>
                <input
                  type="text" value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="John" required
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(123,207,137,0.12)', color: '#eefdf0' }}
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#8dbf96' }}>Last name</label>
                <input
                  type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(123,207,137,0.12)', color: '#eefdf0' }}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8dbf96' }}>
                <Tractor size={14} className="inline mr-1" /> Farm name
              </label>
              <input
                type="text" value={farmNameDraft} onChange={e => setFarmNameDraft(e.target.value)}
                placeholder="e.g. Green Valley Farm" required
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(123,207,137,0.12)', color: '#eefdf0' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8dbf96' }}>
                <MapPin size={14} className="inline mr-1" /> Location
              </label>
              <input
                type="text" value={farmLocation} onChange={e => setFarmLocation(e.target.value)}
                placeholder="City, State, Country" required
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(123,207,137,0.12)', color: '#eefdf0' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8dbf96' }}>
                <Ruler size={14} className="inline mr-1" /> Total area (hectares)
              </label>
              <input
                type="number" value={farmArea} onChange={e => setFarmArea(e.target.value)}
                placeholder="e.g. 2.5" min="0" step="0.1" required
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(123,207,137,0.12)', color: '#eefdf0' }}
              />
            </div>

            <button type="submit"
              className="w-full py-2.5 rounded-xl text-sm font-semibold transition-all"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.25)' }}>
              Continue to Sign Up
            </button>
          </form>
        ) : (
          <form onSubmit={tab === 'login' ? handleLogin : handleSignup} className="px-6 pb-6 space-y-3">
            {error && (
              <div className="p-2.5 rounded-lg text-xs" style={{ background: 'rgba(239,68,68,0.12)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.15)' }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8dbf96' }}>Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
                className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors"
                style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(123,207,137,0.12)', color: '#eefdf0' }}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#8dbf96' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={tab === 'signup' ? 'Min. 6 characters' : 'Enter your password'} required
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none pr-10 transition-colors"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(123,207,137,0.12)', color: '#eefdf0' }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1" style={{ color: '#7fb58a' }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {tab === 'signup' && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#8dbf96' }}>Confirm password</label>
                <input
                  type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password" required
                  className="w-full px-3 py-2 text-sm rounded-xl outline-none transition-colors"
                  style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(123,207,137,0.12)', color: '#eefdf0' }}
                />
              </div>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
              style={{
                background: loading ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)',
                color: loading ? '#6a9f75' : '#34d399',
                border: '1px solid rgba(16,185,129,0.25)',
              }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              {tab === 'login' ? 'Sign In' : 'Create Account'}
            </button>

            {tab === 'signup' && (
              <button type="button" onClick={() => { setStep('farm'); setError('') }}
                className="w-full text-xs text-center py-1"
                style={{ color: '#7fb58a' }}>
                &larr; Back to farm details
              </button>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
