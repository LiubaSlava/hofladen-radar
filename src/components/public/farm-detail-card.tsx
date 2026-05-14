"use client"

import dynamic from "next/dynamic"
import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Star, MapPin, Sparkles, Leaf, Sprout } from "lucide-react"
import { PRODUCT_LABELS, type Farm } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { haversineDistanceKm } from "@/lib/geo"
import { getPublicSiteOrigin } from "@/lib/site-url"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"

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

/** Emoji actions — same capsule strip as equipment / main panel. */
const ACTION_EMOJI: Record<(typeof ACTION_ITEMS)[number]["key"], string> = {
  route: "🧭",
  contact: "📇",
  website: "🌐",
  share: "📤",
}

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
  }
> = {
  de: {
    assortment: "Sortiment",
    equipment: "Ausstattung",
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
  },
  fr: {
    assortment: "Assortiment",
    equipment: "Équipement",
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
  },
  it: {
    assortment: "Assortimento",
    equipment: "Dotazione",
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
  },
  en: {
    assortment: "Assortment",
    equipment: "Features",
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
  },
  uk: {
    assortment: "Асортимент",
    equipment: "Оснащення",
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
    <div className="space-y-3">
      {/* Hero card — same capsule language as sidebar / detail shell */}
      <article className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm ring-1 ring-primary/[0.06] backdrop-blur-xl">
        {/* Hero image */}
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
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
          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
            {farm.openNow && (
              <div className="flex items-center gap-1.5 rounded-full border border-border/70 bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
                  <span className="relative h-2 w-2 rounded-full bg-primary" />
                </span>
                {t.openNow}
              </div>
            )}

            <div className="ml-auto flex items-center gap-1 rounded-full border border-border/70 bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-sm backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              {farm.rating.toFixed(1)}
            </div>
          </div>

          {/* Distance badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full border border-border/70 bg-card/95 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground shadow-sm backdrop-blur-md">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
            {farm.distanceKm.toFixed(1)} km
          </div>
        </div>

        {/* Title section */}
        <div className="space-y-3 px-4 pt-4 md:px-5 md:pt-5">
          <div>
            <h2 className="text-balance text-2xl font-semibold leading-tight tracking-tight text-foreground md:text-3xl">
              {farm.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{farm.address}</p>
            {contactPhoneRaw || contactEmailRaw ? (
              <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                {contactEmailRaw ? (
                  <p>
                    <span className="font-medium text-foreground">E-Mail: </span>
                    <a href={`mailto:${contactEmailRaw}`} className="text-primary underline-offset-2 hover:underline">
                      {contactEmailRaw}
                    </a>
                  </p>
                ) : null}
                {contactPhoneRaw ? (
                  <p>
                    <span className="font-medium text-foreground">Tel.: </span>
                    <a href={`tel:${contactPhoneRaw.replace(/\s+/g, "")}`} className="text-primary underline-offset-2 hover:underline">
                      {contactPhoneRaw}
                    </a>
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {farm.features.shop && (
              <span className="rounded-full border border-primary/20 bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Shop
              </span>
            )}
            {farm.bio && (
              <span className="flex items-center gap-1 rounded-full border border-primary/20 bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Leaf className="h-3 w-3" />
                Bio
              </span>
            )}
            <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              {farm.openNow ? t.openNow : t.closedNow}
            </span>
          </div>
        </div>

        {/* Product tags */}
        <div className="px-4 pt-4 md:px-5 md:pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.assortment}
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {farm.products.slice(0, 5).map((product) => (
              <div
                key={product}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-muted/70 p-2.5 text-center transition-colors hover:border-primary/25"
              >
                <CategoryIcon category={product} className="text-lg leading-none" />
                <span className="text-[10px] font-medium text-foreground">
                  {categoryLabels[product]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features — capsules like main panel (Standorte) */}
        <div className="notranslate px-4 pt-4 md:px-5 md:pt-5" translate="no">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.equipment}
          </h3>
          <div className="mt-3 rounded-2xl border border-border bg-muted p-1">
            <div className="grid grid-cols-4 gap-1">
              {localizedFeatureItems.map((feat) => {
                const enabled = farm.features[feat.key]
                return (
                  <div
                    key={feat.key}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2.5 text-center transition-colors ${
                      enabled
                        ? "bg-accent text-primary shadow-sm"
                        : "text-muted-foreground/55"
                    }`}
                  >
                    <span className="select-none text-base leading-none" aria-hidden>
                      {FEATURE_EMOJI[feat.key]}
                    </span>
                    <span className="text-[10px] font-semibold leading-tight">{feat.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Seasonal block */}
        {farm.seasonal.length > 0 && (
          <div className="px-4 pt-4 md:px-5 md:pt-5">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/50 shadow-sm ring-1 ring-primary/[0.04]">
              <div className="flex items-center gap-2 border-b border-border/60 bg-brand-butter/80 px-3 py-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card/90">
                  <Sprout className="h-4 w-4 text-brand-butter-foreground" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-brand-butter-foreground">{t.seasonNow}</h3>
                  <p className="text-[11px] leading-snug text-muted-foreground">{t.seasonHint}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 p-3">
                {farm.seasonal.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground"
                  >
                    <Leaf className="h-3 w-3 text-muted-foreground" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action toolbar — capsules + emoji (design only; same handlers / disabled rules) */}
        <div className="notranslate px-4 pt-4 md:px-5 md:pt-5" translate="no">
          <div className="rounded-2xl border border-border bg-muted p-1">
            <div className="grid grid-cols-4 gap-1">
              {ACTION_ITEMS.map((action) => {
                const primary = action.key === "route"
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={() => void handleActionClick(action.key)}
                    disabled={
                      (action.key === "contact" && !contactHref) ||
                      (action.key === "website" && !websiteUrl)
                    }
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2.5 text-center transition-all ${
                      primary
                        ? "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90"
                        : "text-foreground hover:bg-accent hover:text-primary"
                    } disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-foreground`}
                  >
                    <span
                      className={`select-none text-base leading-none ${primary ? "" : "opacity-90"}`}
                      aria-hidden
                    >
                      {ACTION_EMOJI[action.key]}
                    </span>
                    <span className="text-[10px] font-semibold leading-tight">{actionLabels[action.key]}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* AI Summary block */}
        <div className="px-4 pt-4 md:px-5 md:pt-5">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-primary/[0.06]">
            <div className="flex items-center gap-2 border-b border-border/60 bg-brand-mint/55 px-3 py-2">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-card/80">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <h3 className="min-w-0 text-sm font-semibold tracking-tight text-primary">{t.aiTitle}</h3>
              <span className="ml-auto shrink-0 rounded-full border border-primary/20 bg-accent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                Beta
              </span>
            </div>
            <div className="p-3">
              <div className="rounded-xl border border-border/50 bg-muted/50 px-3 py-2.5">
                <p className="text-sm leading-relaxed text-foreground">
                  {localizedAiSummary || t.aiHint}
                </p>
              </div>
              {!localizedAiSummary ? (
                <div className="mt-3 flex items-center gap-1">
                  <div className="h-1 w-12 animate-pulse rounded-full bg-muted-foreground/20" />
                  <div className="h-1 w-8 animate-pulse rounded-full bg-muted-foreground/15 [animation-delay:120ms]" />
                  <div className="h-1 w-5 animate-pulse rounded-full bg-muted-foreground/10 [animation-delay:240ms]" />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 pt-4 md:px-5 md:pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.aboutFarm}
          </h3>
          <div className="mt-2 rounded-xl border border-border/50 bg-muted/40 px-3 py-2.5">
            <p className="text-sm leading-relaxed text-foreground">{localizedDescription}</p>
          </div>
        </div>

        {/* Reviews (Supabase + OAuth) */}
        <div className="px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-5">
          <div className="rounded-2xl border border-border bg-muted/30 p-3 md:p-4">
            <FarmReviewsSection farm={farm} />
          </div>
        </div>
      </article>

      {/* Nearby attractions — clearer block at end of detail scroll */}
      {nearbyAttractions.length > 0 && (
        <section className="scroll-mt-6 space-y-3 overflow-hidden rounded-2xl border border-border bg-card/95 p-4 shadow-sm ring-1 ring-primary/[0.06] backdrop-blur-xl">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-3">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">{t.attractionsNearby}</h3>
            <span className="shrink-0 whitespace-nowrap rounded-full border border-primary/20 bg-accent px-2 py-0.5 text-xs font-medium text-primary">
              {nearbyAttractions.length} {nearbyAttractions.length === 1 ? t.placeSingle : t.placePlural}
            </span>
          </div>
          <div className="space-y-3">
            {nearbyAttractions.map((attraction) => (
              <button
                key={attraction.id}
                type="button"
                onClick={() => onSelectPoint?.(attraction.id)}
                className="block w-full overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-colors hover:border-primary/25 hover:bg-muted/40"
              >
                <div className="relative h-28 w-full overflow-hidden bg-muted">
                  <Image
                    src={brokenAttractionImages[attraction.id] ? "/placeholder.svg" : attraction.image || "/placeholder.svg"}
                    alt={attraction.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    className="object-cover"
                    unoptimized
                    onError={() =>
                      setBrokenAttractionImages((prev) =>
                        prev[attraction.id] ? prev : { ...prev, [attraction.id]: true },
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-3">
                  <p className="line-clamp-1 text-sm font-semibold text-foreground">{attraction.name}</p>
                  <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                    {attraction.distanceKm.toFixed(1)} km
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
