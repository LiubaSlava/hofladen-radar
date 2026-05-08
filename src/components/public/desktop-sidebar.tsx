"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Search, Map, List, Radar, Shield, Smartphone } from "lucide-react"
import { CATEGORIES, type CategoryKey, type Farm, type VenueFilter } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { LanguageSwitcher } from "@/components/public/language-switcher"
import { EarlyAccessButton } from "@/components/public/early-access-button"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"

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
    farmsCount: string
    openNow: string
    closed: string
    noFarms: string
  }
> = {
  de: {
    subtitle: "Frisch vom Hof, in der Nähe.",
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
    farmsCount: "Höfe",
    openNow: "Jetzt geöffnet",
    closed: "Geschlossen",
    noFarms: "Keine Höfe gefunden. Filter anpassen.",
  },
  fr: {
    subtitle: "Directement de la ferme, tout près.",
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
    farmsCount: "fermes",
    openNow: "Ouvert maintenant",
    closed: "Fermé",
    noFarms: "Aucune ferme trouvée. Ajustez les filtres.",
  },
  it: {
    subtitle: "Fresco dalla fattoria, vicino a te.",
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
    farmsCount: "fattorie",
    openNow: "Aperto ora",
    closed: "Chiuso",
    noFarms: "Nessuna fattoria trovata. Modifica i filtri.",
  },
  en: {
    subtitle: "Fresh from local farms, nearby.",
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
    farmsCount: "farms",
    openNow: "Open now",
    closed: "Closed",
    noFarms: "No farms found. Adjust filters.",
  },
  uk: {
    subtitle: "Свіже з ферми поруч.",
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
      className="notranslate pointer-events-auto fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-[340px] flex-col overflow-hidden rounded-3xl border border-border/60 bg-card/75 shadow-2xl backdrop-blur-2xl lg:flex"
      translate="no"
    >
      {/* Header */}
      <div className="flex items-start gap-3 border-b border-border/50 px-6 py-5">
        <div className="-mt-1 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/10">
          <Image
            src="/logo.png"
            alt="Hofladen Radar"
            width={80}
            height={80}
            className="h-full w-full object-contain"
            priority
          />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold leading-none tracking-tight text-foreground">Hofladen Radar</h1>
          <p className="text-xs text-muted-foreground">{t.subtitle}</p>
          <div className="mt-3">
            <LanguageSwitcher value={locale} />
          </div>
          <div className="mt-2 flex flex-col items-start gap-1">
            <a
              href="/datenschutz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
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
      </div>

      {/* Search */}
      <div className="px-6 pt-5">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-2xl border border-border/60 bg-background/60 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Höfe / Läden — filtert nach DB-Spalte `category` (`farm` | `shop`) */}
      <div className="notranslate px-6 pt-5" translate="no">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.venuesTitle}</h2>
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
          {t.venuesHint}
        </p>
        <div className="mt-2 flex rounded-2xl border border-border/60 bg-background/40 p-1">
          <button
            type="button"
            onClick={() => onVenueFilterChange("all")}
            className={`flex flex-1 items-center justify-center rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
              venueFilter === "all" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            aria-pressed={venueFilter === "all"}
          >
            {t.venuesAll}
          </button>
          <button
            type="button"
            onClick={() => onVenueFilterChange("farm")}
            className={`flex flex-1 items-center justify-center rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
              venueFilter === "farm" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            aria-pressed={venueFilter === "farm"}
          >
            {t.venuesFarm}
          </button>
          <button
            type="button"
            onClick={() => onVenueFilterChange("shop")}
            className={`flex flex-1 items-center justify-center rounded-xl px-2 py-2 text-[11px] font-medium transition-colors ${
              venueFilter === "shop" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
            aria-pressed={venueFilter === "shop"}
          >
            {t.venuesShop}
          </button>
        </div>
      </div>

      {/* Categories — notranslate: Auto-Translate wraps labels in <font> and breaks hydration */}
      <div className="notranslate px-6 pt-5" translate="no">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.categories}</h2>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat.key)
            return (
              <button
                key={cat.key}
                onClick={() => onToggleCategory(cat.key)}
                className={`flex flex-col items-center gap-1.5 rounded-2xl border p-2.5 transition-all ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/60 bg-background/40 text-muted-foreground hover:border-border hover:text-foreground"
                }`}
                aria-pressed={active}
              >
                <CategoryIcon category={cat.key} className="h-5 w-5" />
                <span className="text-[10px] font-medium">{categoryLabels[cat.key]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Nur geöffnet — lokaler Filter (client state in RadarView) */}
      <div className="notranslate px-6 pt-5" translate="no">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/40 px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">{t.onlyOpenTitle}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">
              {t.onlyOpenHint}
            </p>
          </div>
          <Switch
            checked={onlyOpenNow}
            onCheckedChange={onOnlyOpenNowChange}
            aria-label={t.onlyOpenAria}
          />
        </div>
      </div>

      {/* Distance slider — notranslate: page auto-translate must not replace this subtree or the km label stops updating */}
      <div className="notranslate px-6 pt-6" translate="no">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.distance}</h2>
          <span className="tabular-nums text-xs font-medium text-foreground">
            {distance} km
          </span>
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
      </div>

      {/* View toggle */}
      <div className="notranslate px-6 pt-6" translate="no">
        <div className="flex rounded-2xl border border-border/60 bg-background/40 p-1">
          <button
            onClick={() => onViewModeChange("map")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "map" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Map className="h-3.5 w-3.5" />
            {t.map}
          </button>
          <button
            onClick={() => onViewModeChange("list")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
              viewMode === "list" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <List className="h-3.5 w-3.5" />
            {t.list}
          </button>
        </div>
      </div>

      {/* Farms list */}
      <div className="mt-6 flex-1 overflow-y-auto px-6 pb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.nearby}</h2>
          <span className="text-xs text-muted-foreground">{farms.length} {t.farmsCount}</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => onSelectFarm(farm.id)}
              className={`group flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                selectedFarmId === farm.id
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-background/40 hover:border-border"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Radar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{farm.name}</p>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{farm.distanceKm} km</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${farm.openNow ? "bg-primary" : "bg-muted-foreground/40"}`}
                  />
                  <p className="truncate text-xs text-muted-foreground">
                    {farm.openNow ? t.openNow : t.closed} · ★ {farm.rating}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {farms.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
              {t.noFarms}
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
