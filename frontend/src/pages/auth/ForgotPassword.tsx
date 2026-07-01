/**
 * /forgot-password — request a password-reset email.
 *
 * Supabase sends the email; the link points at /reset-password with a
 * token in the URL hash, which detectSessionInUrl will pick up.
 *
 * Always show the same confirmation regardless of whether the email
 * exists, to prevent account enumeration.
 */

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Sprout } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/hooks/useAuth'

export default function ForgotPassword() {
  const { resetPasswordForEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await resetPasswordForEmail(email.trim())
    } catch {
      // Swallow — we don't want to leak whether the email exists.
    } finally {
      setSubmitting(false)
    }
    toast.success('If an account exists for that email, a reset link is on its way.', {
      description: 'Check your inbox (and spam folder).',
    })
    setEmail('')
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
          Reset your password
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Enter your email and we'll send you a reset link.
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

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-11 text-sm font-semibold"
            style={{ background: 'var(--color-primary)', color: 'white' }}
          >
            {submitting ? <Loader2 className="animate-spin" size={16} /> : 'Send reset link'}
          </Button>
        </form>

        <p
          className="mt-6 text-center text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Remembered it?{' '}
          <Link
            to="/login"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}