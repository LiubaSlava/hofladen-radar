import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { HofPublicLanding } from "@/components/public/hof-public-landing"
import { fetchActiveFarmByPublicSlug } from "@/lib/fetch-public-farm-by-slug"
import { BRAND_LOGO_SRC } from "@/lib/brand-assets"
import { buildPublicFarmCanonicalUrl } from "@/lib/hof-public-page"
import { SITE_ICONS } from "@/lib/site-icons"
import { absoluteMediaUrl, getPublicSiteOrigin } from "@/lib/site-url"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const farm = await fetchActiveFarmByPublicSlug(slug)
  if (!farm || !farm.public_slug?.trim()) {
    return { title: "Nicht gefunden | Hofladen Radar", robots: { index: false, follow: false } }
  }
  const path = `/hof/${farm.public_slug.trim()}`
  const url = buildPublicFarmCanonicalUrl(farm.public_slug.trim())
  const title = farm.seo_title?.trim() || `${farm.name} | Hofladen Radar`
  const description =
    farm.seo_description?.trim() ||
    farm.ai_message_de?.trim() ||
    farm.description?.trim() ||
    `${farm.name} — ${farm.address}. Hofläden und Höfe in der Schweiz auf Hofladen Radar.`
  const shareImage = farm.image?.trim()
    ? absoluteMediaUrl(farm.image.trim())
    : absoluteMediaUrl(BRAND_LOGO_SRC)
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Hofladen Radar",
      type: "website",
      images: [{ url: shareImage, alt: farm.name }],
    },
    twitter: { card: "summary_large_image", title, description, images: [shareImage] },
    icons: SITE_ICONS,
  }
}

export default async function HofPublicPage({ params }: PageProps) {
  const { slug } = await params
  const farm = await fetchActiveFarmByPublicSlug(slug)
  if (!farm) notFound()

  return <HofPublicLanding farm={farm} />
}
