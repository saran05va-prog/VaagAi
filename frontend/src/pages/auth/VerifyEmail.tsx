/**
 * /verify-email — post-signup holding page.
 *
 * Supabase has just sent the confirmation link. We show:
 *   - the email we sent it to (from navigation state)
 *   - a Resend button (with cooldown)
 *   - a tip about checking spam
 *
 * When the user clicks the email link, Supabase redirects to
 * /auth/callback which finalises the session, then onAuthStateChange
 * pushes us into /farm.
 */

import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Loader2, MailCheck, Sprout } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

const RESEND_COOLDOWN_SECONDS = 30

export default function VerifyEmail() {
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email ?? ''

  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function onResend() {
    if (!email || cooldown > 0) return
    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      toast.success('Confirmation email resent.')
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not resend email.'
      toast.error(message)
    } finally {
      setResending(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-10"
      style={{ background: 'var(--color-primary-light)' }}
    >
      <div
        className="w-full max-w-[440px] rounded-2xl shadow-2xl overflow-hidden p-8 text-center"
        style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-center gap-2.5 mb-6">
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

        <div
          className="mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--color-primary-light)' }}
        >
          <MailCheck size={26} style={{ color: 'var(--color-primary)' }} />
        </div>

        <h1
          className="text-2xl font-bold mb-2"
          style={{ fontFamily: 'Sora, sans-serif', color: 'var(--color-text)' }}
        >
          Check your email
        </h1>
        <p className="text-sm mb-2" style={{ color: 'var(--color-text-muted)' }}>
          We sent a confirmation link to
        </p>
        {email && (
          <p className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            {email}
          </p>
        )}
        <p className="text-sm mb-6" style={{ color: 'var(--color-text-muted)' }}>
          Click the link in the email to activate your account. If it doesn't arrive in a
          few minutes, check your spam folder.
        </p>

        {email && (
          <Button
            type="button"
            onClick={onResend}
            disabled={resending || cooldown > 0}
            variant="outline"
            className="w-full h-11 text-sm font-semibold"
          >
            {resending ? (
              <Loader2 className="animate-spin" size={16} />
            ) : cooldown > 0 ? (
              `Resend in ${cooldown}s`
            ) : (
              'Resend confirmation email'
            )}
          </Button>
        )}

        <p
          className="mt-6 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Wrong email?{' '}
          <Link
            to="/signup"
            className="font-semibold underline-offset-2 hover:underline"
            style={{ color: 'var(--color-primary)' }}
          >
            Sign up again
          </Link>
        </p>
      </div>
    </div>
  )
}