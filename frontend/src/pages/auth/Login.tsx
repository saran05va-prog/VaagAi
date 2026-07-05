/**
 * /login — Supabase password sign-in.
 *
 * On success, the Supabase session is set automatically (onAuthStateChange
 * fires); useAuth() picks it up; we navigate to ?next= or /farm.
 *
 * On "Email not confirmed" we redirect to /verify-email so the user can
 * resend the confirmation link.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, Sprout } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const next = searchParams.get('next') || '/farm'
  const { session, loading: authLoading, signInWithPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && session) {
      navigate(next, { replace: true })
    }
  }, [authLoading, session, navigate, next])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await signInWithPassword(email.trim(), password)
      toast.success('Welcome back.')
      navigate(next, { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-in failed.'
      if (/email not confirmed/i.test(message)) {
        toast.message('Please verify your email first.', {
          description: 'We sent you a confirmation link — check your inbox.',
        })
        navigate('/verify-email', { replace: true })
      } else {
        toast.error(message)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--color-primary-light)' }}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden p-8"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5 mb-6">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'var(--color-primary-light)' }}
          >
            <Sprout size={18} style={{ color: 'var(--color-primary)' }} />
          </div>
          <span className="text-lg font-bold" style={{ fontFamily: 'Sora, sans-serif' }}>
            VaagAi
          </span>
        </div>

        <h1
          className="text-2xl font-bold mb-1"
          style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
        >
          Sign in
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Welcome back. Sign in to your farm dashboard.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@farm.com"
              disabled={submitting}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                to="/forgot-password"
                className="text-xs underline-offset-2 hover:underline"
                style={{ color: 'var(--color-primary)' }}
              >
                Forgot?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 text-sm font-semibold"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Sign in'}
          </Button>
        </form>

        <div className="flex items-center gap-2 my-5">
          <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>OR</span>
          <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
        </div>

        <button
          type="button"
          onClick={() => window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/auth/google`}
          className="w-full h-11 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90"
          style={{ background: 'var(--color-surface-2)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
          Continue with Google
        </button>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          New here?{' '}
          <Link
            to="/signup"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  )
}