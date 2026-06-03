import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import { mapFarmRowWithKiUeberblick } from "@/lib/ki-ueberblick"
import { isAdminAuthorized } from "@/lib/admin-auth"
import { normalizeFarmPayload } from "@/lib/farm-payload"

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const body = (await request.json()) as Record<string, unknown>
  const payload = normalizeFarmPayload(body, true)
  if (!payload.name || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("farms")
    .insert(payload)
    .select(FARM_TABLE_SELECT)
    .single<SupabaseFarmRow>()

  if (error || !data) {
    const code = (error as { code?: string } | undefined)?.code
    if (code === "23505") {
      return Response.json({ error: "Dieser URL-Pfad (Slug) ist bereits vergeben." }, { status: 409 })
    }
    return Response.json({ error: error?.message ?? "Insert failed" }, { status: 400 })
  }
  return Response.json({ farm: await mapFarmRowWithKiUeberblick(supabase, data) })
}

export async function PUT(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const body = (await request.json()) as Record<string, unknown>
  const payload = normalizeFarmPayload(body, false)
  if (!payload.id || !payload.name || !Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
    return Response.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { id, ...rest } = payload
  const { data, error } = await supabase
    .from("farms")
    .update(rest)
    .eq("id", id)
    .select(FARM_TABLE_SELECT)
    .single<SupabaseFarmRow>()

  if (error || !data) {
    const code = (error as { code?: string } | undefined)?.code
    if (code === "23505") {
      return Response.json({ error: "Dieser URL-Pfad (Slug) ist bereits vergeben." }, { status: 409 })
    }
    return Response.json({ error: error?.message ?? "Update failed" }, { status: 400 })
  }
  return Response.json({ farm: await mapFarmRowWithKiUeberblick(supabase, data) })
}

export async function DELETE(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const body = (await request.json()) as { id?: string }
  const id = typeof body.id === "string" ? body.id.trim() : ""
  if (!id) return Response.json({ error: "Invalid payload" }, { status: 400 })

  const { error } = await supabase.from("farms").delete().eq("id", id)
  if (error) return Response.json({ error: error.message ?? "Delete failed" }, { status: 400 })
  return Response.json({ ok: true, id })
}
