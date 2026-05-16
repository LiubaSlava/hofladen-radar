import Image from "next/image"
import Link from "next/link"
import {
  Clock,
  ExternalLink,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Sparkles,
  Star,
} from "lucide-react"
import { CategoryIcon } from "@/components/category-icon"
import { BrandLogoMark } from "@/components/public/brand-logo-mark"
import { HofPublicReviewsLazy } from "@/components/public/hof-public-reviews-lazy"
import { HofPublicShareButton } from "@/components/public/hof-public-share-button"
import { PRODUCT_LABELS, type CategoryKey, type Farm } from "@/lib/data"
import {
  buildMapsRouteUrl,
  buildPublicFarmCanonicalUrl,
  formatOpeningHoursDisplay,
  parseFarmContact,
  pickPublicAiSummary,
  pickPublicPageBody,
} from "@/lib/hof-public-page"
import { surfaceCapsule, surfaceCapsulePad } from "@/lib/typography"
import { cn } from "@/lib/utils"

const FEATURE_ROWS = [
  { key: "shop", label: "Shop", emoji: "🏪", active: (f: Farm) => f.features.shop || f.has_shop },
  { key: "parking", label: "Parkplatz", emoji: "🅿️", active: (f: Farm) => f.features.parking || f.has_parking },
  { key: "restaurant", label: "Restaurant", emoji: "🍽️", active: (f: Farm) => f.features.restaurant || f.has_restaurant },
  { key: "playground", label: "Spielplatz", emoji: "🛝", active: (f: Farm) => f.features.playground || f.has_playground },
  { key: "delivery", label: "Lieferung", emoji: "🚚", active: (f: Farm) => Boolean(f.has_delivery) },
  { key: "accommodation", label: "Übernachtung", emoji: "🛏️", active: (f: Farm) => Boolean(f.has_accommodation) },
  { key: "quiz", label: "Quiz", emoji: "🎯", active: (f: Farm) => Boolean(f.has_quiz) },
] as const

function categoryLabel(category: Farm["category"]): string {
  if (category === "shop") return "Hofladen / Laden"
  if (category === "attraction") return "Attraktion"
  return "Bauernhof"
}

type HofPublicLandingProps = {
  farm: Farm
}

export function HofPublicLanding({ farm }: HofPublicLandingProps) {
  const slug = farm.public_slug!.trim()
  const contact = parseFarmContact(farm)
  const bodyText = pickPublicPageBody(farm)
  const aiSummary = pickPublicAiSummary(farm)
  const hoursText = formatOpeningHoursDisplay(farm)
  const mapsUrl = buildMapsRouteUrl(farm)
  const shareUrl = buildPublicFarmCanonicalUrl(slug)
  const heroSrc = farm.image?.trim() || "/placeholder.svg"
  const activeFeatures = FEATURE_ROWS.filter((row) => row.active(farm))
  const products = Array.from(new Set(farm.products ?? [])) as CategoryKey[]

  return (
    <main className="hr-hof-landing min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 hover:opacity-90">
            <BrandLogoMark size="sm" priority />
            <span className="font-pixel truncate text-sm leading-tight tracking-wide text-primary">
              Hofladen Radar
            </span>
          </Link>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-primary/25 bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
          >
            Zur Karte
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
        <section className="hr-search-promo hr-search-promo--no-orb overflow-hidden">
          <div className="hr-search-promo__glow" aria-hidden />
          <div className="relative z-10 px-5 pb-6 pt-5 sm:px-7 sm:pt-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="hr-search-promo__badge font-pixel">{categoryLabel(farm.category)}</span>
              {farm.openNow ? (
                <span className="hr-search-promo__badge font-pixel inline-flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inset-0 animate-ping rounded-full bg-[oklch(88%_0.12_145)]" />
                    <span className="relative h-1.5 w-1.5 rounded-full bg-[oklch(88%_0.12_145)]" />
                  </span>
                  Jetzt geöffnet
                </span>
              ) : (
                <span className="hr-search-promo__badge font-pixel opacity-80">Derzeit geschlossen</span>
              )}
              {farm.rating > 0 ? (
                <span className="hr-search-promo__badge font-pixel inline-flex items-center gap-1 tabular-nums">
                  <Star className="h-3 w-3 fill-amber-300 text-amber-200" aria-hidden />
                  {farm.rating.toFixed(1)}
                </span>
              ) : null}
            </div>

            <h1 className="hr-search-promo__title mt-4 text-balance text-2xl sm:text-3xl">{farm.name}</h1>
            <p className="hr-search-promo__hint mt-2 flex items-start gap-2 text-sm sm:text-[0.8rem]">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
              <span>{farm.address}</span>
            </p>
          </div>
        </section>

        <div className="mt-4 sm:mt-5">
          <div className={cn(surfaceCapsule, "overflow-hidden ring-2 ring-primary/[0.08]")}>
            <div className="hr-farm-detail__hero relative aspect-[16/9] w-full overflow-hidden bg-muted sm:aspect-[16/10]">
              <Image
                src={heroSrc}
                alt={farm.name}
                fill
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
                priority
                unoptimized
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
            >
              <Navigation className="h-4 w-4" aria-hidden />
              Route planen
            </a>
            {contact.contactHref ? (
              <a
                href={contact.contactHref}
                className="inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/60"
              >
                {contact.phone ? (
                  <Phone className="h-4 w-4 text-primary" aria-hidden />
                ) : (
                  <Mail className="h-4 w-4 text-primary" aria-hidden />
                )}
                Kontakt
              </a>
            ) : null}
            {contact.websiteUrl ? (
              <a
                href={contact.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-[8.5rem] flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-muted/60"
              >
                <ExternalLink className="h-4 w-4 text-primary" aria-hidden />
                Webseite
              </a>
            ) : null}
            <HofPublicShareButton
              title={farm.name}
              address={farm.address}
              shareUrl={shareUrl}
              className="min-w-[8.5rem] flex-1"
            />
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {aiSummary ? (
            <section className={surfaceCapsulePad}>
              <div className="-mx-4 -mt-4 mb-4 flex items-center gap-2 rounded-t-2xl border-b border-border/60 bg-brand-mint/55 px-4 py-3">
                <Sparkles className="h-4 w-4 text-primary" aria-hidden />
                <h2 className="font-pixel text-[11px] uppercase tracking-[0.1em] text-primary">KI-Überblick</h2>
              </div>
              <div className="bg-muted/35 px-3 py-3">
                <p className="font-pixel text-xs leading-relaxed text-foreground text-pretty">{aiSummary}</p>
              </div>
            </section>
          ) : null}

          {bodyText ? (
            <section className={surfaceCapsulePad}>
              <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Über den Betrieb</p>
              <div className="mt-3 bg-muted/35 px-3 py-3">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground text-pretty">{bodyText}</p>
              </div>
            </section>
          ) : null}

          {products.length > 0 ? (
            <section className={surfaceCapsulePad}>
              <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Sortiment</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {products.map((key) => (
                  <span
                    key={key}
                    className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-brand-mint/40 px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    <CategoryIcon category={key} className="text-base" />
                    {PRODUCT_LABELS[key] ?? key}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {activeFeatures.length > 0 ? (
            <section className={surfaceCapsulePad}>
              <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Ausstattung</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {activeFeatures.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-muted/40 px-3 py-2.5"
                  >
                    <span className="text-lg leading-none" aria-hidden>
                      {item.emoji}
                    </span>
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="notranslate scroll-mt-6" translate="no">
            <HofPublicReviewsLazy farm={farm} />
          </section>

          {hoursText ? (
            <section className={surfaceCapsulePad}>
              <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Öffnungszeiten</p>
              <div className="mt-3 flex gap-3 rounded-2xl border border-border/60 bg-muted/35 px-3 py-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                <p className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-foreground">{hoursText}</p>
              </div>
            </section>
          ) : null}

          {contact.email || contact.phone ? (
            <section className="hr-search-promo hr-search-promo--no-orb overflow-hidden">
              <div className="hr-search-promo__glow" aria-hidden />
              <div className="relative z-10 px-5 py-5 sm:px-6">
                <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-[oklch(92%_0.02_140/0.88)]">
                  Kontakt
                </p>
                <div className="mt-3 space-y-2 text-sm text-white">
                  {contact.email ? (
                    <p>
                      E-Mail:{" "}
                      <a href={`mailto:${contact.email}`} className="hr-farm-detail__promo-link font-medium">
                        {contact.email}
                      </a>
                    </p>
                  ) : null}
                  {contact.phone ? (
                    <p>
                      Tel.:{" "}
                      <a
                        href={`tel:${contact.phone.replace(/\s+/g, "")}`}
                        className="hr-farm-detail__promo-link font-medium"
                      >
                        {contact.phone}
                      </a>
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          ) : null}

          <section
            className={cn(
              surfaceCapsulePad,
              "bg-gradient-to-b from-brand-mint/30 to-card text-center ring-2 ring-primary/10",
            )}
          >
            <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-primary">Hofladen Radar</p>
            <h2 className="mt-2 text-balance text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
              Entdecke mehr Höfe in der Region
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Interaktive Karte mit Hofläden, Direktvermarktern und regionalen Produkten — live, filterbar und
              kostenlos.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
            >
              <MapPin className="h-4 w-4" aria-hidden />
              Auf der Karte öffnen
            </Link>
          </section>
        </div>
      </div>
    </main>
  )
}
