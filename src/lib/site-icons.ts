import type { Metadata } from "next"
import { BRAND_LOGO_SRC } from "@/lib/brand-assets"
import { absoluteMediaUrl } from "@/lib/site-url"

/** Favicon / apple-touch — same asset as the in-app brand logo (`BRAND_LOGO_SRC`). */
export const SITE_ICONS: NonNullable<Metadata["icons"]> = {
  icon: [{ url: absoluteMediaUrl(BRAND_LOGO_SRC), type: "image/png", sizes: "any" }],
  shortcut: absoluteMediaUrl(BRAND_LOGO_SRC),
  apple: [{ url: absoluteMediaUrl(BRAND_LOGO_SRC), type: "image/png" }],
}
