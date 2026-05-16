import type { Farm } from "@/lib/data"
import { getPublicSiteOrigin } from "@/lib/site-url"

export type FarmContactDetails = {
  email: string
  phone: string
  website: string
  websiteUrl: string
  contactHref: string
}

export function parseFarmContact(farm: Farm): FarmContactDetails {
  const contactInfo =
    farm.contact_info && typeof farm.contact_info === "object"
      ? (farm.contact_info as Record<string, unknown>)
      : {}

  const email = typeof contactInfo.email === "string" ? contactInfo.email.trim() : ""
  const phone =
    (typeof contactInfo.phone === "string" && contactInfo.phone.trim()) ||
    (typeof contactInfo.tel === "string" && contactInfo.tel.trim()) ||
    ""

  const websiteRaw =
    (typeof farm.website_url === "string" && farm.website_url.trim()) ||
    (typeof contactInfo.website === "string" && contactInfo.website.trim()) ||
    ""

  const websiteUrl = websiteRaw
    ? /^https?:\/\//i.test(websiteRaw)
      ? websiteRaw
      : `https://${websiteRaw}`
    : ""

  const contactHref = phone
    ? `tel:${phone.replace(/\s+/g, "")}`
    : email
      ? `mailto:${email}`
      : ""

  return { email, phone, website: websiteRaw, websiteUrl, contactHref }
}

export function pickPublicPageBody(farm: Farm): string {
  return (
    farm.public_page_text?.trim() ||
    farm.ai_message_de?.trim() ||
    farm.description?.trim() ||
    ""
  )
}

export function pickPublicAiSummary(farm: Farm): string {
  return (
    farm.ai_summary_content?.trim() ||
    farm.ai_summary_de?.trim() ||
    farm.ai_summary_en?.trim() ||
    farm.ai_summary_fr?.trim() ||
    farm.ai_summary_it?.trim() ||
    ""
  )
}

export function buildMapsRouteUrl(farm: Farm): string {
  return `https://www.google.com/maps/search/?api=1&query=${farm.lat},${farm.lng}`
}

export function buildPublicFarmCanonicalUrl(slug: string): string {
  return `${getPublicSiteOrigin()}/hof/${encodeURIComponent(slug.trim())}`
}

export function formatOpeningHoursDisplay(farm: Farm): string {
  const hours = farm.hours?.trim()
  if (!hours) return ""
  if (!hours.startsWith("{") && !hours.startsWith("[")) return hours
  try {
    const parsed = JSON.parse(hours) as unknown
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>)
        .map(([day, value]) => {
          if (typeof value === "string") return `${day}: ${value}`
          if (typeof value === "object" && value !== null) {
            const o = value as Record<string, unknown>
            if (o.closed === true) return `${day}: geschlossen`
            const open = typeof o.open === "string" ? o.open : ""
            const close = typeof o.close === "string" ? o.close : ""
            if (open && close) return `${day}: ${open}–${close}`
          }
          return `${day}: ${String(value)}`
        })
        .join("\n")
    }
  } catch {
    return hours
  }
  return hours
}
