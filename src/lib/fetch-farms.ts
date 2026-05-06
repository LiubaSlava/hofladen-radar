import type { SupabaseClient } from "@supabase/supabase-js"
import type { Farm } from "@/lib/data"
import { mapSupabaseFarmRow, type SupabaseFarmRow } from "@/lib/farms-mapper"

const FARMS_SELECT =
  "id,created_at,name,address,latitude,longitude,products,has_shop,has_parking,has_restaurant,has_accommodation,has_playground,has_quiz,has_delivery,is_open,ai_message_de,ai_message_en,ai_message_fr,ai_message_it,ai_message_sr,ai_message_ua,status,rating,image_url,website_url,category,contact_info,opening_hours"

export async function fetchFarmsFromSupabase(supabase: SupabaseClient | null): Promise<Farm[]> {
  if (!supabase) return []

  const { data, error } = await supabase.from("farms").select(FARMS_SELECT).returns<SupabaseFarmRow[]>()

  if (error || !data) {
    const e = error as { message?: string; details?: string; hint?: string; code?: string } | undefined
    console.error(
      "Failed to load farms from Supabase:",
      [e?.message, e?.details, e?.hint, e?.code].filter(Boolean).join(" | ") || "(kein Text)",
      error,
    )
    return []
  }

  return data.map(mapSupabaseFarmRow)
}
