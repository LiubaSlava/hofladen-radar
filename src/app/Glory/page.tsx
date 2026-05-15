import type { Metadata } from "next"
import { GloryAdminGate } from "@/components/admin/glory-admin-gate"
import { fetchFarmsFromSupabase } from "@/lib/fetch-farms"
import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Administration | Hofladen Radar",
  description: "Interner Verwaltungsbereich für Hofladen Radar — nicht öffentlich indexiert.",
  robots: { index: false, follow: false },
}

export default async function GloryPage() {
  const farms = await fetchFarmsFromSupabase(createSupabaseAdminServer())
  return <GloryAdminGate farms={farms} />
}
