import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"

const ADMIN_AUTH_HEADER = "x-admin-auth"
const ADMIN_AUTH_VALUE = "Gloryadmin:Glory27041958"

type ReviewRow = {
  id: string
  farm_id: string | null
  author_name: string | null
  rating: number | null
  text: string | null
  created_at: string | null
}

function isAdminAuthorized(request: Request): boolean {
  return request.headers.get(ADMIN_AUTH_HEADER) === ADMIN_AUTH_VALUE
}

function toInt(value: unknown): number | null {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : Number.NaN
  if (!Number.isFinite(n)) return null
  return Math.trunc(n)
}

export async function GET(request: Request) {
  if (!isAdminAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const { data, error } = await supabase
    .from("reviews")
    .select("id,farm_id,author_name,rating,text,created_at")
    .order("created_at", { ascending: false })
    .limit(500)
    .returns<ReviewRow[]>()

  if (error) return Response.json({ error: error.message ?? "Fetch failed" }, { status: 400 })
  return Response.json({ reviews: data ?? [] })
}

export async function PUT(request: Request) {
  if (!isAdminAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const body = (await request.json()) as Record<string, unknown>
  const id = typeof body.id === "string" ? body.id.trim() : ""
  if (!id) return Response.json({ error: "Invalid payload" }, { status: 400 })

  const patch: Partial<ReviewRow> = {}
  if (typeof body.author_name === "string") patch.author_name = body.author_name.trim()
  if (typeof body.text === "string") patch.text = body.text.trim()
  if (body.rating !== undefined) patch.rating = toInt(body.rating)

  const { data, error } = await supabase
    .from("reviews")
    .update(patch)
    .eq("id", id)
    .select("id,farm_id,author_name,rating,text,created_at")
    .single<ReviewRow>()

  if (error || !data) return Response.json({ error: error?.message ?? "Update failed" }, { status: 400 })
  return Response.json({ review: data })
}

export async function DELETE(request: Request) {
  if (!isAdminAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const body = (await request.json()) as { id?: string }
  const id = typeof body.id === "string" ? body.id.trim() : ""
  if (!id) return Response.json({ error: "Invalid payload" }, { status: 400 })

  const { error } = await supabase.from("reviews").delete().eq("id", id)
  if (error) return Response.json({ error: error.message ?? "Delete failed" }, { status: 400 })
  return Response.json({ ok: true, id })
}

