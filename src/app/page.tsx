import { RadarView } from "@/components/public/radar-view"
import { fetchFarmsFromSupabase } from "@/lib/fetch-farms"
import { createSupabaseAnonServer } from "@/lib/supabase-anon-server"

export const dynamic = "force-dynamic"

export default async function HomePage() {
  const farms = await fetchFarmsFromSupabase(createSupabaseAnonServer())

  return <RadarView farms={farms} />
}
