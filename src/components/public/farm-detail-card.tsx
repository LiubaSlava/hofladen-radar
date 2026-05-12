"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import {
  Star,
  MapPin,
  Store,
  ParkingCircle,
  UtensilsCrossed,
  Baby,
  Navigation,
  Phone,
  Globe,
  Share2,
  Sparkles,
  Leaf,
  Sprout,
} from "lucide-react"
import { PRODUCT_LABELS, type Farm } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { haversineDistanceKm } from "@/lib/geo"
import { FarmReviewsSection } from "@/components/public/farm-reviews-section"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"

interface FarmDetailCardProps {
  farm: Farm
  allPoints: Farm[]
  onSelectPoint?: (id: string) => void
}

const FEATURE_ITEMS = [
  { key: "shop", label: "Shop", icon: Store },
  { key: "parking", label: "Parkplatz", icon: ParkingCircle },
  { key: "restaurant", label: "Restaurant", icon: UtensilsCrossed },
  { key: "playground", label: "Spielplatz", icon: Baby },
] as const

const ACTION_ITEMS = [
  { key: "route", label: "Route", icon: Navigation },
  { key: "contact", label: "Kontakt", icon: Phone },
  { key: "website", label: "Webseite", icon: Globe },
  { key: "share", label: "Teilen", icon: Share2 },
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

  const contactHref = useMemo(() => {
    const phone =
      (typeof contactInfo.phone === "string" && contactInfo.phone.trim()) ||
      (typeof contactInfo.tel === "string" && contactInfo.tel.trim()) ||
      ""
    if (phone) return `tel:${phone.replace(/\s+/g, "")}`
    const email = typeof contactInfo.email === "string" ? contactInfo.email.trim() : ""
    if (email) return `mailto:${email}`
    return ""
  }, [contactInfo.email, contactInfo.phone, contactInfo.tel])
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
    if (navigator.share) {
      try {
        await navigator.share({
          title: farm.name,
          text: `${farm.name} — ${farm.address}`,
          url: window.location.href,
        })
        return
      } catch {
        // fallback below
      }
    }
    await navigator.clipboard?.writeText(`${farm.name} — ${farm.address}`)
  }

  return (
    <div className="space-y-4">
      {/* Hero card */}
      <article className="overflow-hidden rounded-[32px] border border-border/70 bg-card shadow-[0_20px_45px_rgba(0,0,0,0.12)]">
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
              <div className="flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-md backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
                  <span className="relative h-2 w-2 rounded-full bg-primary" />
                </span>
                {t.openNow}
              </div>
            )}

            <div className="ml-auto flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-md backdrop-blur-md">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
              {farm.rating.toFixed(1)}
            </div>
          </div>

          {/* Distance badge */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-card/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-md">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            {farm.distanceKm.toFixed(1)} km
          </div>
        </div>

        {/* Title section */}
        <div className="space-y-3 px-5 pt-5">
          <div>
            <h2 className="text-[34px] font-bold leading-[1.05] tracking-tight text-foreground text-balance">
              {farm.name}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{farm.address}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {farm.features.shop && (
              <span className="rounded-full border border-border/60 bg-background px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground">
                Shop
              </span>
            )}
            {farm.bio && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Leaf className="h-3 w-3" />
                Bio
              </span>
            )}
            <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
              {farm.openNow ? t.openNow : t.closedNow}
            </span>
          </div>
        </div>

        {/* Product tags */}
        <div className="px-5 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.assortment}
          </h3>
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {farm.products.slice(0, 5).map((product) => (
              <div
                key={product}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border/60 bg-background/60 p-2.5"
              >
                <CategoryIcon category={product} className="h-5 w-5 text-primary" />
                <span className="text-[10px] font-medium text-foreground">
                  {categoryLabels[product]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Features bar */}
        <div className="px-5 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.equipment}
          </h3>
          <div className="mt-3 grid grid-cols-4 gap-2">
            {localizedFeatureItems.map((feat) => {
              const enabled = farm.features[feat.key]
              const Icon = feat.icon
              return (
                <div
                  key={feat.key}
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-colors ${
                    enabled
                      ? "border-border/60 bg-background/60 text-foreground"
                      : "border-border/40 bg-muted/40 text-muted-foreground/50"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{feat.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Seasonal block */}
        {farm.seasonal.length > 0 && (
          <div className="px-5 pt-5">
            <div className="rounded-2xl border border-amber-200/70 bg-amber-50/80 p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-200/70">
                  <Sprout className="h-4 w-4 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-900">{t.seasonNow}</h3>
                  <p className="text-[11px] text-amber-800/80">{t.seasonHint}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {farm.seasonal.map((item) => (
                  <span
                    key={item}
                    className="flex items-center gap-1 rounded-full bg-card/80 px-2.5 py-1 text-[11px] font-medium text-amber-900 shadow-sm"
                  >
                    <Leaf className="h-3 w-3 text-amber-700" />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action toolbar */}
        <div className="px-5 pt-5">
          <div className="grid grid-cols-4 gap-2">
            {ACTION_ITEMS.map((action) => {
              const Icon = action.icon
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
                  className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${
                    primary
                      ? "border-primary/50 bg-background text-foreground hover:bg-muted"
                      : "border-border/60 bg-background text-foreground hover:border-border hover:bg-muted/80"
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <Icon className={`h-5 w-5 ${primary ? "text-red-500" : "text-foreground"}`} />
                  <span className="text-[10px] font-semibold">{actionLabels[action.key]}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* AI Summary block */}
        <div className="px-5 pt-5">
          <div className="relative overflow-hidden rounded-2xl p-[1.5px]">
            <div
              className="absolute inset-0 opacity-90"
              style={{
                background:
                  "linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(59, 130, 246, 0.4), rgba(16, 185, 129, 0.4))",
              }}
              aria-hidden="true"
            />
            <div className="relative rounded-[14px] bg-card/90 p-4 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                  <Sparkles className="h-4 w-4 text-purple-600" />
                </div>
                <h3 className="text-sm font-semibold tracking-tight text-foreground">
                  {t.aiTitle}
                </h3>
                <span className="ml-auto rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700">
                  Beta
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                {localizedAiSummary || t.aiHint}
              </p>
              {!localizedAiSummary ? (
                <div className="mt-3 flex items-center gap-1">
                  <div className="h-1 w-12 animate-pulse rounded-full bg-purple-400/60" />
                  <div className="h-1 w-8 animate-pulse rounded-full bg-blue-400/60 [animation-delay:120ms]" />
                  <div className="h-1 w-5 animate-pulse rounded-full bg-emerald-400/60 [animation-delay:240ms]" />
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-5 pt-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t.aboutFarm}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-foreground">{localizedDescription}</p>
        </div>

        {/* Reviews (Supabase + OAuth) */}
        <div className="px-5 pb-6 pt-5">
          <FarmReviewsSection farm={farm} />
        </div>
      </article>

      {/* Nearby attractions */}
      {nearbyAttractions.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold tracking-tight text-foreground">
              {t.attractionsNearby}
            </h3>
            <span className="text-xs text-muted-foreground">
              {nearbyAttractions.length} {nearbyAttractions.length === 1 ? t.placeSingle : t.placePlural}
            </span>
          </div>
          <div className="space-y-3">
            {nearbyAttractions.map((attraction) => (
              <button
                key={attraction.id}
                type="button"
                onClick={() => onSelectPoint?.(attraction.id)}
                className="block w-full overflow-hidden rounded-2xl border border-border/60 bg-card/80 text-left shadow-sm transition-colors hover:border-border"
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
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
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
