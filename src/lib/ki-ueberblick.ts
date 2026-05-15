import type { SupabaseClient } from "@supabase/supabase-js"
import type { Farm } from "@/lib/data"
import { mapSupabaseFarmRow, type SupabaseFarmRow } from "@/lib/farms-mapper"
import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"
import { withTimeout } from "@/lib/with-timeout"

const KI_UEBERBLICK_MS = 15_000

export type KiUeberblickRow = {
  id?: string
  farm_id: string
  content?: string | null
  created_at?: string | null
}

export const KI_UEBERBLICK_SELECT = "id,farm_id,content,created_at"

function toText(value: string | null | undefined): string {
  return value?.trim() ?? ""
}

export function applyKiUeberblickToFarm(farm: Farm, summary?: KiUeberblickRow | null): Farm {
  const content = toText(summary?.content)
  return {
    ...farm,
    ai_summary_content: content,
    ai_summary_de: content,
    ai_summary_en: content,
    ai_summary_fr: content,
    ai_summary_it: content,
    ai_summary_sr: content,
    ai_summary_ua: content,
  }
}

export async function loadKiUeberblickMap(
  supabase: SupabaseClient | null,
  farmIds: string[],
): Promise<Map<string, KiUeberblickRow>> {
  if (!supabase || farmIds.length === 0) return new Map()

  const runQuery = async (client: SupabaseClient) =>
    client
      .from("ki_ueberblick")
      .select(KI_UEBERBLICK_SELECT)
      .in("farm_id", farmIds)
      .returns<KiUeberblickRow[]>()

  let data: KiUeberblickRow[] | null = null
  let error: { message?: string } | null = null
  try {
    const res = await withTimeout(runQuery(supabase), KI_UEBERBLICK_MS, "ki_ueberblick")
    data = res.data
    error = res.error
  } catch {
    return new Map()
  }

  if (!error && data) {
    return new Map(data.map((row) => [row.farm_id, row]))
  }

  const adminClient = createSupabaseAdminServer()
  if (adminClient && adminClient !== supabase) {
    let adminData: KiUeberblickRow[] | null = null
    let adminError: { message?: string } | null = null
    try {
      const res = await withTimeout(runQuery(adminClient), KI_UEBERBLICK_MS, "ki_ueberblick admin")
      adminData = res.data
      adminError = res.error
    } catch {
      return new Map()
    }
    if (!adminError && adminData) {
      return new Map(adminData.map((row) => [row.farm_id, row]))
    }
    console.error(
      "Failed to load ki_ueberblick with admin fallback:",
      adminError?.message ?? adminError,
    )
    return new Map()
  }

  console.error("Failed to load ki_ueberblick:", error?.message ?? error)
  return new Map()
}

export async function mapFarmRowsWithKiUeberblick(
  supabase: SupabaseClient | null,
  rows: SupabaseFarmRow[],
): Promise<Farm[]> {
  const farms = rows.map(mapSupabaseFarmRow)
  const aiByFarmId = await loadKiUeberblickMap(
    supabase,
    farms.map((farm) => farm.id),
  )
  return farms.map((farm) => applyKiUeberblickToFarm(farm, aiByFarmId.get(farm.id)))
}

export async function mapFarmRowWithKiUeberblick(
  supabase: SupabaseClient | null,
  row: SupabaseFarmRow,
): Promise<Farm> {
  const [farm] = await mapFarmRowsWithKiUeberblick(supabase, [row])
  return farm
}
