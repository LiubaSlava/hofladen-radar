import type { CategoryKey, Farm, VenueKind } from "@/lib/data"

export type SupabaseFarmRow = {
  id: string
  name: string
  address: string
  latitude: number | string
  longitude: number | string
  created_at?: string | null
  products?: string[] | null
  has_shop?: boolean | null
  has_parking?: boolean | null
  has_restaurant?: boolean | null
  has_accommodation?: boolean | null
  has_playground?: boolean | null
  has_quiz?: boolean | null
  has_delivery?: boolean | null
  is_open?: boolean | null
  ai_message_de?: string | null
  ai_message_en?: string | null
  ai_message_fr?: string | null
  ai_message_it?: string | null
  ai_message_sr?: string | null
  ai_message_ua?: string | null
  status?: string | null
  rating?: number | null
  image_url?: string | null
  website_url?: string | null
  /** Standort-Typ in der DB: `farm` | `shop` (nicht Produktkategorie). */
  category?: string | null
  contact_info?: Record<string, unknown> | null
  opening_hours?: Record<string, unknown> | string | null
  public_slug?: string | null
  seo_title?: string | null
  seo_description?: string | null
  public_page_text?: string | null
}

const CATEGORY_KEYS: readonly CategoryKey[] = [
  "milch",
  "kaese",
  "eier",
  "fleisch",
  "obst",
  "honig",
  "gemuese",
  "kraeuter",
]

const CATEGORY_SET = new Set<CategoryKey>(CATEGORY_KEYS)

function toCategoryArray(value: unknown): CategoryKey[] {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is CategoryKey => typeof item === "string" && CATEGORY_SET.has(item as CategoryKey))
}

function toCategoryKey(value: string | null | undefined): CategoryKey | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_")
  return CATEGORY_SET.has(normalized as CategoryKey) ? (normalized as CategoryKey) : null
}

function openingHoursToText(value: SupabaseFarmRow["opening_hours"]): string {
  if (!value) return ""
  if (typeof value === "string") return value
  return JSON.stringify(value)
}

function parseTimeToMinutes(value: string): number | null {
  const m = value.trim().match(/^(\d{1,2}):(\d{2})$/)
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

function isOpenByWindow(nowMinutes: number, openMinutes: number, closeMinutes: number): boolean {
  if (openMinutes === closeMinutes) return false
  if (openMinutes < closeMinutes) return nowMinutes >= openMinutes && nowMinutes < closeMinutes
  // overnight window, e.g. 22:00 -> 02:00
  return nowMinutes >= openMinutes || nowMinutes < closeMinutes
}

function readOpeningEntry(
  source: Record<string, unknown>,
  dayAliases: string[],
): { open: string; close: string; closed?: boolean } | null {
  for (const key of dayAliases) {
    const raw = source[key]
    if (!raw) continue

    if (typeof raw === "string") {
      const normalized = raw.trim().toLowerCase()
      if (normalized === "closed" || normalized === "geschlossen" || normalized === "zu") {
        return { open: "", close: "", closed: true }
      }
      const range = normalized.match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/)
      if (range) return { open: range[1], close: range[2] }
      continue
    }

    if (typeof raw === "object" && !Array.isArray(raw)) {
      const item = raw as Record<string, unknown>
      const open = typeof item.open === "string" ? item.open : typeof item.from === "string" ? item.from : ""
      const close = typeof item.close === "string" ? item.close : typeof item.to === "string" ? item.to : ""
      const closed = Boolean(item.closed)
      return { open, close, closed }
    }
  }

  return null
}

function deriveOpenNow(
  openingHours: SupabaseFarmRow["opening_hours"],
  explicitIsOpen: boolean | null | undefined,
): boolean {
  const fallback = explicitIsOpen ?? false
  if (!openingHours) return fallback

  let parsed: Record<string, unknown> | null = null
  if (typeof openingHours === "string") {
    try {
      const value = JSON.parse(openingHours)
      if (value && typeof value === "object" && !Array.isArray(value)) parsed = value as Record<string, unknown>
    } catch {
      return fallback
    }
  } else if (typeof openingHours === "object" && !Array.isArray(openingHours)) {
    parsed = openingHours as Record<string, unknown>
  }
  if (!parsed) return fallback

  const day = new Date().getDay()
  const aliasesByDay: Record<number, string[]> = {
    0: ["sun", "sunday", "so"],
    1: ["mon", "monday", "mo"],
    2: ["tue", "tuesday", "di"],
    3: ["wed", "wednesday", "mi"],
    4: ["thu", "thursday", "do"],
    5: ["fri", "friday", "fr"],
    6: ["sat", "saturday", "sa"],
  }
  const entry = readOpeningEntry(parsed, aliasesByDay[day] ?? [])
  if (!entry) return fallback
  if (entry.closed) return false
  const openMinutes = parseTimeToMinutes(entry.open)
  const closeMinutes = parseTimeToMinutes(entry.close)
  if (openMinutes === null || closeMinutes === null) return fallback

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return isOpenByWindow(nowMinutes, openMinutes, closeMinutes)
}

function normalizeFarmImageUrl(raw: string | null | undefined): string {
  const fallback = "/placeholder.svg"
  if (!raw) return fallback
  const value = raw.trim()
  if (!value) return fallback

  if (
    value.startsWith("/") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value
  }
  if (value.startsWith("//")) return `https:${value}`

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "")
  if (!base) return value
  if (
    value.startsWith("storage/") ||
    value.startsWith("storage/v1/") ||
    value.startsWith("object/public/") ||
    value.startsWith("public/")
  ) {
    return `${base}/${value.replace(/^\/+/, "")}`
  }

  return value
}

function buildGermanFallbackDescription(row: SupabaseFarmRow): string {
  const name = row.name.trim() || "Dieser Hof"
  const address = row.address.trim()
  return address ? `${name} in ${address}. Weitere Informationen folgen.` : `${name}. Weitere Informationen folgen.`
}

function pickDescription(row: SupabaseFarmRow): string {
  const germanDescription = row.ai_message_de?.trim()
  if (germanDescription) return germanDescription
  return buildGermanFallbackDescription(row)
}

function toCoordinate(value: number | string, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

/** DB-Spalte `category`: `farm` | `shop` (Standort-Typ). */
function parseListingCategory(raw: string | null | undefined): VenueKind {
  const v = (raw ?? "").trim().toLowerCase()
  if (v === "shop") return "shop"
  if (v === "attraction") return "attraction"
  if (v === "farm") return "farm"
  return "farm"
}

export function mapSupabaseFarmRow(row: SupabaseFarmRow): Farm {
  const listingCategory = parseListingCategory(row.category)

  const mappedProducts = toCategoryArray(row.products)
  let categories: CategoryKey[] =
    mappedProducts.length > 0 ? (Array.from(new Set(mappedProducts)) as CategoryKey[]) : []
  const legacyProductCategory = toCategoryKey(row.category)
  if (categories.length === 0 && legacyProductCategory) categories = [legacyProductCategory]
  const products = mappedProducts.length > 0 ? mappedProducts : categories

  return {
    id: row.id,
    name: row.name,
    address: row.address,
    lat: toCoordinate(row.latitude, 47.4239),
    lng: toCoordinate(row.longitude, 9.3767),
    category: listingCategory,
    distanceKm: 0,
    rating: row.rating ?? 0,
    reviewCount: 0,
    openNow: deriveOpenNow(row.opening_hours, row.is_open),
    status: row.status === "inactive" ? "inactive" : "active",
    categories,
    products,
    hours: openingHoursToText(row.opening_hours),
    image: normalizeFarmImageUrl(row.image_url),
    bio: false,
    features: {
      shop: row.has_shop ?? false,
      parking: row.has_parking ?? false,
      restaurant: row.has_restaurant ?? false,
      playground: row.has_playground ?? false,
    },
    seasonal: [],
    description: pickDescription(row),
    reviews: [],
    attractionIds: [],
    image_url: row.image_url ?? "",
    website_url: row.website_url ?? "",
    ai_message_de: row.ai_message_de ?? "",
    ai_message_en: row.ai_message_en ?? "",
    ai_message_fr: row.ai_message_fr ?? "",
    ai_message_it: row.ai_message_it ?? "",
    ai_message_sr: row.ai_message_sr ?? "",
    ai_message_ua: row.ai_message_ua ?? "",
    has_shop: row.has_shop ?? false,
    has_parking: row.has_parking ?? false,
    has_restaurant: row.has_restaurant ?? false,
    has_accommodation: row.has_accommodation ?? false,
    has_playground: row.has_playground ?? false,
    has_quiz: row.has_quiz ?? false,
    has_delivery: row.has_delivery ?? false,
    is_open: row.is_open ?? false,
    contact_info: row.contact_info ?? null,
    opening_hours: row.opening_hours ?? null,
    public_slug: row.public_slug?.trim() || undefined,
    seo_title: row.seo_title?.trim() || undefined,
    seo_description: row.seo_description?.trim() || undefined,
    public_page_text: row.public_page_text?.trim() || undefined,
  }
}
