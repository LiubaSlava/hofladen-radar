import { createClient, type SupabaseClient } from "@supabase/supabase-js"

/**
 * Server-only Supabase client with the **service_role** key.
 * NEVER import this module from Client Components.
 */
export function createSupabaseAdminServer(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRoleKey) return null
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
