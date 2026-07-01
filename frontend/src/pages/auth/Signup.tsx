/**
 * /signup — Supabase password sign-up with email verification.
 *
 * After signUp, Supabase sends a confirmation email. The user is NOT
 * signed in yet (per Supabase Auth behaviour with "Confirm email" on).
 * We redirect to /verify-email so they can resend if it didn't arrive.
 *
 * Note: we deliberately don't ask for a display name here. First/last
 * name is collected later in the onboarding/profile flow (Phase 1.5b
 * will wire that to a Supabase `profiles` table).
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Sprout } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function Signup() {
  const navigate = useNavigate()
  const { session, loading: authLoading, signUpWithPassword } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!authLoading && session) {
      navigate('/farm', { replace: true })
    }
  }, [authLoading, session, navigate])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      toast.error('Passwords do not match.')
      return
    }
    setSubmitting(true)
    try {
      await signUpWithPassword(email.trim(), password)
      toast.success('Check your email.', {
        description: 'We sent you a confirmation link to verify your account.',
      })
      navigate('/verify-email', {
        replace: true,
        state: { email: email.trim() },
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Sign-up failed.'
      toast.error(message)
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
          Create your account
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Start getting AI-powered crop, weather, and market guidance.
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
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={submitting}
            />
            <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
              At least 8 characters.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm password</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              disabled={submitting}
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 text-sm font-semibold"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Create account'}
          </Button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}