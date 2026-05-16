"use client"

import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, Languages, Search, SlidersHorizontal } from "lucide-react"
import { CATEGORIES, type CategoryKey, type VenueFilter } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { Slider } from "@/components/ui/slider"
import { getLocaleSummary, LanguageSwitcher } from "@/components/public/language-switcher"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"
import { BrandLogoMark } from "@/components/public/brand-logo-mark"
import { cn } from "@/lib/utils"
import { surfaceCapsule } from "@/lib/typography"
import { VenueFilterBlock } from "@/components/public/venue-filter-block"
import dynamic from "next/dynamic"

const HopperRabbitFace = dynamic(
  () => import("@/components/graphics/hopper-rabbit-face").then((m) => m.HopperRabbitFace),
  { ssr: false, loading: () => <span className="hr-search-promo__mascot block" aria-hidden /> },
)
import { OpenFarmsToggleBlock } from "@/components/public/open-farms-toggle-block"
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
    searchKicker: string
    searchTitle: string
    searchPlaceholder: string
    distanceAria: string
    filtersLabel: string
    filtersToggleExpand: string
    filtersToggleCollapse: string
    langLabel: string
    langToggleExpand: string
    langToggleCollapse: string
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
    searchKicker: "Suche",
    searchTitle: "Hofladen finden.",
    searchPlaceholder: "Hofladen suchen…",
    distanceAria: "Entfernung",
    filtersLabel: "Suche & Filter",
    filtersToggleExpand: "Filter einblenden",
    filtersToggleCollapse: "Filter ausblenden",
    langLabel: "Sprache",
    langToggleExpand: "Sprachen einblenden",
    langToggleCollapse: "Sprachen ausblenden",
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
    searchKicker: "Recherche",
    searchTitle: "Trouver une ferme.",
    searchPlaceholder: "Rechercher une ferme…",
    distanceAria: "Distance",
    filtersLabel: "Recherche & filtres",
    filtersToggleExpand: "Afficher les filtres",
    filtersToggleCollapse: "Masquer les filtres",
    langLabel: "Langue",
    langToggleExpand: "Afficher les langues",
    langToggleCollapse: "Masquer les langues",
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
    searchKicker: "Cerca",
    searchTitle: "Trova la fattoria.",
    searchPlaceholder: "Cerca una fattoria…",
    distanceAria: "Distanza",
    filtersLabel: "Ricerca e filtri",
    filtersToggleExpand: "Mostra filtri",
    filtersToggleCollapse: "Nascondi filtri",
    langLabel: "Lingua",
    langToggleExpand: "Mostra lingue",
    langToggleCollapse: "Nascondi lingue",
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
    searchKicker: "Search",
    searchTitle: "Find a farm shop.",
    searchPlaceholder: "Search farm…",
    distanceAria: "Distance",
    filtersLabel: "Search & filters",
    filtersToggleExpand: "Show filters",
    filtersToggleCollapse: "Hide filters",
    langLabel: "Language",
    langToggleExpand: "Show languages",
    langToggleCollapse: "Hide languages",
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
    searchKicker: "Пошук",
    searchTitle: "Знайти господарство.",
    searchPlaceholder: "Шукати ферму…",
    distanceAria: "Відстань",
    filtersLabel: "Пошук і фільтри",
    filtersToggleExpand: "Показати фільтри",
    filtersToggleCollapse: "Сховати фільтри",
    langLabel: "Мова",
    langToggleExpand: "Показати мови",
    langToggleCollapse: "Сховати мови",
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
  const [langOpen, setLangOpen] = useState(false)
  const t = UI_TEXT[locale]
  const categoryLabels = CATEGORY_LABELS[locale]
  const langSummary = getLocaleSummary(locale)

  const venueSummaryLabel =
    venueFilter === "all" ? t.venuesAll : venueFilter === "farm" ? t.venuesFarm : t.venuesShop
  const filtersSummary = `${distance} km · ${venueSummaryLabel}${onlyOpenNow ? ` · ${t.onlyOpenShort}` : ""}`

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    return subscribeAppLocale(setLocale)
  }, [])

  const capsule = surfaceCapsule

  return (
    <div
      className="notranslate pointer-events-none fixed inset-x-3 top-3 bottom-12 z-30 flex flex-col gap-2 lg:hidden"
      translate="no"
    >
      <div className="pointer-events-auto flex shrink-0 flex-col gap-2">
        <section className={`${capsule} overflow-hidden p-0 ring-1 ring-primary/[0.07]`}>
          <div className="border-b border-border/50 bg-card px-3 py-2.5">
            <div className="flex min-w-0 items-center gap-2.5">
              <BrandLogoMark size="sm" priority />
              <h1 className="font-pixel min-w-0 truncate text-sm leading-tight text-primary">Hofladen Radar</h1>
            </div>
          </div>
          <div className="border-t border-border/50">
            <button
              type="button"
              onClick={() => setLangOpen((open) => !open)}
              aria-expanded={langOpen}
              aria-label={langOpen ? t.langToggleCollapse : t.langToggleExpand}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
            >
              <Languages className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">{t.langLabel}</p>
                <p className="truncate text-[10px] text-muted-foreground">{langSummary}</p>
              </div>
              {langOpen ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              )}
            </button>
            {langOpen ? (
              <div className="border-t border-border/40 px-2.5 pb-2.5 pt-2">
                <LanguageSwitcher value={locale} variant="bare" />
              </div>
            ) : null}
          </div>
        </section>

        <section className="hr-search-promo hr-search-promo--compact notranslate" translate="no">
          <div className="hr-search-promo__glow" aria-hidden />
          <div className="hr-search-promo__inner">
            <div className="hr-search-promo__copy">
              <span className="hr-search-promo__badge font-pixel">{t.searchKicker}</span>
              <h2 className="hr-search-promo__title">{t.searchTitle}</h2>
              <div className="hr-search-promo__field">
                <Search className="hr-search-promo__field-icon" aria-hidden />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  aria-label={t.searchPlaceholder}
                  className="hr-search-promo__input"
                />
              </div>
            </div>
            <div className="hr-search-promo__orb" aria-hidden>
              <HopperRabbitFace className="hr-search-promo__mascot" />
            </div>
          </div>
        </section>
      </div>

      <div
        className={cn(
          "pointer-events-auto flex w-full min-h-0 flex-col",
          filtersOpen ? "flex-1 overflow-hidden" : "mt-auto",
        )}
      >
        <section
          className={cn(
            `${capsule} w-full overflow-hidden p-0`,
            filtersOpen && "flex min-h-0 flex-1 flex-col",
          )}
        >
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
              <div className="hr-scroll-pane min-h-0 flex-1 space-y-2 overflow-y-auto border-t border-border/60 p-2.5 pt-2">
                <div className="rounded-xl border border-border/80 bg-muted/40 p-2.5">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t.distance}
                    </h2>
                    <span className="font-pixel tabular-nums text-xs text-foreground">{distance} km</span>
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

                <VenueFilterBlock
                  className="rounded-xl border border-border/80 bg-white/70 p-3 shadow-soft backdrop-blur-sm"
                  venueFilter={venueFilter}
                  onVenueFilterChange={onVenueFilterChange}
                />

                <OpenFarmsToggleBlock
                  compact
                  onlyOpenNow={onlyOpenNow}
                  onOnlyOpenNowChange={onOnlyOpenNowChange}
                />

                <div
                  className="hr-lang-panel hr-lang-panel--bare notranslate"
                  translate="no"
                  role="group"
                  aria-label={t.categories}
                >
                  <div className="hr-lang-grid">
                    {CATEGORIES.map((cat) => {
                      const active = selectedCategories.includes(cat.key)
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => onToggleCategory(cat.key)}
                          className={cn("hr-lang-card", active && "hr-lang-card--on")}
                          aria-pressed={active}
                          aria-label={categoryLabels[cat.key]}
                        >
                          <CategoryIcon category={cat.key} className="hr-lang-card__icon" />
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
  )
}
