import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Sprout } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/farm', { replace: true })
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-surface-2)' }}>
      <div className="w-full max-w-md">
        <div className="card p-8" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <div className="flex flex-col items-center mb-8">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--color-primary-light)' }}>
              <Sprout size={28} style={{ color: 'var(--color-primary)' }} />
            </div>
            <h1 className="text-2xl font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>Welcome back</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Sign in to your VaagAi account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="input w-full"
                style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="input w-full pr-10"
                  style={{ background: 'var(--color-surface-2)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] flex items-center justify-center"
                  style={{ color: 'var(--color-text-muted)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg text-sm" style={{ background: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid rgba(220,38,38,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-premium w-full min-h-[44px] flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-6">
            <Link
              to="/signup"
              className="text-sm font-medium min-h-[44px] flex items-center"
              style={{ color: 'var(--color-primary)' }}
            >
              Create account
            </Link>
            <Link
              to="/forgot-password"
              className="text-sm min-h-[44px] flex items-center"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
