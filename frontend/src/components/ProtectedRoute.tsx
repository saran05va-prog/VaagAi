/**
 * ProtectedRoute — gate any route behind a Supabase session.
 *
 * Behaviour:
 *   - While loading (INITIAL_SESSION not yet fired), show a neutral
 *     loading state. Never flash a redirect on cold reload.
 *   - If no session, redirect to /login and remember where the user
 *     was trying to go via ?next=<path>.
 *   - If session exists, render children.
 *
 * Does NOT replace the existing `ProtectedRoute` defined inline in
 * App.tsx (which reads localStorage.getItem('vaagai_token')). App.tsx
 * will be updated to import THIS one in Phase 1.5(a) — the inline
 * definition can stay or be removed in the same commit. See the
 * route-wiring commit message.
 */

import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-bg, #0b1220)' }}
      >
        <Loader2 className="animate-spin" size={28} style={{ color: 'var(--color-text-muted, #94a3b8)' }} />
      </div>
    )
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }

  return <>{children}</>
}