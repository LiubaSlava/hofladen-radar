import type { SupabaseClient } from "@supabase/supabase-js"
import type { Farm } from "@/lib/data"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { mapFarmRowsWithKiUeberblick } from "@/lib/ki-ueberblick"
import { withTimeout } from "@/lib/with-timeout"

/** Keep `next build` from hanging on slow Supabase during “Collecting page data”. */
const SUPABASE_FETCH_MS = 20_000

export async function fetchFarmsFromSupabase(supabase: SupabaseClient | null): Promise<Farm[]> {
  if (!supabase) return []

  try {
    const { data, error } = await withTimeout(
      supabase.from("farms").select(FARM_TABLE_SELECT).returns<SupabaseFarmRow[]>(),
      SUPABASE_FETCH_MS,
      "farms list",
    )

    if (error || !data) {
      const e = error as { message?: string; details?: string; hint?: string; code?: string } | undefined
      console.error(
        "Failed to load farms from Supabase:",
        [e?.message, e?.details, e?.hint, e?.code].filter(Boolean).join(" | ") || "(kein Text)",
        error,
      )
      return []
    }

    return await withTimeout(mapFarmRowsWithKiUeberblick(supabase, data), SUPABASE_FETCH_MS, "ki_ueberblick")
  } catch (err) {
    console.error("fetchFarmsFromSupabase:", err instanceof Error ? err.message : err)
    return []
  }
}
