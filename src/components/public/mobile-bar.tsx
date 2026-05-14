"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronDown, ChevronUp, Mail, Search, Shield, SlidersHorizontal, Smartphone } from "lucide-react"
import { CATEGORIES, type CategoryKey, type VenueFilter } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { LanguageSwitcher } from "@/components/public/language-switcher"
import { EarlyAccessButton } from "@/components/public/early-access-button"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"
import { BRAND_LOGO_SRC } from "@/lib/brand-assets"

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
    categories: string
    distance: string
    onlyOpenTitle: string
    onlyOpenAria: string
    /** Kurz in der eingeklappten Filterzeile (z. B. „Offen“) */
    onlyOpenShort: string
    searchPlaceholder: string
    distanceAria: string
    filtersLabel: string
    filtersToggleExpand: string
    filtersToggleCollapse: string
  }
> = {
  de: {
    venuesTitle: "Standorte",
    venuesAll: "Alle",
    venuesFarm: "Höfe",
    venuesShop: "Läden",
    categories: "Kategorien",
    distance: "Entfernung",
    onlyOpenTitle: "Nur geöffnete Hofläden",
    onlyOpenAria: "Nur geöffnete Hofläden anzeigen",
    onlyOpenShort: "Offen",
    searchPlaceholder: "Hofladen suchen…",
    distanceAria: "Entfernung",
    filtersLabel: "Suche & Filter",
    filtersToggleExpand: "Filter einblenden",
    filtersToggleCollapse: "Filter ausblenden",
  },
  fr: {
    venuesTitle: "Lieux",
    venuesAll: "Tous",
    venuesFarm: "Fermes",
    venuesShop: "Magasins",
    categories: "Catégories",
    distance: "Distance",
    onlyOpenTitle: "Seulement les fermes ouvertes",
    onlyOpenAria: "Afficher uniquement les fermes ouvertes",
    onlyOpenShort: "Ouvert",
    searchPlaceholder: "Rechercher une ferme…",
    distanceAria: "Distance",
    filtersLabel: "Recherche & filtres",
    filtersToggleExpand: "Afficher les filtres",
    filtersToggleCollapse: "Masquer les filtres",
  },
  it: {
    venuesTitle: "Luoghi",
    venuesAll: "Tutti",
    venuesFarm: "Fattorie",
    venuesShop: "Negozi",
    categories: "Categorie",
    distance: "Distanza",
    onlyOpenTitle: "Solo fattorie aperte",
    onlyOpenAria: "Mostra solo fattorie aperte",
    onlyOpenShort: "Aperto",
    searchPlaceholder: "Cerca una fattoria…",
    distanceAria: "Distanza",
    filtersLabel: "Ricerca e filtri",
    filtersToggleExpand: "Mostra filtri",
    filtersToggleCollapse: "Nascondi filtri",
  },
  en: {
    venuesTitle: "Locations",
    venuesAll: "All",
    venuesFarm: "Farms",
    venuesShop: "Shops",
    categories: "Categories",
    distance: "Distance",
    onlyOpenTitle: "Open farms only",
    onlyOpenAria: "Show open farms only",
    onlyOpenShort: "Open",
    searchPlaceholder: "Search farm…",
    distanceAria: "Distance",
    filtersLabel: "Search & filters",
    filtersToggleExpand: "Show filters",
    filtersToggleCollapse: "Hide filters",
  },
  uk: {
    venuesTitle: "Локації",
    venuesAll: "Усі",
    venuesFarm: "Ферми",
    venuesShop: "Магазини",
    categories: "Категорії",
    distance: "Відстань",
    onlyOpenTitle: "Лише відкриті ферми",
    onlyOpenAria: "Показувати лише відкриті ферми",
    onlyOpenShort: "Відкр.",
    searchPlaceholder: "Шукати ферму…",
    distanceAria: "Відстань",
    filtersLabel: "Пошук і фільтри",
    filtersToggleExpand: "Показати фільтри",
    filtersToggleCollapse: "Сховати фільтри",
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
  const [filtersOpen, setFiltersOpen] = useState(false)
  const t = UI_TEXT[locale]
  const categoryLabels = CATEGORY_LABELS[locale]

  const venueSummaryLabel =
    venueFilter === "all" ? t.venuesAll : venueFilter === "farm" ? t.venuesFarm : t.venuesShop
  const filtersSummary = `${distance} km · ${venueSummaryLabel}${onlyOpenNow ? ` · ${t.onlyOpenShort}` : ""}`

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    return subscribeAppLocale(setLocale)
  }, [])

  const capsule =
    "rounded-2xl border border-border bg-card/95 shadow-sm backdrop-blur-xl"

  return (
    <>
      {/* Top stack — logical capsules (desktop sidebar style) */}
      <div className="notranslate pointer-events-auto fixed left-3 right-3 top-3 z-30 flex flex-col gap-2 lg:hidden" translate="no">
        <section className={`${capsule} overflow-hidden p-0 ring-1 ring-primary/[0.07]`}>
          <div className="border-b border-border/50 bg-brand-mint/60 px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/15 bg-card shadow-sm">
                <Image
                  src={BRAND_LOGO_SRC}
                  alt="Hofladen Radar"
                  width={64}
                  height={64}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
              <h1 className="min-w-0 truncate text-sm font-semibold leading-tight text-primary">Hofladen Radar</h1>
            </div>
          </div>
          <div className="space-y-2 p-2.5">
            <div className="rounded-2xl border border-border bg-muted p-1">
              <LanguageSwitcher value={locale} variant="bare" />
            </div>
            <div className="flex gap-1 rounded-2xl border border-border bg-muted p-1">
              <a
                href="/datenschutz"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-8 min-w-0 flex-1 items-center justify-center gap-1 rounded-xl text-[10px] font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              >
                <Shield className="h-3 w-3 shrink-0" />
                <span className="truncate">Datenschutz</span>
              </a>
              <button
                type="button"
                disabled
                title="Bald verfügbar"
                aria-label="Android App herunterladen"
                className="flex h-8 min-w-0 flex-1 cursor-not-allowed items-center justify-center rounded-xl text-muted-foreground/55 opacity-90"
              >
                <Smartphone className="h-3.5 w-3.5 shrink-0" />
              </button>
              <EarlyAccessButton
                className="h-8 min-w-0 flex-1 rounded-xl border-0 bg-transparent px-0 text-muted-foreground hover:bg-accent hover:text-primary"
                triggerContent={<Mail className="h-3.5 w-3.5" />}
                ariaLabel="Früher Zugang"
                title="Früher Zugang"
              />
            </div>
          </div>
        </section>

        <section className={`${capsule} p-2.5`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t.searchPlaceholder}
              className="h-9 w-full rounded-2xl border-0 bg-input pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/25"
            />
          </div>
        </section>
      </div>

      {/* Bottom: collapsible filter stack (mobile) */}
      <div className="notranslate pointer-events-none fixed bottom-12 left-0 right-0 z-30 lg:hidden" translate="no">
        <div className="pointer-events-auto px-3">
          <section className={`${capsule} overflow-hidden p-0`}>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-label={filtersOpen ? t.filtersToggleCollapse : t.filtersToggleExpand}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">{t.filtersLabel}</p>
                <p className="truncate text-[10px] text-muted-foreground">{filtersSummary}</p>
              </div>
              {filtersOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </button>

            {filtersOpen ? (
              <div className="space-y-2 border-t border-border/60 p-2.5 pt-2">
                <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.distance}
                    </h2>
                    <span className="tabular-nums text-xs font-medium text-foreground">{distance} km</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-[10px] font-medium text-muted-foreground">
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
                    className="mt-1 w-full py-1.5"
                    aria-label={t.distanceAria}
                  />
                </div>

                <div className="notranslate rounded-xl border border-border/80 bg-muted/40 p-2.5" translate="no">
                  <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.venuesTitle}
                  </h2>
                  <div className="notranslate mt-2 flex rounded-xl border border-border bg-muted p-0.5" translate="no">
                    {(
                      [
                        { value: "all" as const, label: t.venuesAll, emoji: "🗺️" },
                        { value: "farm" as const, label: t.venuesFarm, emoji: "🚜" },
                        { value: "shop" as const, label: t.venuesShop, emoji: "🧺" },
                      ] as const
                    ).map(({ value, label, emoji }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => onVenueFilterChange(value)}
                        className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1.5 text-[10px] font-semibold leading-tight transition-colors ${
                          venueFilter === value
                            ? "bg-accent text-primary shadow-sm"
                            : "text-muted-foreground"
                        }`}
                        aria-pressed={venueFilter === value}
                      >
                        <span className="text-sm" aria-hidden>
                          {emoji}
                        </span>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`notranslate rounded-xl border border-border/80 bg-muted/40 p-2.5`} translate="no">
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-muted px-3 py-2">
                    <span className="min-w-0 truncate text-[11px] font-semibold text-foreground">{t.onlyOpenTitle}</span>
                    <Switch
                      checked={onlyOpenNow}
                      onCheckedChange={onOnlyOpenNowChange}
                      aria-label={t.onlyOpenAria}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5">
                  <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t.categories}
                  </h2>
                  <div className="no-scrollbar flex gap-2 overflow-x-auto pb-0.5">
                    {CATEGORIES.map((cat) => {
                      const active = selectedCategories.includes(cat.key)
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => onToggleCategory(cat.key)}
                          className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm transition-all ${
                            active
                              ? "border-primary bg-accent text-primary"
                              : "border-border bg-card text-foreground"
                          }`}
                          aria-pressed={active}
                        >
                          <CategoryIcon category={cat.key} className="text-base leading-none" />
                          {categoryLabels[cat.key]}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </>
  )
}
