"use client"

import { useEffect, useState } from "react"
import { Search, Map, List } from "lucide-react"
import { CATEGORIES, type CategoryKey, type Farm, type VenueFilter } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { Slider } from "@/components/ui/slider"
import { LanguageSwitcher } from "@/components/public/language-switcher"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"
import { BrandLogoMark } from "@/components/public/brand-logo-mark"
import { surfaceCapsule, surfaceCapsulePad } from "@/lib/typography"
import { VenueFilterBlock } from "@/components/public/venue-filter-block"
import dynamic from "next/dynamic"

const HopperRabbitFace = dynamic(
  () => import("@/components/graphics/hopper-rabbit-face").then((m) => m.HopperRabbitFace),
  { ssr: false, loading: () => <span className="hr-search-promo__mascot block" aria-hidden /> },
)
import { OpenFarmsToggleBlock } from "@/components/public/open-farms-toggle-block"
import { VenueListCard } from "@/components/public/venue-list-card"
import { cn } from "@/lib/utils"
interface DesktopSidebarProps {
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
  viewMode: "map" | "list"
  onViewModeChange: (m: "map" | "list") => void
  farms: Farm[]
  onSelectFarm: (id: string) => void
  selectedFarmId: string | null
}

const UI_TEXT: Record<
  AppLocale,
  {
    subtitle: string
    searchKicker: string
    searchTitle: string
    searchHint: string
    searchPlaceholder: string
    venuesTitle: string
    venuesHint: string
    venuesAll: string
    venuesFarm: string
    venuesShop: string
    categories: string
    onlyOpenTitle: string
    onlyOpenHint: string
    onlyOpenAria: string
    distance: string
    map: string
    list: string
    nearby: string
    nearbyHint: string
    farmsCount: string
    openNow: string
    closed: string
    noFarms: string
  }
> = {
  de: {
    subtitle: "Frisch vom Hof, in der Nähe.",
    searchKicker: "Suche",
    searchTitle: "Hofladen finden.",
    searchHint: "Name, Ort oder Produkt — live auf der Karte.",
    searchPlaceholder: "Hofladen oder Produkt suchen…",
    venuesTitle: "Standorte",
    venuesHint: "Alle Einträge, nur Bauernhöfe oder nur Läden anzeigen.",
    venuesAll: "Alle",
    venuesFarm: "Höfe",
    venuesShop: "Läden",
    categories: "Kategorien",
    onlyOpenTitle: "Nur geöffnete Hofläden",
    onlyOpenHint: "Es werden nur Höfe angezeigt, die gerade geöffnet sind.",
    onlyOpenAria: "Nur geöffnete Hofläden anzeigen",
    distance: "Entfernung",
    map: "Karte",
    list: "Liste",
    nearby: "In der Nähe",
    nearbyHint: "Seitenleiste scrollen, um alle Treffer zu sehen.",
    farmsCount: "Höfe",
    openNow: "Jetzt geöffnet",
    closed: "Geschlossen",
    noFarms: "Keine Höfe gefunden. Filter anpassen.",
  },
  fr: {
    subtitle: "Directement de la ferme, tout près.",
    searchKicker: "Recherche",
    searchTitle: "Trouver une ferme.",
    searchHint: "Nom, lieu ou produit — sur la carte.",
    searchPlaceholder: "Rechercher une ferme ou un produit…",
    venuesTitle: "Lieux",
    venuesHint: "Afficher toutes les entrées, seulement les fermes ou seulement les magasins.",
    venuesAll: "Tous",
    venuesFarm: "Fermes",
    venuesShop: "Magasins",
    categories: "Catégories",
    onlyOpenTitle: "Seulement les fermes ouvertes",
    onlyOpenHint: "Afficher uniquement les fermes actuellement ouvertes.",
    onlyOpenAria: "Afficher uniquement les fermes ouvertes",
    distance: "Distance",
    map: "Carte",
    list: "Liste",
    nearby: "À proximité",
    nearbyHint: "Faites défiler le panneau pour voir tous les résultats.",
    farmsCount: "fermes",
    openNow: "Ouvert maintenant",
    closed: "Fermé",
    noFarms: "Aucune ferme trouvée. Ajustez les filtres.",
  },
  it: {
    subtitle: "Fresco dalla fattoria, vicino a te.",
    searchKicker: "Cerca",
    searchTitle: "Trova la fattoria.",
    searchHint: "Nome, luogo o prodotto — sulla mappa.",
    searchPlaceholder: "Cerca fattoria o prodotto…",
    venuesTitle: "Luoghi",
    venuesHint: "Mostra tutte le voci, solo fattorie o solo negozi.",
    venuesAll: "Tutti",
    venuesFarm: "Fattorie",
    venuesShop: "Negozi",
    categories: "Categorie",
    onlyOpenTitle: "Solo fattorie aperte",
    onlyOpenHint: "Mostra solo le fattorie attualmente aperte.",
    onlyOpenAria: "Mostra solo fattorie aperte",
    distance: "Distanza",
    map: "Mappa",
    list: "Elenco",
    nearby: "Nelle vicinanze",
    nearbyHint: "Scorri il pannello per vedere tutti i risultati.",
    farmsCount: "fattorie",
    openNow: "Aperto ora",
    closed: "Chiuso",
    noFarms: "Nessuna fattoria trovata. Modifica i filtri.",
  },
  en: {
    subtitle: "Fresh from local farms, nearby.",
    searchKicker: "Search",
    searchTitle: "Find a farm shop.",
    searchHint: "Name, place or product — on the map.",
    searchPlaceholder: "Search farm or product…",
    venuesTitle: "Locations",
    venuesHint: "Show all entries, farms only, or shops only.",
    venuesAll: "All",
    venuesFarm: "Farms",
    venuesShop: "Shops",
    categories: "Categories",
    onlyOpenTitle: "Open farms only",
    onlyOpenHint: "Show only farms that are currently open.",
    onlyOpenAria: "Show open farms only",
    distance: "Distance",
    map: "Map",
    list: "List",
    nearby: "Nearby",
    nearbyHint: "Scroll this sidebar to see every match.",
    farmsCount: "farms",
    openNow: "Open now",
    closed: "Closed",
    noFarms: "No farms found. Adjust filters.",
  },
  uk: {
    subtitle: "Свіже з ферми поруч.",
    searchKicker: "Пошук",
    searchTitle: "Знайти господарство.",
    searchHint: "Назва, місце чи продукт — на мапі.",
    searchPlaceholder: "Шукати ферму або продукт…",
    venuesTitle: "Локації",
    venuesHint: "Показати всі точки, лише ферми або лише магазини.",
    venuesAll: "Усі",
    venuesFarm: "Ферми",
    venuesShop: "Магазини",
    categories: "Категорії",
    onlyOpenTitle: "Лише відкриті ферми",
    onlyOpenHint: "Показувати лише ферми, які зараз відкриті.",
    onlyOpenAria: "Показувати лише відкриті ферми",
    distance: "Відстань",
    map: "Мапа",
    list: "Список",
    nearby: "Поруч",
    nearbyHint: "Прокрутіть бічну панель, щоб побачити всі результати.",
    farmsCount: "ферм",
    openNow: "Зараз відкрито",
    closed: "Зачинено",
    noFarms: "Ферм не знайдено. Змініть фільтри.",
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

export function DesktopSidebar({
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
  viewMode,
  onViewModeChange,
  farms,
  onSelectFarm,
  selectedFarmId,
}: DesktopSidebarProps) {
  const [locale, setLocale] = useState<AppLocale>("de")
  const t = UI_TEXT[locale]
  const categoryLabels = CATEGORY_LABELS[locale]

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    return subscribeAppLocale(setLocale)
  }, [])

  return (
    <aside
      className="notranslate pointer-events-auto fixed left-4 top-4 z-40 hidden max-h-[calc(100vh-2rem)] w-[340px] flex-col gap-3 overflow-y-auto overflow-x-hidden overscroll-contain bg-transparent p-0 pb-3 shadow-none lg:flex"
      translate="no"
    >
      {/* Brand + language — корпоративний шапковий блок як у решти капсул (mint band + muted toolbars) */}
      <section className={`shrink-0 ${surfaceCapsule}`}>
        <div className="border-b border-border/50 bg-card px-4 py-3.5">
          <div className="flex items-start gap-3">
            <BrandLogoMark priority />
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="font-pixel text-[1.05rem] leading-tight text-primary">Hofladen Radar</h1>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="px-3 pb-3 pt-2">
          <LanguageSwitcher value={locale} variant="bare" />
        </div>
      </section>

      {/* Search */}
      <section className="hr-search-promo notranslate shrink-0" translate="no">
        <div className="hr-search-promo__glow" aria-hidden />
        <div className="hr-search-promo__inner">
          <div className="hr-search-promo__copy">
            <span className="hr-search-promo__badge font-pixel">{t.searchKicker}</span>
            <h2 className="hr-search-promo__title">{t.searchTitle}</h2>
            <p className="hr-search-promo__hint">{t.searchHint}</p>
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

      {/* Standorte / Locations */}
      <VenueFilterBlock
        className={`shrink-0 ${surfaceCapsulePad}`}
        venueFilter={venueFilter}
        onVenueFilterChange={onVenueFilterChange}
      />

      {/* Categories */}
      <section className={`notranslate shrink-0 ${surfaceCapsulePad}`} translate="no">
        <div className="hr-lang-panel hr-lang-panel--bare" role="group" aria-label={t.categories}>
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
      </section>

      <OpenFarmsToggleBlock
        className="shrink-0"
        onlyOpenNow={onlyOpenNow}
        onOnlyOpenNowChange={onOnlyOpenNowChange}
      />

      {/* Entfernung */}
      <section className={`notranslate shrink-0 ${surfaceCapsulePad}`} translate="no">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.distance}</h2>
          <span className="font-pixel tabular-nums text-xs text-foreground">{distance} km</span>
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
          className="mt-3 w-full py-2"
          aria-label="Entfernung"
        />
        <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
          <span>1 km</span>
          <span>20 km</span>
        </div>
      </section>

      {/* Karte / Liste */}
      <section className={`notranslate shrink-0 ${surfaceCapsulePad}`} translate="no">
        <div className="flex rounded-2xl border border-border bg-muted p-1">
          <button
            onClick={() => onViewModeChange("map")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "map" ? "bg-accent text-primary shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            {t.map}
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "list" ? "bg-accent text-primary shadow-sm" : "text-muted-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            {t.list}
          </button>
        </div>
      </section>

      {/* Höfe in der Nähe — volle Höhe des Inhalts; gesamte Leiste scrollt, falls Filter viel Platz brauchen */}
      <section
        className="notranslate shrink-0 rounded-2xl border border-primary/20 bg-card/95 p-4 shadow-sm ring-1 ring-primary/10 backdrop-blur-xl"
        translate="no"
      >
        <div className="border-b border-border/70 pb-3">
          <div className="flex items-start justify-between gap-2">
            <h2 className="text-sm font-semibold leading-tight tracking-tight text-foreground">{t.nearby}</h2>
            <span className="font-pixel shrink-0 whitespace-nowrap rounded-full border border-primary/25 bg-accent px-2 py-0.5 text-[11px] tabular-nums text-primary">
              {farms.length} {t.farmsCount}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{t.nearbyHint}</p>
        </div>
        <div className="mt-3 space-y-2">
          {farms.map((farm) => (
            <VenueListCard
              key={farm.id}
              farm={farm}
              selected={selectedFarmId === farm.id}
              onSelect={() => onSelectFarm(farm.id)}
              openNowLabel={t.openNow}
              closedLabel={t.closed}
            />
          ))}
          {farms.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
              {t.noFarms}
            </p>
          )}
        </div>
      </section>
    </aside>
  )
}
