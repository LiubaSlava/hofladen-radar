import { isPersistedFarmUuid } from "@/lib/farm-id"
import { normalizePublicSlugInput } from "@/lib/seo-slug"

export type FarmDbPayload = {
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
  submitter_name?: string | null
  submitter_email?: string | null
  submitted_at?: string | null
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

/** JSON object for jsonb fields, or plain text (e.g. "Mo–Sa 8–18") from the public form. */
function parseJsonOrPlainText(value: unknown): unknown {
  if (value === null || value === undefined) return null
  if (typeof value === "object") return value
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return trimmed
    }
  }
  return trimmed
}

export function toNumberSafe(value: unknown): number {
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

export function normalizeFarmStatus(raw: unknown, fallback: "active" | "inactive" | "pending" = "active") {
  const v = String(raw ?? fallback).trim().toLowerCase()
  if (v === "inactive") return "inactive"
  if (v === "pending") return "pending"
  if (v === "active") return "active"
  return fallback
}

export function normalizeFarmPayload(raw: Record<string, unknown>, isCreate: boolean): FarmDbPayload {
  const categoryRaw = String(raw.category ?? "farm")
  const category = categoryRaw === "shop" || categoryRaw === "attraction" ? categoryRaw : "farm"
  const products = Array.isArray(raw.products)
    ? raw.products.filter((x): x is string => typeof x === "string")
    : []

  const rawId = typeof raw.id === "string" && raw.id.trim().length > 0 ? raw.id.trim() : undefined

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
    status: normalizeFarmStatus(raw.status),
    rating: Number.isFinite(toNumberSafe(raw.rating)) ? toNumberSafe(raw.rating) : 0,
    image_url: String(raw.image_url ?? ""),
    website_url: String(raw.website_url ?? ""),
    contact_info: parseJsonOrPlainText(raw.contact_info),
    opening_hours: parseJsonOrPlainText(raw.opening_hours),
    category,
    public_slug: normalizePublicSlugInput(String(raw.public_slug ?? "")),
    seo_title: trimToNull(raw.seo_title, 200),
    seo_description: trimToNull(raw.seo_description, 320),
    public_page_text: trimToNull(raw.public_page_text, 20000),
    submitter_name: trimToNull(raw.submitter_name, 120),
    submitter_email: trimToNull(raw.submitter_email, 254),
    submitted_at:
      typeof raw.submitted_at === "string" && raw.submitted_at.trim() ? raw.submitted_at.trim() : null,
  }
}
