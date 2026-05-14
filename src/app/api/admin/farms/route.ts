import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import { mapFarmRowWithKiUeberblick } from "@/lib/ki-ueberblick"
import { isPersistedFarmUuid } from "@/lib/farm-id"
import { normalizePublicSlugInput } from "@/lib/seo-slug"

const ADMIN_AUTH_HEADER = "x-admin-auth"
const ADMIN_AUTH_VALUE = "Gloryadmin:Glory27041958"

type FarmPayload = {
  id?: string
  name: string
  address?: string
  latitude: number
  longitude: number
  products?: string[]
  has_shop?: boolean
  has_parking?: boolean
  has_restaurant?: boolean
  has_accommodation?: boolean
  has_playground?: boolean
  has_quiz?: boolean
  has_delivery?: boolean
  is_open?: boolean
  ai_message_de?: string
  ai_message_en?: string
  ai_message_fr?: string
  ai_message_it?: string
  ai_message_sr?: string
  ai_message_ua?: string
  status?: string
  rating?: number
  image_url?: string
  website_url?: string
  contact_info?: unknown
  opening_hours?: unknown
  category?: "farm" | "shop" | "attraction"
  public_slug?: string | null
  seo_title?: string | null
  seo_description?: string | null
  public_page_text?: string | null
}

function parseJsonMaybe(value: unknown): unknown {
  if (typeof value !== "string") return value ?? null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  try {
    return JSON.parse(trimmed)
  } catch {
    return null
  }
}

function toNumberSafe(value: unknown): number {
  if (typeof value === "number") return value
  if (typeof value !== "string") return Number.NaN
  const parsed = Number(value.trim().replace(",", "."))
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function trimToNull(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const t = value.trim()
  if (!t) return null
  return t.slice(0, max)
}

function normalizePayload(raw: Record<string, unknown>, isCreate: boolean): FarmPayload {
  const categoryRaw = String(raw.category ?? "farm")
  const category = categoryRaw === "shop" || categoryRaw === "attraction" ? categoryRaw : "farm"
  const products = Array.isArray(raw.products)
    ? raw.products.filter((x): x is string => typeof x === "string")
    : []

  const rawId =
    typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : undefined

  return {
    id: isCreate
      ? rawId && isPersistedFarmUuid(rawId)
        ? rawId
        : crypto.randomUUID()
      : rawId && isPersistedFarmUuid(rawId)
        ? rawId
        : undefined,
    name: String(raw.name ?? "").trim(),
    address: String(raw.address ?? "").trim(),
    latitude: toNumberSafe(raw.latitude),
    longitude: toNumberSafe(raw.longitude),
    products,
    has_shop: Boolean(raw.has_shop),
    has_parking: Boolean(raw.has_parking),
    has_restaurant: Boolean(raw.has_restaurant),
    has_accommodation: Boolean(raw.has_accommodation),
    has_playground: Boolean(raw.has_playground),
    has_quiz: Boolean(raw.has_quiz),
    has_delivery: Boolean(raw.has_delivery),
    is_open: Boolean(raw.is_open),
    ai_message_de: String(raw.ai_message_de ?? ""),
    ai_message_en: String(raw.ai_message_en ?? ""),
    ai_message_fr: String(raw.ai_message_fr ?? ""),
    ai_message_it: String(raw.ai_message_it ?? ""),
    ai_message_sr: String(raw.ai_message_sr ?? ""),
    ai_message_ua: String(raw.ai_message_ua ?? ""),
    status: String(raw.status ?? "active"),
    rating: Number.isFinite(toNumberSafe(raw.rating)) ? toNumberSafe(raw.rating) : 0,
    image_url: String(raw.image_url ?? ""),
    website_url: String(raw.website_url ?? ""),
    contact_info: parseJsonMaybe(raw.contact_info),
    opening_hours: parseJsonMaybe(raw.opening_hours),
    category,
    public_slug: normalizePublicSlugInput(String(raw.public_slug ?? "")),
    seo_title: trimToNull(raw.seo_title, 200),
    seo_description: trimToNull(raw.seo_description, 320),
    public_page_text: trimToNull(raw.public_page_text, 20000),
  }
}

function isAdminAuthorized(request: Request): boolean {
  return request.headers.get(ADMIN_AUTH_HEADER) === ADMIN_AUTH_VALUE
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }
  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const body = (await request.json()) as Record<string, unknown>
  const payload = normalizePayload(body, true)
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
  const payload = normalizePayload(body, false)
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
