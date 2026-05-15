import type { Farm } from "@/lib/data"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { mapFarmRowsWithKiUeberblick } from "@/lib/ki-ueberblick"
import { createSupabaseAnonServer } from "@/lib/supabase-anon-server"
import { withTimeout } from "@/lib/with-timeout"

const SUPABASE_FETCH_MS = 20_000

export async function fetchActiveFarmByPublicSlug(slug: string): Promise<Farm | null> {
  const supabase = createSupabaseAnonServer()
  if (!supabase) return null
  const key = slug.trim().toLowerCase()
  if (!key) return null

  try {
    const { data, error } = await withTimeout(
      supabase
        .from("farms")
        .select(FARM_TABLE_SELECT)
        .ilike("public_slug", key)
        .eq("status", "active")
        .maybeSingle<SupabaseFarmRow>(),
      SUPABASE_FETCH_MS,
      "farm by slug",
    )

    if (error || !data) return null

    const [farm] = await withTimeout(
      mapFarmRowsWithKiUeberblick(supabase, [data]),
      SUPABASE_FETCH_MS,
      "ki_ueberblick",
    )
    if (!farm.public_slug?.trim()) return null
    return farm
  } catch {
    return null
  }
}
