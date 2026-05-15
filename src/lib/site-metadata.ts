import type { Metadata } from "next"
import { BRAND_LOGO_SRC } from "@/lib/brand-assets"
import { absoluteMediaUrl, getPublicSiteOrigin } from "@/lib/site-url"
import { SITE_ICONS } from "@/lib/site-icons"

const SITE_NAME = "Hofladen Radar"

const ROOT_TITLE = "Hofladen Radar — Hofläden und Bauernhöfe in deiner Nähe finden"
const ROOT_DESCRIPTION =
  "Interaktive Karte mit Hofläden, Bauernhöfen und Bauernmärkten in der Schweiz. Frische Produkte direkt vom Hof: Milch, Käse, Eier, Fleisch, Obst, Gemüse, Honig und Kräuter."

/** Root layout metadata — intentionally no `generator` (no v0.app / create-next-app tag). */
export function buildRootMetadata(): Metadata {
  const site = getPublicSiteOrigin()
  const ogImage = absoluteMediaUrl(BRAND_LOGO_SRC)

  return {
    metadataBase: new URL(site),
    title: ROOT_TITLE,
    description: ROOT_DESCRIPTION,
    keywords: [
      "Hofladen Schweiz",
      "Hofläden in der Nähe",
      "Bauernhof Schweiz",
      "Direktvermarktung Schweiz",
      "Regionale Produkte",
      "Milch Käse Eier Hofladen",
    ],
    applicationName: SITE_NAME,
    openGraph: {
      type: "website",
      locale: "de_CH",
      url: site,
      siteName: SITE_NAME,
      title: ROOT_TITLE,
      description: ROOT_DESCRIPTION,
      images: [{ url: ogImage, alt: SITE_NAME }],
    },
    twitter: {
      card: "summary_large_image",
      title: ROOT_TITLE,
      description: ROOT_DESCRIPTION,
      images: [ogImage],
    },
    icons: SITE_ICONS,
  }
}
