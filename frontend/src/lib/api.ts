/**
 * Centralized axios client for talking to the Express backend.
 *
 * Auth model (Phase 1.5 — Supabase):
 *   - Bearer token comes from Supabase, never from localStorage 'vaagai_token'.
 *   - On every request, the interceptor pulls the access token from the
 *     Supabase session cache (sync, post-INITIAL_SESSION).
 *   - On cold reload BEFORE onAuthStateChange(INITIAL_SESSION) fires,
 *     the cache is empty; we fall back to reading the raw token directly
 *     out of the Supabase-managed localStorage key.
 *   - On 401, we kick off a single in-flight refreshSession() (not one
 *     per parallel request) and retry the original request once.
 *
 * The Express side (Phase 1.5b) will verify the Bearer against the
 * Supabase JWKS via lib/jwks.ts — no cookies, no CSRF surface.
 */

import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { supabase } from './supabase'

export const getApiBaseUrl = (): string => {
  if (import.meta.env.PROD) {
    return '/api'
  }
  return import.meta.env.VITE_API_URL || 'http://localhost:3002'
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 30000,
})

// ---------------------------------------------------------------------------
// Request interceptor — attach Bearer from Supabase session.
// ---------------------------------------------------------------------------

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_REF as string | undefined

api.interceptors.request.use(async (config) => {
  let token: string | undefined

  // Preferred path: Supabase session cache (instant after INITIAL_SESSION).
  const { data } = await supabase.auth.getSession()
  token = data.session?.access_token

  // Cold-reload fallback: Supabase hasn't fired INITIAL_SESSION yet,
  // so the in-memory cache is empty. Read the raw token directly out
  // of the localStorage key Supabase manages.
  if (!token && projectRef) {
    try {
      const raw = localStorage.getItem(`sb-${projectRef}-auth-token`)
      if (raw) token = JSON.parse(raw).access_token
    } catch {
      // Corrupt localStorage entry — ignore, request goes out unauthenticated
      // and the server will return 401, which the response interceptor handles.
    }
  }

  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`)
  }
  return config
})

// ---------------------------------------------------------------------------
// Response interceptor — single-inflight refresh on 401, then retry once.
// ---------------------------------------------------------------------------

let refreshInflight: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInflight) {
    refreshInflight = supabase.auth
      .refreshSession()
      .then(({ data }) => {
        refreshInflight = null
        return data.session?.access_token ?? null
      })
      .catch(() => {
        refreshInflight = null
        return null
      })
  }
  return refreshInflight
}

api.interceptors.response.use(
  (res) => res,
  async (err: AxiosError) => {
    if (err.response?.status !== 401) {
      return Promise.reject(err)
    }

    // Don't try to refresh for the auth endpoints themselves — if /login
    // 401s, the credentials are wrong and refresh won't help.
    const url = err.config?.url ?? ''
    if (url.includes('/api/auth/')) {
      return Promise.reject(err)
    }

    const newToken = await refreshAccessToken()
    if (!newToken || !err.config) {
      return Promise.reject(err)
    }

    // Retry the original request with the fresh token.
    const retryConfig: InternalAxiosRequestConfig = {
      ...err.config,
      headers: { ...(err.config.headers ?? {}), Authorization: `Bearer ${newToken}` },
    }
    return api.request(retryConfig)
  }
)

export default api