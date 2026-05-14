/**
 * Canonical public site origin (no trailing slash).
 * Use for share links, SEO previews, sitemap — not `window.location.origin`, so localhost dev still points to prod unless overridden.
 *
 * Optional: `NEXT_PUBLIC_SITE_URL=https://hofladenradar.ch` (or staging URL).
 */
export function getPublicSiteOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://hofladenradar.ch"
  try {
    const normalized = raw.includes("://") ? raw : `https://${raw}`
    const u = new URL(normalized)
    return u.origin.replace(/\/+$/, "")
  } catch {
    return "https://hofladenradar.ch"
  }
}

/** Absolute URL for OG / Twitter / previews. Pass site-relative path (`/logo.png`) or full `https://…`. */
export function absoluteMediaUrl(href: string): string {
  const t = href.trim()
  if (!t) return `${getPublicSiteOrigin()}/logo.png?v=7`
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("data:")) return t
  const base = getPublicSiteOrigin().replace(/\/+$/, "")
  const path = t.startsWith("/") ? t : `/${t}`
  return `${base}${path}`
}
