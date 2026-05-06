"use client"

import { useEffect, useState } from "react"
import { Search, Radar, Shield, Smartphone } from "lucide-react"
import { CATEGORIES, type CategoryKey, type VenueFilter } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { LanguageSwitcher } from "@/components/public/language-switcher"
import { EarlyAccessButton } from "@/components/public/early-access-button"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"

interface MobileBarProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  selectedCategories: CategoryKey[]
  onToggleCategory: (key: CategoryKey) => void
  venueFilter: VenueFilter
  onVenueFilterChange: (value: VenueFilter) => void
  onlyOpenNow: boolean
  onOnlyOpenNowChange: (value: boolean) => void
  distance: number
  onDistanceChange: (d: number) => void
}

const UI_TEXT: Record<
  AppLocale,
  {
    venuesTitle: string
    venuesAll: string
    venuesFarm: string
    venuesShop: string
    onlyOpenTitle: string
    onlyOpenAria: string
    searchPlaceholder: string
    distanceAria: string
  }
> = {
  de: {
    venuesTitle: "Standorte",
    venuesAll: "Alle",
    venuesFarm: "Höfe",
    venuesShop: "Läden",
    onlyOpenTitle: "Nur geöffnete Hofläden",
    onlyOpenAria: "Nur geöffnete Hofläden anzeigen",
    searchPlaceholder: "Hofladen suchen…",
    distanceAria: "Entfernung",
  },
  fr: {
    venuesTitle: "Lieux",
    venuesAll: "Tous",
    venuesFarm: "Fermes",
    venuesShop: "Magasins",
    onlyOpenTitle: "Seulement les fermes ouvertes",
    onlyOpenAria: "Afficher uniquement les fermes ouvertes",
    searchPlaceholder: "Rechercher une ferme…",
    distanceAria: "Distance",
  },
  it: {
    venuesTitle: "Luoghi",
    venuesAll: "Tutti",
    venuesFarm: "Fattorie",
    venuesShop: "Negozi",
    onlyOpenTitle: "Solo fattorie aperte",
    onlyOpenAria: "Mostra solo fattorie aperte",
    searchPlaceholder: "Cerca una fattoria…",
    distanceAria: "Distanza",
  },
  en: {
    venuesTitle: "Locations",
    venuesAll: "All",
    venuesFarm: "Farms",
    venuesShop: "Shops",
    onlyOpenTitle: "Open farms only",
    onlyOpenAria: "Show open farms only",
    searchPlaceholder: "Search farm…",
    distanceAria: "Distance",
  },
  uk: {
    venuesTitle: "Локації",
    venuesAll: "Усі",
    venuesFarm: "Ферми",
    venuesShop: "Магазини",
    onlyOpenTitle: "Лише відкриті ферми",
    onlyOpenAria: "Показувати лише відкриті ферми",
    searchPlaceholder: "Шукати ферму…",
    distanceAria: "Відстань",
  },
}

const CATEGORY_LABELS: Record<AppLocale, Record<CategoryKey, string>> = {
  de: {
    milch: "Milch",
    kaese: "Käse",
    eier: "Eier",
    fleisch: "Fleisch",
    obst: "Obst",
    honig: "Honig",
    gemuese: "Gemüse",
    kraeuter: "Kräuter",
  },
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

export function MobileBar({
  searchQuery,
  onSearchChange,
  selectedCategories,
  onToggleCategory,
  venueFilter,
  onVenueFilterChange,
  onlyOpenNow,
  onOnlyOpenNowChange,
  distance,
  onDistanceChange,
}: MobileBarProps) {
  const [locale, setLocale] = useState<AppLocale>("de")
  const t = UI_TEXT[locale]
  const categoryLabels = CATEGORY_LABELS[locale]

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    return subscribeAppLocale(setLocale)
  }, [])

  return (
    <>
      <div className="notranslate pointer-events-auto fixed left-3 right-3 top-3 z-30 md:hidden" translate="no">
        <div className="rounded-[28px] border border-border/70 bg-card/95 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background">
                  <Radar className="h-4 w-4 text-primary" />
                </div>
                <h1 className="min-w-0 truncate text-base font-semibold leading-none text-foreground">Hofladen Radar</h1>
              </div>
              <div className="mt-3">
                <LanguageSwitcher value={locale} />
              </div>
              <div className="mt-2 flex flex-col items-start gap-1">
                <a
                  href="/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground"
                >
                  <Shield className="h-3.5 w-3.5" />
                  Datenschutz
                </a>
                <button
                  type="button"
                  disabled
                  title="Bald verfügbar"
                  className="inline-flex cursor-not-allowed items-center gap-1 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground/70 opacity-80"
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Android App herunterladen
                </button>
                <EarlyAccessButton />
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="rounded-full bg-background px-2.5 py-1 text-[11px] font-semibold tabular-nums text-foreground">
                {distance} km
              </div>
            </div>
          </div>

          <div className="mt-3 px-0.5">
            <div className="flex items-center justify-between text-[10px] font-medium text-muted-foreground">
              <span>1 km</span>
              <span>20 km</span>
            </div>
            <Slider
              min={1}
              max={20}
              step={1}
              value={[distance]}
              onValueChange={(values) => {
                const next = values[0]
                if (typeof next === "number") onDistanceChange(next)
              }}
              className="mt-2 w-full py-2"
              aria-label={t.distanceAria}
            />
          </div>

          <div className="notranslate mt-3" translate="no">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{t.venuesTitle}</p>
            <div className="mt-1.5 flex rounded-xl border border-border/70 bg-background/50 p-0.5">
              {(
                [
                  { value: "all" as const, label: t.venuesAll },
                  { value: "farm" as const, label: t.venuesFarm },
                  { value: "shop" as const, label: t.venuesShop },
                ] as const
              ).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onVenueFilterChange(value)}
                  className={`flex-1 rounded-lg px-1.5 py-1.5 text-[10px] font-semibold transition-colors ${
                    venueFilter === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  aria-pressed={venueFilter === value}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div
            className="notranslate mt-3 flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-background/50 px-3 py-2.5"
            translate="no"
          >
            <span className="text-xs font-semibold text-foreground">{t.onlyOpenTitle}</span>
            <Switch
              checked={onlyOpenNow}
              onCheckedChange={onOnlyOpenNowChange}
              aria-label={t.onlyOpenAria}
            />
          </div>

          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-10 w-full rounded-full border border-border/70 bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-auto fixed bottom-18 left-0 right-0 z-30 md:hidden">
        <div
          className="no-scrollbar notranslate flex gap-2 overflow-x-auto px-3 py-2"
          translate="no"
        >
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat.key)
            return (
              <button
                key={cat.key}
                onClick={() => onToggleCategory(cat.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm backdrop-blur-xl transition-all ${
                  active
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-card/95 text-foreground"
                }`}
                aria-pressed={active}
              >
                <CategoryIcon category={cat.key} className="h-4 w-4" />
                {categoryLabels[cat.key]}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
