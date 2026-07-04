import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import api from '../lib/api'

interface User {
  id: string
  email: string
  firstName: string
  lastName?: string
  role: string
  avatarUrl?: string
  createdAt?: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isGuest: boolean
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName: string, lastName?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
  enterGuestMode: () => void
  exitGuestMode: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('vaagai_token'))
  const [isGuest, setIsGuest] = useState<boolean>(() => sessionStorage.getItem('vaagai_guest') === 'true')
  const [loading, setLoading] = useState(true)

  const isAuthenticated = !!user && !!token

  const fetchUser = useCallback(async (jwt: string) => {
    try {
      const res = await api.get('/api/auth/me', {
        headers: { Authorization: `Bearer ${jwt}` },
      })
      setUser(res.data.user || res.data)
    } catch {
      localStorage.removeItem('vaagai_token')
      setToken(null)
      setUser(null)
    }
  }, [])

  useEffect(() => {
    const savedToken = localStorage.getItem('vaagai_token')
    if (savedToken) {
      setToken(savedToken)
      fetchUser(savedToken).finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [fetchUser])

  const enterGuestMode = useCallback(() => {
    sessionStorage.setItem('vaagai_guest', 'true')
    setIsGuest(true)
  }, [])

  const exitGuestMode = useCallback(() => {
    sessionStorage.removeItem('vaagai_guest')
    setIsGuest(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/api/auth/login', { email, password })
    const { token: newToken, user: userData } = res.data
    localStorage.setItem('vaagai_token', newToken)
    setToken(newToken)
    setUser(userData)
    sessionStorage.removeItem('vaagai_guest')
    setIsGuest(false)
  }, [])

  const signup = useCallback(async (email: string, password: string, firstName: string, lastName?: string) => {
    const res = await api.post('/api/auth/signup', { email, password, firstName, lastName })
    const { token: newToken, user: userData } = res.data
    localStorage.setItem('vaagai_token', newToken)
    setToken(newToken)
    setUser(userData)
    sessionStorage.removeItem('vaagai_guest')
    setIsGuest(false)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('vaagai_token')
    setToken(null)
    setUser(null)
    sessionStorage.removeItem('vaagai_guest')
    setIsGuest(false)
  }, [])

  const refreshUser = useCallback(async () => {
    const savedToken = localStorage.getItem('vaagai_token')
    if (savedToken) {
      await fetchUser(savedToken)
    }
  }, [fetchUser])

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated, isGuest, loading, login, signup, logout, refreshUser, enterGuestMode, exitGuestMode }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
