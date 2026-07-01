/**
 * /reset-password — set a new password after clicking the reset link.
 *
 * The reset email's link points here with a token in the URL hash.
 * Supabase's detectSessionInUrl picks the token up automatically,
 * fires SIGNED_IN (recovery flow), and exposes a session — at which
 * point updateUser({ password }) is the right call to set the new pw.
 *
 * If the user lands here without a recovery session (typed the URL
 * directly), we show a "link expired" state and link back to forgot.
 */

import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Sprout } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function ResetPassword() {
  const navigate = useNavigate()
  const { session, loading, updatePassword } = useAuth()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // If we've fully loaded and there's still no recovery session,
    // the link is bad or expired.
    if (!loading && !session) {
      toast.error('Reset link is invalid or has expired.', {
        description: 'Request a new one to continue.',
      })
      navigate('/forgot-password', { replace: true })
    }
  }, [loading, session, navigate])

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
      await updatePassword(password)
      toast.success('Password updated.', {
        description: 'You are now signed in.',
      })
      navigate('/farm', { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not update password.'
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
          Set a new password
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Choose a strong password to secure your account.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="password">New password</Label>
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
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm">Confirm new password</Label>
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
            {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Update password'}
          </Button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Need a new link?{' '}
          <Link
            to="/forgot-password"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Resend
          </Link>
        </p>
      </div>
    </div>
  )
}