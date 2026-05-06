import { GloryAdminGate } from "@/components/admin/glory-admin-gate"
import { fetchFarmsFromSupabase } from "@/lib/fetch-farms"
import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"

export const dynamic = "force-dynamic"

export default async function GloryPage() {
  const farms = await fetchFarmsFromSupabase(createSupabaseAdminServer())
  return <GloryAdminGate farms={farms} />
}
