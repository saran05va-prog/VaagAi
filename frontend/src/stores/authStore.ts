import { create } from 'zustand'
import api from '../lib/api'
import type { User } from '../types'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  initialized: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  loading: true,
  initialized: false,

  initialize: async () => {
    // Prevent re-initialization
    if (get().initialized) return

    // Check for existing token on load
    const storedToken = localStorage.getItem('vaagai_token')
    const storedUserId = localStorage.getItem('vaagai_user_id')

    if (storedToken) {
      try {
        // Validate token with backend
        const response = await api.get('/api/auth/me')
        const user = response.data.user || response.data
        set({ user, token: storedToken, loading: false, initialized: true })
        return
      } catch (error) {
        console.warn('Token validation failed, clearing auth:', error)
        localStorage.removeItem('vaagai_token')
        localStorage.removeItem('vaagai_user_id')
      }
    }

    set({ user: null, token: null, loading: false, initialized: true })
  },

  signInWithGoogle: async () => {
    // Redirect to backend Google OAuth endpoint
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002'
    window.location.href = `${backendUrl}/api/auth/google`
  },

  signInWithEmail: async (email, password) => {
    console.log('Attempting login with:', email)
    try {
      const response = await api.post('/api/auth/login', { email, password })
      console.log('Full login response:', response)
      const data = response.data
      console.log('Login response data:', data)
      localStorage.setItem('vaagai_token', data.token)
      if (data.user?.id) {
        localStorage.setItem('vaagai_user_id', data.user.id)
        console.log('Set userId:', data.user.id)
      } else {
        console.warn('No user id in response, using email as fallback')
        localStorage.setItem('vaagai_user_id', data.user?.email || email)
      }
      set({ user: data.user, token: data.token })
    } catch (err) {
      console.error('Login API error:', err)
      throw err
    }
  },

  signUpWithEmail: async (name, email, password) => {
    const nameParts = name.split(' ')
    const { data } = await api.post<{ user: any; token: string }>('/api/auth/register', {
      firstName: nameParts[0],
      lastName: nameParts.slice(1).join(' ') || undefined,
      email,
      password
    })
    localStorage.setItem('vaagai_token', data.token)
    if (data.user?.id) {
      localStorage.setItem('vaagai_user_id', data.user.id)
    }
    set({ user: data.user, token: data.token })
  },

  signOut: async () => {
    try {
      await api.post('/api/auth/logout')
    } catch {
      // Ignore logout errors
    }
    localStorage.removeItem('vaagai_token')
    localStorage.removeItem('vaagai_user_id')
    set({ user: null, token: null })
  },
}))