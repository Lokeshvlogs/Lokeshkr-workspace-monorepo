import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// The browser's Supabase client: Google sign-in (PKCE) and the signed-in user's own rows, read
// through row-level security. Only the public URL and publishable key are used here.
let client: SupabaseClient | null = null

export function supabase(): SupabaseClient {
  if (client) return client
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key) throw new Error('Supabase is not configured (NEXT_PUBLIC_SUPABASE_URL / _PUBLISHABLE_KEY)')
  client = createClient(url, key, {
    auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  })
  return client
}

// Starts Google sign-in; Supabase sends the browser back to /auth/callback, which returns to `next`.
export async function signInWithGoogle(next = '/editor') {
  const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`
  const { error } = await supabase().auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })
  if (error) throw error
}

export async function signOut() {
  await supabase().auth.signOut()
}
