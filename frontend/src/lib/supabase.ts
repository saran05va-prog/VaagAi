/**
 * Supabase client (anon).
 *
 * Single source of truth for Supabase on the frontend.
 *
 * Why no @supabase/ssr: this is a Vite SPA (no SSR). The plain
 * @supabase/supabase-js client with persistSession + autoRefreshToken
 * persists the session in localStorage and refreshes the access
 * token in the background. Adding @supabase/ssr would be dead weight
 * (it's for Next.js / Remix / SvelteKit cookie-based sessions).
 *
 * Session lifecycle:
 *   - On mount, supabase.auth.getSession() reads from localStorage.
 *   - On auth events (SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED /
 *     USER_UPDATED / INITIAL_SESSION), onAuthStateChange fires.
 *   - Between cold reload and INITIAL_SESSION, the cache may be
 *     empty — callers should fall back to reading the raw token
 *     from localStorage (see lib/api.ts interceptor).
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Surface the misconfiguration loudly in dev; in prod the bundle
  // will still load but every call will 401 with a clear missing-env
  // error from Supabase.
  console.error(
    '[supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. ' +
      'Copy frontend/.env.example to frontend/.env and fill them in.'
  )
}

export const supabase: SupabaseClient = createClient(url ?? '', anonKey ?? '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // picks up tokens from /auth/callback
    storageKey: `sb-${import.meta.env.VITE_SUPABASE_PROJECT_REF}-auth-token`,
    storage: window.localStorage,
  },
})

export default supabase