/**
 * useAuth — Supabase-backed auth hook + legacy useQuery/mutation helpers.
 *
 * New Supabase path (Phase 1.5a):
 *   - useAuth() returns session, user, loading, and the auth action
 *     functions bound to supabase.auth.* (signInWithPassword, signUp,
 *     signOut, resetPasswordForEmail, updatePassword).
 *
 * Legacy path (to be deleted in Phase 1.5b):
 *   - useLogin, useRegister, useCurrentUser — these hit the Express
 *     /api/auth/* endpoints via axios and read/write 'vaagai_token' in
 *     localStorage. Kept here so existing pages (TopBar.jsx, etc.) keep
 *     compiling until the BE JWT code is replaced. Will be removed in
 *     the same commit that drops the custom JWT middleware.
 */

import { useCallback, useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import api from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import type { AuthResponse, User as LegacyUser } from '../types'

// ---------------------------------------------------------------------------
// NEW: Supabase-backed hook
// ---------------------------------------------------------------------------

export interface UseAuthResult {
  session: Session | null
  user: User | null
  loading: boolean
  signInWithPassword: (email: string, password: string) => Promise<void>
  signUpWithPassword: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPasswordForEmail: (email: string) => Promise<void>
  updatePassword: (newPassword: string) => Promise<void>
}

export function useAuth(): UseAuthResult {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setSession(data.session)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return
      setSession(newSession)
      setLoading(false)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signInWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  }, [])

  const signUpWithPassword = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) throw error
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const resetPasswordForEmail = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) throw error
  }, [])

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw error
  }, [])

  return {
    session,
    user: session?.user ?? null,
    loading,
    signInWithPassword,
    signUpWithPassword,
    signOut,
    resetPasswordForEmail,
    updatePassword,
  }
}

export default useAuth

// ---------------------------------------------------------------------------
// LEGACY: BE-JWT mutations — remove in Phase 1.5b.
// ---------------------------------------------------------------------------

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await api.post<AuthResponse>('/api/auth/login', credentials)
      return res.data
    },
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const nameParts = data.name.split(' ')
      const res = await api.post('/api/auth/register', {
        firstName: nameParts[0],
        lastName: nameParts.slice(1).join(' ') || undefined,
        email: data.email,
        password: data.password,
      })
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['user', 'current'],
    queryFn: async () => {
      const res = await api.get('/api/auth/me')
      return (res.data.user ?? res.data) as LegacyUser
    },
    retry: false,
  })
}