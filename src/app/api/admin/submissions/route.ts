import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { isAdminAuthorized } from "@/lib/admin-auth"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import { mapFarmRowWithKiUeberblick } from "@/lib/ki-ueberblick"
import { suggestFarmPublicSlug, uniqueFarmSlugFromNameAddress } from "@/lib/farm-slug-suggest"

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const { data, error } = await supabase
    .from("farms")
    .select(FARM_TABLE_SELECT)
    .eq("status", "pending")
    .order("submitted_at", { ascending: false, nullsFirst: false })

  if (error) return Response.json({ error: error.message ?? "Fetch failed" }, { status: 400 })

  const rows = (data ?? []) as SupabaseFarmRow[]
  const farms = await Promise.all(rows.map((row) => mapFarmRowWithKiUeberblick(supabase, row)))
  return Response.json({ submissions: farms })
}

export async function PATCH(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const body = (await request.json()) as { id?: string; action?: string }
  const id = typeof body.id === "string" ? body.id.trim() : ""
  const action = typeof body.action === "string" ? body.action.trim() : ""
  if (!id) return Response.json({ error: "Invalid payload" }, { status: 400 })

  if (action === "reject") {
    const { error } = await supabase.from("farms").delete().eq("id", id).eq("status", "pending")
    if (error) return Response.json({ error: error.message ?? "Delete failed" }, { status: 400 })
    return Response.json({ ok: true, id })
  }

  if (action !== "approve") {
    return Response.json({ error: "Unknown action" }, { status: 400 })
  }

  const { data: existing, error: fetchError } = await supabase
    .from("farms")
    .select("id,name,address,public_slug")
    .eq("id", id)
    .eq("status", "pending")
    .maybeSingle()

  if (fetchError || !existing) {
    return Response.json({ error: "Einreichung nicht gefunden." }, { status: 404 })
  }

  const row = existing as { id: string; name: string; address: string; public_slug: string | null }
  const { data: slugRows } = await supabase.from("farms").select("public_slug")
  const takenSlugs = new Set(
    (slugRows ?? [])
      .map((r) => (typeof r.public_slug === "string" ? r.public_slug.trim().toLowerCase() : ""))
      .filter(Boolean),
  )
  const public_slug =
    row.public_slug?.trim() ||
    uniqueFarmSlugFromNameAddress(row.name, row.address, takenSlugs) ||
    suggestFarmPublicSlug(row.name, row.address)

  const { data, error } = await supabase
    .from("farms")
    .update({ status: "active", public_slug })
    .eq("id", id)
    .eq("status", "pending")
    .select(FARM_TABLE_SELECT)
    .single<SupabaseFarmRow>()

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Approve failed" }, { status: 400 })
  }

  return Response.json({ farm: await mapFarmRowWithKiUeberblick(supabase, data) })
}
