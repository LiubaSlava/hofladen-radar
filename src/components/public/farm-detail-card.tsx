"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Star, MapPin, Leaf, Sparkles } from "lucide-react"
import { PRODUCT_LABELS, type Farm } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { haversineDistanceKm } from "@/lib/geo"
import { getPublicSiteOrigin } from "@/lib/site-url"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"
import { surfaceCapsule, surfaceCapsulePad } from "@/lib/typography"
import { cn } from "@/lib/utils"
const FarmNavActionsBlock = dynamic(
  () => import("@/components/public/farm-nav-actions-block").then((m) => m.FarmNavActionsBlock),
  {
    ssr: false,
    loading: () => (
      <div className="h-28 animate-pulse rounded-2xl border border-border/50 bg-muted/30" aria-hidden />
    ),
  },
)

const FarmReviewsSection = dynamic(
  () => import("@/components/public/farm-reviews-section").then((mod) => mod.FarmReviewsSection),
  {
    ssr: false,
    loading: () => (
      <div
        className="rounded-2xl border border-border bg-muted/30 p-6"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="h-3.5 w-36 animate-pulse rounded bg-muted-foreground/15" />
        <div className="mt-4 h-16 animate-pulse rounded-xl bg-muted-foreground/10" />
        <div className="mt-2 h-16 animate-pulse rounded-xl bg-muted-foreground/10" />
      </div>
    ),
  },
)

interface FarmDetailCardProps {
  farm: Farm
  allPoints: Farm[]
  onSelectPoint?: (id: string) => void
}

const FEATURE_ITEMS = [
  { key: "shop", label: "Shop" },
  { key: "parking", label: "Parkplatz" },
  { key: "restaurant", label: "Restaurant" },
  { key: "playground", label: "Spielplatz" },
] as const

/** Emoji pictograms — same capsule vocabulary as the main radar filters. */
const FEATURE_EMOJI: Record<(typeof FEATURE_ITEMS)[number]["key"], string> = {
  shop: "🏪",
  parking: "🅿️",
  restaurant: "🍽️",
  playground: "🛝",
}

const ACTION_ITEMS = [
  { key: "route", label: "Route" },
  { key: "contact", label: "Kontakt" },
  { key: "website", label: "Webseite" },
  { key: "share", label: "Teilen" },
] as const

// Nearby attractions are meant to be a short walking add-on around the farm.
const ATTRACTIONS_RADIUS_KM = 1

const LOCAL_FEATURE_LABELS: Record<
  AppLocale,
  Record<(typeof FEATURE_ITEMS)[number]["key"], string>
> = {
  de: { shop: "Shop", parking: "Parkplatz", restaurant: "Restaurant", playground: "Spielplatz" },
  fr: { shop: "Boutique", parking: "Parking", restaurant: "Restaurant", playground: "Aire de jeux" },
  it: { shop: "Negozio", parking: "Parcheggio", restaurant: "Ristorante", playground: "Parco giochi" },
  en: { shop: "Shop", parking: "Parking", restaurant: "Restaurant", playground: "Playground" },
  uk: { shop: "Магазин", parking: "Паркінг", restaurant: "Ресторан", playground: "Дитячий майданчик" },
}

const LOCAL_CATEGORY_LABELS: Record<
  AppLocale,
  Record<keyof typeof PRODUCT_LABELS, string>
> = {
  de: PRODUCT_LABELS,
  fr: {
    milch: "Lait",
    kaese: "Fromage",
    eier: "Oeufs",
    fleisch: "Viande",
    obst: "Fruits",
    honig: "Miel",
    gemuese: "Legumes",
    kraeuter: "Herbes",
  },
  it: {
    milch: "Latte",
    kaese: "Formaggio",
    eier: "Uova",
    fleisch: "Carne",
    obst: "Frutta",
    honig: "Miele",
    gemuese: "Verdure",
    kraeuter: "Erbe",
  },
  en: {
    milch: "Milk",
    kaese: "Cheese",
    eier: "Eggs",
    fleisch: "Meat",
    obst: "Fruit",
    honig: "Honey",
    gemuese: "Vegetables",
    kraeuter: "Herbs",
  },
  uk: {
    milch: "Молоко",
    kaese: "Сир",
    eier: "Яйця",
    fleisch: "М'ясо",
    obst: "Фрукти",
    honig: "Мед",
    gemuese: "Овочі",
    kraeuter: "Трави",
  },
}

const LOCAL_TEXT: Record<
  AppLocale,
  {
    assortment: string
    equipment: string
    venueFarm: string
    venueShop: string
    openNow: string
    closedNow: string
    seasonNow: string
    seasonHint: string
    aiTitle: string
    aiHint: string
    aboutFarm: string
    attractionsNearby: string
    placeSingle: string
    placePlural: string
    navKicker: string
    navTitle: string
    navHint: string
  }
> = {
  de: {
    assortment: "Sortiment",
    equipment: "Ausstattung",
    venueFarm: "Hof",
    venueShop: "Laden",
    openNow: "Jetzt geöffnet",
    closedNow: "Derzeit geschlossen",
    seasonNow: "Jetzt Saison",
    seasonHint: "Frisch verfügbar bei diesem Hof",
    aiTitle: "KI-Überblick",
    aiHint: "Wartet auf KI-Analyse… Bewertungen, Saison-Daten und Produktsignale werden für eine kompakte Zusammenfassung ausgewertet.",
    aboutFarm: "Über den Hof",
    attractionsNearby: "Ausflugsziele in der Nähe",
    placeSingle: "Ort",
    placePlural: "Orte",
    navKicker: "Weg",
    navTitle: "Kontakt & Navigation",
    navHint: "Route planen, anrufen, Website öffnen oder Hof teilen.",
  },
  fr: {
    assortment: "Assortiment",
    equipment: "Équipement",
    venueFarm: "Ferme",
    venueShop: "Magasin",
    openNow: "Ouvert maintenant",
    closedNow: "Actuellement fermé",
    seasonNow: "En saison",
    seasonHint: "Disponible frais dans cette ferme",
    aiTitle: "Aperçu IA",
    aiHint: "En attente de l'analyse IA… Les avis, données saisonnières et signaux produits seront résumés.",
    aboutFarm: "À propos de la ferme",
    attractionsNearby: "Destinations à proximité",
    placeSingle: "lieu",
    placePlural: "lieux",
    navKicker: "Aller",
    navTitle: "Contact & navigation",
    navHint: "Itinéraire, appeler, site web ou partager la ferme.",
  },
  it: {
    assortment: "Assortimento",
    equipment: "Dotazione",
    venueFarm: "Fattoria",
    venueShop: "Negozio",
    openNow: "Aperto ora",
    closedNow: "Attualmente chiuso",
    seasonNow: "Di stagione ora",
    seasonHint: "Disponibile fresco in questa fattoria",
    aiTitle: "Panoramica IA",
    aiHint: "In attesa dell'analisi IA… Recensioni, dati stagionali e segnali prodotto saranno riassunti.",
    aboutFarm: "Informazioni sulla fattoria",
    attractionsNearby: "Destinazioni nelle vicinanze",
    placeSingle: "luogo",
    placePlural: "luoghi",
    navKicker: "Via",
    navTitle: "Contatto & navigazione",
    navHint: "Percorso, chiamata, sito web o condividi la fattoria.",
  },
  en: {
    assortment: "Assortment",
    equipment: "Features",
    venueFarm: "Farm",
    venueShop: "Shop",
    openNow: "Open now",
    closedNow: "Currently closed",
    seasonNow: "In season now",
    seasonHint: "Freshly available at this farm",
    aiTitle: "AI overview",
    aiHint: "Waiting for AI analysis… Reviews, seasonal data, and product signals will be summarized.",
    aboutFarm: "About the farm",
    attractionsNearby: "Nearby attractions",
    placeSingle: "place",
    placePlural: "places",
    navKicker: "Go",
    navTitle: "Contact & navigation",
    navHint: "Route, call, website, or share this farm.",
  },
  uk: {
    assortment: "Асортимент",
    equipment: "Оснащення",
    venueFarm: "Ферма",
    venueShop: "Магазин",
    openNow: "Зараз відкрито",
    closedNow: "Наразі зачинено",
    seasonNow: "Зараз сезон",
    seasonHint: "Свіжо доступно на цій фермі",
    aiTitle: "Огляд ШІ",
    aiHint: "Очікується аналіз ШІ… Відгуки, сезонні дані та сигнали продуктів буде підсумовано.",
    aboutFarm: "Про ферму",
    attractionsNearby: "Цікаві місця поруч",
    placeSingle: "місце",
    placePlural: "місця",
    navKicker: "Шлях",
    navTitle: "Контакт і навігація",
    navHint: "Маршрут, дзвінок, сайт або поділитися фермою.",
  },
}

const LOCAL_ACTION_LABELS: Record<
  AppLocale,
  Record<(typeof ACTION_ITEMS)[number]["key"], string>
> = {
  de: { route: "Route", contact: "Kontakt", website: "Webseite", share: "Teilen" },
  fr: { route: "Itinéraire", contact: "Contact", website: "Site web", share: "Partager" },
  it: { route: "Percorso", contact: "Contatto", website: "Sito web", share: "Condividi" },
  en: { route: "Route", contact: "Contact", website: "Website", share: "Share" },
  uk: { route: "Маршрут", contact: "Контакт", website: "Вебсайт", share: "Поділитися" },
}

export function FarmDetailCard({ farm, allPoints, onSelectPoint }: FarmDetailCardProps) {
  const [locale, setLocale] = useState<AppLocale>("de")
  const [brokenHeroById, setBrokenHeroById] = useState<Record<string, true>>({})
  const [brokenAttractionImages, setBrokenAttractionImages] = useState<Record<string, true>>({})
  const t = LOCAL_TEXT[locale]
  const featureLabels = LOCAL_FEATURE_LABELS[locale]
  const categoryLabels = LOCAL_CATEGORY_LABELS[locale]
  const actionLabels = LOCAL_ACTION_LABELS[locale]
  const venueKicker = farm.category === "shop" ? t.venueShop : t.venueFarm

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    return subscribeAppLocale(setLocale)
  }, [])
  const heroImageSrc = brokenHeroById[farm.id] ? "/placeholder.svg" : farm.image || "/placeholder.svg"


  const localizedFeatureItems = useMemo(
    () => FEATURE_ITEMS.map((item) => ({ ...item, label: featureLabels[item.key] })),
    [featureLabels],
  )
  const contactInfo = useMemo(() => {
    if (!farm.contact_info || typeof farm.contact_info !== "object") return {}
    return farm.contact_info as Record<string, unknown>
  }, [farm.contact_info])

  const websiteUrl = useMemo(() => {
    const candidate =
      (typeof farm.website_url === "string" && farm.website_url.trim()) ||
      (typeof contactInfo.website === "string" && contactInfo.website.trim()) ||
      ""
    if (!candidate) return ""
    return /^https?:\/\//i.test(candidate) ? candidate : `https://${candidate}`
  }, [contactInfo.website, farm.website_url])

  const contactPhoneRaw = useMemo(() => {
    const phone =
      (typeof contactInfo.phone === "string" && contactInfo.phone.trim()) ||
      (typeof contactInfo.tel === "string" && contactInfo.tel.trim()) ||
      ""
    return phone
  }, [contactInfo.phone, contactInfo.tel])

  const contactEmailRaw = useMemo(() => {
    const email = typeof contactInfo.email === "string" ? contactInfo.email.trim() : ""
    return email
  }, [contactInfo.email])

  const contactHref = useMemo(() => {
    if (contactPhoneRaw) return `tel:${contactPhoneRaw.replace(/\s+/g, "")}`
    if (contactEmailRaw) return `mailto:${contactEmailRaw}`
    return ""
  }, [contactEmailRaw, contactPhoneRaw])
  const localizedDescription = useMemo(() => {
    const byLocale: Record<AppLocale, string | undefined> = {
      de: farm.ai_message_de?.trim(),
      en: farm.ai_message_en?.trim(),
      fr: farm.ai_message_fr?.trim(),
      it: farm.ai_message_it?.trim(),
      uk: farm.ai_message_ua?.trim(),
    }
    return (
      byLocale[locale] ||
      farm.ai_message_de?.trim() ||
      farm.ai_message_en?.trim() ||
      farm.ai_message_fr?.trim() ||
      farm.ai_message_it?.trim() ||
      farm.ai_message_ua?.trim() ||
      farm.ai_message_sr?.trim() ||
      farm.description?.trim() ||
      (farm.address
        ? `${farm.name} in ${farm.address}. Weitere Informationen folgen.`
        : `${farm.name}. Weitere Informationen folgen.`)
    )
  }, [
    farm.address,
    farm.ai_message_de,
    farm.ai_message_en,
    farm.ai_message_fr,
    farm.ai_message_it,
    farm.ai_message_sr,
    farm.ai_message_ua,
    farm.description,
    farm.name,
    locale,
  ])
  const localizedAiSummary = useMemo(() => {
    return (
      farm.ai_summary_content?.trim() ||
      farm.ai_summary_de?.trim() ||
      farm.ai_summary_en?.trim() ||
      farm.ai_summary_fr?.trim() ||
      farm.ai_summary_it?.trim() ||
      farm.ai_summary_ua?.trim() ||
      farm.ai_summary_sr?.trim() ||
      ""
    )
  }, [
    farm.ai_summary_content,
    farm.ai_summary_de,
    farm.ai_summary_en,
    farm.ai_summary_fr,
    farm.ai_summary_it,
    farm.ai_summary_sr,
    farm.ai_summary_ua,
  ])

  const nearbyAttractions = allPoints
    .filter((point) => point.id !== farm.id && point.category === "attraction")
    .map((attraction) => ({
      ...attraction,
      distanceKm: haversineDistanceKm(
        { lat: farm.lat, lng: farm.lng },
        { lat: attraction.lat, lng: attraction.lng },
      ),
    }))
    .filter((attraction) => attraction.distanceKm <= ATTRACTIONS_RADIUS_KM)
    .sort((a, b) => a.distanceKm - b.distanceKm)

  const handleActionClick = async (key: (typeof ACTION_ITEMS)[number]["key"]) => {
    if (key === "route") {
      const url = `https://www.google.com/maps/search/?api=1&query=${farm.lat},${farm.lng}`
      window.open(url, "_blank", "noopener,noreferrer")
      return
    }
    if (key === "contact") {
      if (!contactHref) return
      window.open(contactHref, "_self")
      return
    }
    if (key === "website") {
      if (!websiteUrl) return
      window.open(websiteUrl, "_blank", "noopener,noreferrer")
      return
    }
    if (key !== "share") return
    const shareUrl =
      farm.public_slug?.trim().length > 0
        ? `${getPublicSiteOrigin()}/hof/${encodeURIComponent(farm.public_slug.trim())}`
        : window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title: farm.name,
          text: `${farm.name} — ${farm.address}`,
          url: shareUrl,
        })
        return
      } catch {
        // fallback below
      }
    }
    await navigator.clipboard?.writeText(`${farm.name} — ${farm.address}\n${shareUrl}`)
  }

  return (
    <div className="notranslate space-y-3" translate="no">
      <article className={cn(surfaceCapsule, "overflow-hidden")}>
        <div className="hr-farm-detail__hero relative aspect-[16/10] w-full overflow-hidden bg-muted">
          <Image
            src={heroImageSrc}
            alt={farm.name}
            fill
            sizes="(max-width: 768px) 100vw, 480px"
            className="object-cover"
            priority
            unoptimized
            onError={() => setBrokenHeroById((prev) => ({ ...prev, [farm.id]: true }))}
          />

          {/* Top badges */}
          <div className="absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
            {farm.openNow ? (
              <span className="hr-search-promo__badge font-pixel inline-flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inset-0 animate-ping rounded-full bg-[oklch(88%_0.12_145)]" />
                  <span className="relative h-1.5 w-1.5 rounded-full bg-[oklch(88%_0.12_145)]" />
                </span>
                {t.openNow}
              </span>
            ) : (
              <span />
            )}

            <span className="hr-search-promo__badge font-pixel ml-auto inline-flex items-center gap-1">
              <Star className="h-3 w-3 fill-amber-300 text-amber-200" />
              {farm.rating.toFixed(1)}
            </span>
          </div>

          <span className="hr-search-promo__badge font-pixel absolute bottom-3 left-3 z-10 inline-flex items-center gap-1 tabular-nums">
            <MapPin className="h-3 w-3 opacity-90" />
            {farm.distanceKm.toFixed(1)} km
          </span>
        </div>

        <div className="hr-search-promo hr-search-promo--no-orb hr-farm-detail__head">
          <div className="hr-search-promo__glow" aria-hidden />
          <div className="hr-search-promo__inner">
            <div className="hr-search-promo__copy">
              <span className="hr-search-promo__badge font-pixel">{venueKicker}</span>
              <h2 className="hr-search-promo__title">{farm.name}</h2>
              <p className="hr-search-promo__hint">{farm.address}</p>
              {contactPhoneRaw || contactEmailRaw ? (
                <div className="mt-2 space-y-1 text-[11px] leading-snug text-white">
                  {contactEmailRaw ? (
                    <p>
                      E-Mail:{" "}
                      <a href={`mailto:${contactEmailRaw}`} className="hr-farm-detail__promo-link">
                        {contactEmailRaw}
                      </a>
                    </p>
                  ) : null}
                  {contactPhoneRaw ? (
                    <p>
                      Tel.:{" "}
                      <a
                        href={`tel:${contactPhoneRaw.replace(/\s+/g, "")}`}
                        className="hr-farm-detail__promo-link"
                      >
                        {contactPhoneRaw}
                      </a>
                    </p>
                  ) : null}
                </div>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {farm.features.shop ? <span className="hr-search-promo__badge font-pixel">Shop</span> : null}
                {farm.bio ? (
                  <span className="hr-search-promo__badge font-pixel inline-flex items-center gap-1">
                    <Leaf className="h-2.5 w-2.5" aria-hidden />
                    Bio
                  </span>
                ) : null}
                <span className="hr-search-promo__badge font-pixel">
                  {farm.openNow ? t.openNow : t.closedNow}
                </span>
              </div>
              <div className="hr-search-promo__field mt-2.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                  {farm.rating.toFixed(1)}
                </span>
                <span className="font-pixel text-[10px] tabular-nums text-foreground">
                  {farm.distanceKm.toFixed(1)} km
                </span>
              </div>
            </div>
          </div>
        </div>
      </article>

      <section className={surfaceCapsulePad}>
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">{t.assortment}</p>
        <div className="mt-3 hr-lang-panel hr-lang-panel--bare" role="group" aria-label={t.assortment}>
          <div className="hr-lang-grid">
            {farm.products.slice(0, 5).map((product) => (
              <div
                key={product}
                className="hr-lang-card hr-lang-card--on"
                aria-label={categoryLabels[product]}
              >
                <CategoryIcon category={product} className="hr-lang-card__icon" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={surfaceCapsulePad} translate="no">
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">{t.equipment}</p>
        <div className="mt-3 hr-lang-panel hr-lang-panel--bare" role="group" aria-label={t.equipment}>
          <div className="hr-lang-grid grid-cols-4">
            {localizedFeatureItems.map((feat) => {
              const enabled = farm.features[feat.key]
              return (
                <div
                  key={feat.key}
                  className={cn("hr-lang-card", enabled && "hr-lang-card--on", !enabled && "hr-lang-card--muted")}
                  aria-label={feat.label}
                >
                  <span className="hr-lang-card__icon select-none" aria-hidden>
                    {FEATURE_EMOJI[feat.key]}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>


      {farm.seasonal.length > 0 ? (
        <section className={surfaceCapsulePad}>
          <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">{t.seasonNow}</p>
          <div className="mt-3 hr-saison overflow-hidden shadow-soft">
            <p className="border-b border-[color-mix(in_oklch,var(--sand-2)_40%,white)] px-3 py-2 text-[11px] leading-snug text-ink-2">
              {t.seasonHint}
            </p>
            <div className="flex flex-wrap gap-1.5 px-3 py-3">
              {farm.seasonal.map((item) => (
                <span key={item} className="hr-saison-pill inline-flex items-center gap-1">
                  🌱 {item}
                </span>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <FarmNavActionsBlock
        kicker={t.navKicker}
        title={t.navTitle}
        hint={t.navHint}
        routeLabel={actionLabels.route}
        actionLabels={{
          contact: actionLabels.contact,
          website: actionLabels.website,
          share: actionLabels.share,
        }}
        onActionClick={(key) => void handleActionClick(key)}
        contactDisabled={!contactHref}
        websiteDisabled={!websiteUrl}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-primary/[0.06] shrink-0">
        <div className="flex items-center gap-2 border-b border-border/60 bg-brand-mint/55 px-3 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-card/80">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <h3 className="min-w-0 text-sm font-semibold tracking-tight text-primary">{t.aiTitle}</h3>
          <span className="ml-auto shrink-0 rounded-full border border-primary/20 bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
            Beta
          </span>
        </div>
        <div className="bg-muted/35 px-3 py-3">
          <p className="font-pixel text-xs leading-relaxed text-foreground text-pretty">
            {localizedAiSummary || t.aiHint}
          </p>
          {!localizedAiSummary ? (
            <div className="mt-3 flex items-center gap-1">
              <div className="h-1 w-12 animate-pulse rounded-full bg-muted-foreground/20" />
              <div className="h-1 w-8 animate-pulse rounded-full bg-muted-foreground/15 [animation-delay:120ms]" />
              <div className="h-1 w-5 animate-pulse rounded-full bg-muted-foreground/10 [animation-delay:240ms]" />
            </div>
          ) : null}
        </div>
      </section>

      <section className={surfaceCapsulePad}>
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">{t.aboutFarm}</p>
        <div className="mt-3 bg-muted/35 px-3 py-3">
          <p className="text-sm leading-relaxed text-foreground text-pretty">{localizedDescription}</p>
        </div>
      </section>

      <section className="notranslate" translate="no">
        <FarmReviewsSection farm={farm} />
      </section>

      {nearbyAttractions.length > 0 ? (
        <section className={cn(surfaceCapsulePad, "scroll-mt-6")}>
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
            <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">{t.attractionsNearby}</p>
            <span className="font-pixel shrink-0 rounded-full border border-primary/25 bg-accent px-2 py-0.5 text-[10px] tabular-nums text-primary">
              {nearbyAttractions.length} {nearbyAttractions.length === 1 ? t.placeSingle : t.placePlural}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {nearbyAttractions.map((attraction) => (
              <button
                key={attraction.id}
                type="button"
                onClick={() => onSelectPoint?.(attraction.id)}
                className="hr-venue-shop-row group flex w-full items-center gap-3 overflow-hidden rounded-2xl border p-2 text-left transition-all"
              >
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image
                    src={
                      brokenAttractionImages[attraction.id]
                        ? "/placeholder.svg"
                        : attraction.image || "/placeholder.svg"
                    }
                    alt={attraction.name}
                    fill
                    sizes="56px"
                    loading="lazy"
                    className="object-cover"
                    unoptimized
                    onError={() =>
                      setBrokenAttractionImages((prev) =>
                        prev[attraction.id] ? prev : { ...prev, [attraction.id]: true },
                      )
                    }
                  />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="hr-venue-shop-row__name truncate text-sm font-medium">{attraction.name}</p>
                  <p className="hr-venue-shop-row__meta mt-0.5 truncate text-xs">
                    {attraction.distanceKm.toFixed(1)} km
                  </p>
                </div>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
