import type { CategoryKey, Farm, VenueKind } from "@/lib/data"

/** Shape accepted by POST /api/admin/farms after normalization */
export type AdminFarmApiPayload = {
  name: string
  address: string
  latitude: number
  longitude: number
  website_url: string
  image_url: string
  category: VenueKind
  status: "active" | "inactive"
  rating: number
  products: string[]
  has_shop: boolean
  has_parking: boolean
  has_restaurant: boolean
  has_accommodation: boolean
  has_playground: boolean
  has_quiz: boolean
  has_delivery: boolean
  is_open: boolean
  ai_message_de: string
  ai_message_en: string
  ai_message_fr: string
  ai_message_it: string
  ai_message_sr: string
  ai_message_ua: string
  contact_info: Record<string, string>
  opening_hours: Record<string, { open: string; close: string; closed: boolean }>
}

const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

const PRODUCT_ALIASES: Record<string, CategoryKey> = {
  milch: "milch",
  milk: "milch",
  käse: "kaese",
  kaese: "kaese",
  kase: "kaese",
  cheese: "kaese",
  fromage: "kaese",
  eier: "eier",
  eggs: "eier",
  oeufs: "eier",
  fleisch: "fleisch",
  meat: "fleisch",
  viande: "fleisch",
  obst: "obst",
  fruit: "obst",
  fruits: "obst",
  gemüse: "gemuese",
  gemuese: "gemuese",
  gemuse: "gemuese",
  vegetables: "gemuese",
  legumes: "gemuese",
  honig: "honig",
  honey: "honig",
  miel: "honig",
  kräuter: "kraeuter",
  kraeuter: "kraeuter",
  herbs: "kraeuter",
}

const VALID_CATEGORY_KEYS: CategoryKey[] = [
  "milch",
  "kaese",
  "eier",
  "fleisch",
  "obst",
  "honig",
  "gemuese",
  "kraeuter",
]
const CATEGORY_KEY_SET = new Set<string>(VALID_CATEGORY_KEYS)

function toStr(v: unknown): string {
  return typeof v === "string" ? v.trim() : ""
}

function toNum(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string") {
    const n = Number(v.trim().replace(",", "."))
    return Number.isFinite(n) ? n : null
  }
  return null
}

function mapProductToken(raw: string): CategoryKey | null {
  const normalized = raw.trim().toLowerCase().replace(/\s+/g, "_").replace("ü", "ue").replace("ä", "ae").replace("ö", "oe")
  if (CATEGORY_KEY_SET.has(normalized)) return normalized as CategoryKey
  return PRODUCT_ALIASES[normalized] ?? PRODUCT_ALIASES[raw.trim().toLowerCase()] ?? null
}

function normalizeProducts(value: unknown): CategoryKey[] {
  if (!Array.isArray(value)) return []
  const out: CategoryKey[] = []
  for (const item of value) {
    if (typeof item !== "string") continue
    const k = mapProductToken(item)
    if (k && !out.includes(k)) out.push(k)
  }
  return out
}

function normalizeStatus(value: unknown): "active" | "inactive" {
  const s = String(value ?? "")
    .trim()
    .toLowerCase()
  if (s === "inactive" || s === "inaktiv" || s === "false" || s === "0") return "inactive"
  return "active"
}

function normalizeCategory(value: unknown): VenueKind {
  const c = String(value ?? "farm")
    .trim()
    .toLowerCase()
  if (c === "shop") return "shop"
  if (c === "attraction") return "attraction"
  return "farm"
}

function normalizeOpeningHours(raw: unknown): Record<string, { open: string; close: string; closed: boolean }> {
  const out: Record<string, { open: string; close: string; closed: boolean }> = {}
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    for (const k of DAY_KEYS) out[k] = { open: "", close: "", closed: true }
    return out
  }
  const src = raw as Record<string, unknown>
  for (const k of DAY_KEYS) {
    const entry = src[k]
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      out[k] = { open: "", close: "", closed: true }
      continue
    }
    const e = entry as Record<string, unknown>
    const closed = Boolean(e.closed)
    let open = typeof e.open === "string" ? e.open : typeof e.from === "string" ? e.from : ""
    let close = typeof e.close === "string" ? e.close : typeof e.to === "string" ? e.to : ""
    if (open === "null" || open === null) open = ""
    if (close === "null" || close === null) close = ""
    if (closed) {
      out[k] = { open: "", close: "", closed: true }
    } else {
      out[k] = { open: open.trim(), close: close.trim(), closed: false }
    }
  }
  return out
}

function normalizeContact(raw: Record<string, unknown>): Record<string, string> {
  const phone = toStr(raw.telefon ?? raw.phone ?? raw.tel)
  const email = toStr(raw.email ?? raw.e_mail)
  const instagram = toStr(raw.instagram)
  const facebook = toStr(raw.facebook)
  const telegram = toStr(raw.telegram)
  const whatsapp = toStr(raw.whatsapp)
  const out: Record<string, string> = {}
  if (phone) out.phone = phone
  if (email) out.email = email
  if (instagram) out.instagram = instagram
  if (facebook) out.facebook = facebook
  if (telegram) out.telegram = telegram
  if (whatsapp) out.whatsapp = whatsapp
  const nested = raw.contact_info
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    for (const [k, v] of Object.entries(nested as Record<string, unknown>)) {
      if (typeof v === "string" && v.trim()) out[k] = v.trim()
    }
  }
  return out
}

export type NormalizeFarmResult = {
  ok: true
  payload: AdminFarmApiPayload
  warnings: string[]
} | {
  ok: false
  error: string
}

export function normalizeImportedFarmRecord(raw: Record<string, unknown>): NormalizeFarmResult {
  const warnings: string[] = []
  const name = toStr(raw.name)
  if (!name) return { ok: false, error: "Feld name fehlt oder ist leer." }

  const address = toStr(raw.address ?? raw.adresse ?? raw.Adresse)
  if (!address) return { ok: false, error: "Feld address/adresse fehlt oder ist leer." }

  const lat = toNum(raw.latitude ?? raw.lat)
  const lng = toNum(raw.longitude ?? raw.lng)
  if (lat === null || lng === null) return { ok: false, error: "latitude/longitude fehlen oder sind ungültig." }

  const website_url = toStr(raw.website_url ?? raw.website ?? raw.Website)
  const image_url = toStr(raw.image_url ?? raw.image ?? raw.Image_URL)

  const products = normalizeProducts(raw.products)
  if (products.length === 0) warnings.push("Keine gültigen Produktschlüssel erkannt (milch, kaese, eier, …).")

  const contact_info = normalizeContact(raw)
  if (!contact_info.email) warnings.push("Keine E-Mail im Datensatz (optional, aber oft gewünscht).")

  const opening_hours = normalizeOpeningHours(raw.opening_hours)

  const payload: AdminFarmApiPayload = {
    name,
    address,
    latitude: lat,
    longitude: lng,
    website_url: website_url,
    image_url,
    category: normalizeCategory(raw.category),
    status: normalizeStatus(raw.status),
    rating: toNum(raw.rating) ?? 0,
    products,
    has_shop: Boolean(raw.has_shop),
    has_parking: Boolean(raw.has_parking),
    has_restaurant: Boolean(raw.has_restaurant),
    has_accommodation: Boolean(raw.has_accommodation),
    has_playground: Boolean(raw.has_playground),
    has_quiz: Boolean(raw.has_quiz),
    has_delivery: Boolean(raw.has_delivery),
    is_open: Boolean(raw.is_open),
    ai_message_de: toStr(raw.ai_message_de),
    ai_message_en: toStr(raw.ai_message_en),
    ai_message_fr: toStr(raw.ai_message_fr),
    ai_message_it: toStr(raw.ai_message_it),
    ai_message_sr: toStr(raw.ai_message_sr),
    ai_message_ua: toStr(raw.ai_message_ua),
    contact_info,
    opening_hours,
  }

  return { ok: true, payload, warnings }
}

export function parseImportedFarmJson(text: string): { records: Record<string, unknown>[]; error?: string } {
  const trimmed = text.trim()
  if (!trimmed) return { records: [], error: "Leerer Text." }
  try {
    const parsed = JSON.parse(trimmed) as unknown
    if (Array.isArray(parsed)) {
      const records = parsed.filter((x): x is Record<string, unknown> => x !== null && typeof x === "object" && !Array.isArray(x))
      if (records.length === 0) return { records: [], error: "Array enthält keine Objekte." }
      return { records }
    }
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return { records: [parsed as Record<string, unknown>] }
    }
    return { records: [], error: "JSON muss ein Objekt oder ein Array von Objekten sein." }
  } catch {
    return { records: [], error: "Ungültiges JSON." }
  }
}

export function apiPayloadToFarmPreview(payload: AdminFarmApiPayload, id: string): Farm {
  const products = payload.products.filter((p): p is CategoryKey => typeof p === "string")
  const categories = (products.length > 0 ? products : []) as Farm["categories"]
  const productKeys = (products.length > 0 ? products : []) as Farm["products"]

  return {
    id,
    name: payload.name,
    address: payload.address,
    lat: payload.latitude,
    lng: payload.longitude,
    category: payload.category,
    distanceKm: 0,
    rating: payload.rating,
    reviewCount: 0,
    openNow: payload.is_open,
    status: payload.status === "inactive" ? "inactive" : "active",
    categories,
    products: productKeys,
    hours: "",
    image: payload.image_url || "/placeholder.svg",
    bio: false,
    features: {
      shop: payload.has_shop,
      parking: payload.has_parking,
      restaurant: payload.has_restaurant,
      playground: payload.has_playground,
    },
    seasonal: [],
    description: payload.ai_message_de || payload.ai_message_ua || "",
    reviews: [],
    attractionIds: [],
    image_url: payload.image_url,
    website_url: payload.website_url,
    ai_message_de: payload.ai_message_de,
    ai_message_en: payload.ai_message_en,
    ai_message_fr: payload.ai_message_fr,
    ai_message_it: payload.ai_message_it,
    ai_message_sr: payload.ai_message_sr,
    ai_message_ua: payload.ai_message_ua,
    has_shop: payload.has_shop,
    has_parking: payload.has_parking,
    has_restaurant: payload.has_restaurant,
    has_accommodation: payload.has_accommodation,
    has_playground: payload.has_playground,
    has_quiz: payload.has_quiz,
    has_delivery: payload.has_delivery,
    is_open: payload.is_open,
    contact_info: Object.keys(payload.contact_info).length > 0 ? payload.contact_info : null,
    opening_hours: payload.opening_hours,
  }
}

const COORD_DUP_EPS = 0.00035

function normalizeForDuplicate(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ")
}

function coordinatesNearlyEqual(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
  eps = COORD_DUP_EPS,
): boolean {
  return Math.abs(aLat - bLat) < eps && Math.abs(aLng - bLng) < eps
}

/** Same import list: index of an earlier row that conflicts with `index`. */
export function duplicateEarlierInPayloadBatch(
  payloads: AdminFarmApiPayload[],
  index: number,
): number | null {
  const cur = payloads[index]
  if (!cur) return null
  for (let j = 0; j < index; j++) {
    const prev = payloads[j]!
    const sameNameAddr =
      normalizeForDuplicate(prev.name) === normalizeForDuplicate(cur.name) &&
      normalizeForDuplicate(prev.address) === normalizeForDuplicate(cur.address)
    if (sameNameAddr) return j
    if (coordinatesNearlyEqual(prev.latitude, prev.longitude, cur.latitude, cur.longitude)) return j
  }
  return null
}

/** Match against farms already loaded in admin (same as in DB). */
export function findExistingFarmDuplicate(payload: AdminFarmApiPayload, farms: Farm[]): Farm | null {
  const nameKey = normalizeForDuplicate(payload.name)
  const addrKey = normalizeForDuplicate(payload.address)
  for (const f of farms) {
    if (normalizeForDuplicate(f.name) === nameKey && normalizeForDuplicate(f.address) === addrKey) return f
    if (
      Number.isFinite(f.lat) &&
      Number.isFinite(f.lng) &&
      coordinatesNearlyEqual(f.lat, f.lng, payload.latitude, payload.longitude)
    ) {
      return f
    }
  }
  return null
}
