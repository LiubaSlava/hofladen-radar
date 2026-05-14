import type { SupabaseClient } from "@supabase/supabase-js"
import type { Farm } from "@/lib/data"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { mapFarmRowsWithKiUeberblick } from "@/lib/ki-ueberblick"

export async function fetchFarmsFromSupabase(supabase: SupabaseClient | null): Promise<Farm[]> {
  if (!supabase) return []

  const { data, error } = await supabase.from("farms").select(FARM_TABLE_SELECT).returns<SupabaseFarmRow[]>()

  if (error || !data) {
    const e = error as { message?: string; details?: string; hint?: string; code?: string } | undefined
    console.error(
      "Failed to load farms from Supabase:",
      [e?.message, e?.details, e?.hint, e?.code].filter(Boolean).join(" | ") || "(kein Text)",
      error,
    )
    return []
  }

  return mapFarmRowsWithKiUeberblick(supabase, data)
}
