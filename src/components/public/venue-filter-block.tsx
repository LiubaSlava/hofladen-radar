"use client"

import { useEffect, useState } from "react"
import { type VenueFilter } from "@/lib/data"
import { cn } from "@/lib/utils"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"

type VenueOptionCopy = { title: string; description: string }

type VenueFilterCopy = {
  kicker: string
  question: string
  all: VenueOptionCopy
  farm: VenueOptionCopy
  shop: VenueOptionCopy
}

const VENUE_FILTER_COPY: Record<AppLocale, VenueFilterCopy> = {
  de: {
    kicker: "Standorte",
    question: "Was möchtest du auf der Karte sehen?",
    all: { title: "Alle", description: "Höfe und Läden — alles auf einen Blick" },
    farm: { title: "Bauernhöfe", description: "Hof mit Direktverkauf oder Lieferung" },
    shop: { title: "Läden", description: "Geschäft mit regionalem Bezug" },
  },
  fr: {
    kicker: "Lieux",
    question: "Que veux-tu voir sur la carte ?",
    all: { title: "Tous", description: "Fermes et magasins sur la carte" },
    farm: { title: "Fermes", description: "Ferme avec vente directe ou livraison" },
    shop: { title: "Magasins", description: "Commerce avec produits locaux" },
  },
  it: {
    kicker: "Luoghi",
    question: "Cosa vuoi vedere sulla mappa?",
    all: { title: "Tutti", description: "Fattorie e negozi sulla mappa" },
    farm: { title: "Fattorie", description: "Azienda con vendita diretta o consegna" },
    shop: { title: "Negozi", description: "Negozio con prodotti regionali" },
  },
  en: {
    kicker: "Locations",
    question: "What do you want to see on the map?",
    all: { title: "All", description: "Farms and shops — everything on the map" },
    farm: { title: "Farms", description: "Farm with direct sales or delivery" },
    shop: { title: "Shops", description: "Shop with local/regional products" },
  },
  uk: {
    kicker: "Локації",
    question: "Що показувати на карті?",
    all: { title: "Усі", description: "Ферми та магазини на карті" },
    farm: { title: "Ферми", description: "Господарство з прямим продажем" },
    shop: { title: "Магазини", description: "Магазин із регіональними продуктами" },
  },
}

const OPTIONS: { value: VenueFilter; emoji: string; spanClass?: string }[] = [
  { value: "all", emoji: "🗺️" },
  { value: "farm", emoji: "🚜" },
  { value: "shop", emoji: "🧺", spanClass: "col-span-2" },
]

type VenueFilterBlockProps = {
  venueFilter: VenueFilter
  onVenueFilterChange: (value: VenueFilter) => void
  className?: string
}

export function VenueFilterBlock({ venueFilter, onVenueFilterChange, className }: VenueFilterBlockProps) {
  const [locale, setLocale] = useState<AppLocale>("de")
  const copy = VENUE_FILTER_COPY[locale]

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    return subscribeAppLocale(setLocale)
  }, [])

  return (
    <section className={cn("notranslate", className)} translate="no">
      <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">{copy.kicker}</p>
      <h2 className="mt-2 text-base font-extrabold leading-snug tracking-tight text-ink">{copy.question}</h2>

      <div className="mt-4 grid grid-cols-2 gap-2.5" role="group" aria-label={copy.kicker}>
        {OPTIONS.map(({ value, emoji, spanClass }) => {
          const option = copy[value]
          const selected = venueFilter === value
          const isWide = spanClass === "col-span-2"
          return (
            <button
              key={value}
              type="button"
              onClick={() => onVenueFilterChange(value)}
              aria-pressed={selected}
              className={cn(
                "hr-venue-tile h-full min-h-[5.25rem]",
                isWide && "hr-venue-tile--wide",
                spanClass,
                selected && "hr-venue-tile--on",
              )}
            >
              <span className="hr-venue-tile__icon" aria-hidden>
                {emoji}
              </span>
              <span className="hr-venue-tile__body">
                <span className="hr-venue-tile__title">{option.title}</span>
                <span className="hr-venue-tile__desc">{option.description}</span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
