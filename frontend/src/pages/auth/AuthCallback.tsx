/**
 * /auth/callback — landing target for Supabase email-verify + reset links.
 *
 * Supabase's detectSessionInUrl (set in lib/supabase.ts) parses the
 * URL hash (#access_token=...) automatically and fires SIGNED_IN.
 * We wait for onAuthStateChange to populate the session via useAuth,
 * then redirect to ?next= (or /farm).
 *
 * The previous implementation parsed ?token=&?user= from the old
 * Express /api/auth/google/callback flow. That BE route is still alive
 * for the Google OAuth path; this page now handles the Supabase flows.
 */

import { useEffect, useState } from 'react'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'

export default function AuthCallback() {
  const [searchParams] = useSearchParams()
  const { session, loading } = useAuth()
  const [error, setError] = useState<string | null>(null)

  // Supabase appends ?error_description= or ?error= when the link is bad.
  useEffect(() => {
    const errorDescription = searchParams.get('error_description')
    const errorCode = searchParams.get('error')
    if (errorDescription || errorCode) {
      setError(errorDescription || errorCode || 'Authentication failed.')
      toast.error(errorDescription || errorCode || 'Authentication failed.')
    }
  }, [searchParams])

  if (error) {
    return <Navigate to="/login" replace />
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-primary-light)' }}
      >
        <Loader2
          className="animate-spin"
          size={28}
          style={{ color: 'var(--color-primary)' }}
        />
      </div>
    )
  }

  if (session) {
    const next = searchParams.get('next') || '/farm'
    return <Navigate to={next} replace />
  }

  // Session still hasn't appeared after INITIAL_SESSION fired. The hash
  // may have been malformed (link clicked twice, token already used).
  // Send the user back to login rather than leaving them on a spinner.
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-primary-light)' }}
    >
      <div className="text-center">
        <p className="mb-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This link has expired or already been used.
        </p>
        <a
          href="/login"
          className="text-sm font-semibold underline-offset-2 hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          Back to sign in
        </a>
      </div>
    </div>
  )
}