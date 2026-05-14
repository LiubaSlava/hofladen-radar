import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import { mapFarmRowWithKiUeberblick, type KiUeberblickRow } from "@/lib/ki-ueberblick"

const ADMIN_AUTH_HEADER = "x-admin-auth"
const ADMIN_AUTH_VALUE = "Gloryadmin:Glory27041958"

function isAdminAuthorized(request: Request): boolean {
  return request.headers.get(ADMIN_AUTH_HEADER) === ADMIN_AUTH_VALUE
}

function normalizeText(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export async function PUT(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createSupabaseAdminServer()
  if (!supabase) {
    return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })
  }

  const body = (await request.json()) as Record<string, unknown>
  const id = typeof body.id === "string" ? body.id.trim() : ""
  if (!id) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const patch: Omit<KiUeberblickRow, "farm_id"> = {
    content: normalizeText(body.content),
  }

  const { data: existing, error: lookupError } = await supabase
    .from("ki_ueberblick")
    .select("farm_id")
    .eq("farm_id", id)
    .maybeSingle<{ farm_id: string }>()

  if (lookupError) {
    return Response.json({ error: lookupError.message ?? "Lookup failed" }, { status: 400 })
  }

  if (existing) {
    const { error } = await supabase.from("ki_ueberblick").update(patch).eq("farm_id", id)
    if (error) {
      return Response.json({ error: error.message ?? "Update failed" }, { status: 400 })
    }
  } else {
    const { error } = await supabase.from("ki_ueberblick").insert({ farm_id: id, ...patch })
    if (error) {
      return Response.json({ error: error.message ?? "Insert failed" }, { status: 400 })
    }
  }

  const { data, error } = await supabase
    .from("farms")
    .select(FARM_TABLE_SELECT)
    .eq("id", id)
    .single<SupabaseFarmRow>()

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Farm fetch failed" }, { status: 400 })
  }

  return Response.json({ farm: await mapFarmRowWithKiUeberblick(supabase, data) })
}
