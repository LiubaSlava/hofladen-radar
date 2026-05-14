import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { fetchActiveFarmByPublicSlug } from "@/lib/fetch-public-farm-by-slug"
import { absoluteMediaUrl, getPublicSiteOrigin } from "@/lib/site-url"
import { BRAND_LOGO_SRC } from "@/lib/brand-assets"

export const dynamic = "force-dynamic"

type PageProps = { params: Promise<{ slug: string }> }

function categoryLabel(category: string): string {
  if (category === "shop") return "Hofladen / Laden"
  if (category === "attraction") return "Attraktion"
  return "Bauernhof"
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const farm = await fetchActiveFarmByPublicSlug(slug)
  if (!farm || !farm.public_slug?.trim()) {
    return { title: "Nicht gefunden | Hofladen Radar", robots: { index: false, follow: false } }
  }
  const path = `/hof/${farm.public_slug.trim()}`
  const url = new URL(path, getPublicSiteOrigin()).href
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
  }
}

export default async function HofPublicPage({ params }: PageProps) {
  const { slug } = await params
  const farm = await fetchActiveFarmByPublicSlug(slug)
  if (!farm) notFound()

  const slugSeg = farm.public_slug!.trim()
  const siteHostname = (() => {
    try {
      return new URL(getPublicSiteOrigin()).hostname
    } catch {
      return "hofladenradar.ch"
    }
  })()
  const bodyText =
    farm.public_page_text?.trim() ||
    farm.ai_message_de?.trim() ||
    farm.description?.trim() ||
    ""

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-card/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-primary hover:underline">
            Hofladen Radar
          </Link>
          <Link
            href="/"
            className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted"
          >
            Zur Karte
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-6 py-10">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{categoryLabel(farm.category)}</p>
        <h1 className="mt-2 text-balance text-3xl font-semibold tracking-tight">{farm.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{farm.address}</p>

        {farm.image ? (
          <div className="relative mt-8 aspect-[16/10] w-full overflow-hidden rounded-2xl border border-border/60 bg-muted">
            <Image
              src={farm.image}
              alt={farm.name}
              fill
              sizes="(max-width: 768px) 100vw, 720px"
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        ) : null}

        {bodyText ? (
          <div className="mt-8 max-w-none">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{bodyText}</p>
          </div>
        ) : null}

        {farm.website_url?.trim() ? (
          <p className="mt-8 text-sm">
            <a
              href={farm.website_url.trim()}
              className="font-medium text-primary underline-offset-4 hover:underline"
              rel="noopener noreferrer"
              target="_blank"
            >
              Webseite des Betriebs
            </a>
          </p>
        ) : null}

        <p className="mt-10 text-xs text-muted-foreground">
          Standort auch auf der interaktiven Karte:{" "}
          <Link href="/" className="text-primary underline-offset-2 hover:underline">
            {siteHostname}
          </Link>
          {slugSeg ? ` — /hof/${slugSeg}` : null}
        </p>
      </article>
    </main>
  )
}
