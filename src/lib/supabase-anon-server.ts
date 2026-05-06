import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client with the **anon** key (public).
 * Use on routes/components that run on the server and must not expose secrets.
 */
export function createSupabaseAnonServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
