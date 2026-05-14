import type { Farm } from "@/lib/data"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { mapFarmRowsWithKiUeberblick } from "@/lib/ki-ueberblick"
import { createSupabaseAnonServer } from "@/lib/supabase-anon-server"

export async function fetchActiveFarmByPublicSlug(slug: string): Promise<Farm | null> {
  const supabase = createSupabaseAnonServer()
  if (!supabase) return null
  const key = slug.trim().toLowerCase()
  if (!key) return null

  const { data, error } = await supabase
    .from("farms")
    .select(FARM_TABLE_SELECT)
    .ilike("public_slug", key)
    .eq("status", "active")
    .maybeSingle<SupabaseFarmRow>()

  if (error || !data) return null

  const [farm] = await mapFarmRowsWithKiUeberblick(supabase, [data])
  if (!farm.public_slug?.trim()) return null
  return farm
}
