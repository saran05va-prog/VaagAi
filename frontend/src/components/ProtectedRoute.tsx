import { useEffect, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useAuth as useLegacyAuth } from '../contexts/AuthContext'
import { useAuthModal } from '../contexts/AuthModalContext'

interface ProtectedRouteProps {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, loading } = useAuth()
  const { isGuest, isAuthenticated: legacyAuth } = useLegacyAuth()
  const { openAuthModal } = useAuthModal()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !session && !isGuest && !legacyAuth) {
      const path = location.pathname === '/' ? '' : ` ${location.pathname}`
      openAuthModal('signup', `Create a free account to access${path}`)
    }
  }, [loading, session, isGuest, legacyAuth, openAuthModal, location.pathname])

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

  if (session || isGuest || legacyAuth) {
    return <>{children}</>
  }

  return <Navigate to="/" replace />
}
