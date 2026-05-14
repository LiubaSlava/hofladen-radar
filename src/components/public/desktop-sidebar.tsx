"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Search, Map, List, Shield, Smartphone, Mail } from "lucide-react"
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
    nearbyHint: string
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
    nearbyHint: "Seitenleiste scrollen, um alle Treffer zu sehen.",
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
    nearbyHint: "Faites défiler le panneau pour voir tous les résultats.",
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
    nearbyHint: "Scorri il pannello per vedere tutti i risultati.",
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
    nearbyHint: "Scroll this sidebar to see every match.",
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
      <section className="shrink-0 overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm ring-1 ring-primary/[0.07] backdrop-blur-xl">
        <div className="border-b border-border/50 bg-brand-mint/60 px-4 py-3.5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/15 bg-card shadow-sm">
              <Image
                src="/logo.png"
                alt="Hofladen Radar"
                width={80}
                height={80}
                className="h-full w-full object-contain"
                priority
              />
            </div>
            <div className="min-w-0 flex-1 pt-0.5">
              <h1 className="text-[1.05rem] font-semibold leading-tight tracking-tight text-primary">Hofladen Radar</h1>
              <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{t.subtitle}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 p-3">
          <div className="rounded-2xl border border-border bg-muted p-1">
            <LanguageSwitcher value={locale} variant="bare" />
          </div>
          <div className="flex gap-1 rounded-2xl border border-border bg-muted p-1">
            <a
              href="/datenschutz"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Datenschutz"
              title="Datenschutz"
              className="flex h-9 min-w-0 flex-1 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            >
              <Shield className="h-3.5 w-3.5" />
            </a>
            <button
              type="button"
              disabled
              title="Bald verfügbar"
              aria-label="Android App herunterladen"
              className="flex h-9 min-w-0 flex-1 cursor-not-allowed items-center justify-center rounded-xl text-muted-foreground/55 opacity-90"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
            <EarlyAccessButton
              className="h-9 min-w-0 flex-1 rounded-xl border-0 bg-transparent px-0 text-muted-foreground hover:bg-accent hover:text-primary"
              triggerContent={<Mail className="h-3.5 w-3.5" />}
              ariaLabel="Früher Zugang"
              title="Früher Zugang"
            />
          </div>
        </div>
      </section>

      {/* Search */}
      <section className="shrink-0 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-xl">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-2xl border-0 bg-input pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </section>

      {/* Standorte */}
      <section className="notranslate shrink-0 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-xl" translate="no">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.venuesTitle}</h2>
        <p className="mt-1 text-[10px] leading-snug text-muted-foreground">{t.venuesHint}</p>
        <div className="mt-2 flex rounded-2xl border border-border bg-muted p-1">
          <button
            type="button"
            onClick={() => onVenueFilterChange("all")}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold leading-tight transition-colors ${
              venueFilter === "all" ? "bg-accent text-primary shadow-sm" : "text-muted-foreground"
            }`}
            aria-pressed={venueFilter === "all"}
          >
            <span className="text-sm" aria-hidden>
              🗺️
            </span>
            {t.venuesAll}
          </button>
          <button
            type="button"
            onClick={() => onVenueFilterChange("farm")}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold leading-tight transition-colors ${
              venueFilter === "farm" ? "bg-accent text-primary shadow-sm" : "text-muted-foreground"
            }`}
            aria-pressed={venueFilter === "farm"}
          >
            <span className="text-sm" aria-hidden>
              🚜
            </span>
            {t.venuesFarm}
          </button>
          <button
            type="button"
            onClick={() => onVenueFilterChange("shop")}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-2 text-[10px] font-semibold leading-tight transition-colors ${
              venueFilter === "shop" ? "bg-accent text-primary shadow-sm" : "text-muted-foreground"
            }`}
            aria-pressed={venueFilter === "shop"}
          >
            <span className="text-sm" aria-hidden>
              🧺
            </span>
            {t.venuesShop}
          </button>
        </div>
      </section>

      {/* Categories */}
      <section className="notranslate shrink-0 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-xl" translate="no">
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
                    ? "border-primary bg-accent text-primary"
                    : "border-border bg-muted/80 text-muted-foreground hover:border-primary/25 hover:text-foreground"
                }`}
                aria-pressed={active}
              >
                <CategoryIcon category={cat.key} className="text-lg" />
                <span className="text-[10px] font-medium">{categoryLabels[cat.key]}</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Nur geöffnet */}
      <section className="notranslate shrink-0 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-xl" translate="no">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-muted px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">{t.onlyOpenTitle}</p>
            <p className="mt-0.5 text-[10px] leading-snug text-muted-foreground">{t.onlyOpenHint}</p>
          </div>
          <Switch checked={onlyOpenNow} onCheckedChange={onOnlyOpenNowChange} aria-label={t.onlyOpenAria} />
        </div>
      </section>

      {/* Entfernung */}
      <section className="notranslate shrink-0 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-xl" translate="no">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.distance}</h2>
          <span className="tabular-nums text-xs font-medium text-foreground">{distance} km</span>
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
      <section className="notranslate shrink-0 rounded-2xl border border-border bg-card/95 p-4 shadow-sm backdrop-blur-xl" translate="no">
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
            <span className="shrink-0 whitespace-nowrap rounded-full border border-primary/25 bg-accent px-2 py-0.5 text-[11px] font-semibold tabular-nums text-primary">
              {farms.length} {t.farmsCount}
            </span>
          </div>
          <p className="mt-1.5 text-[11px] leading-snug text-muted-foreground">{t.nearbyHint}</p>
        </div>
        <div className="mt-3 space-y-2">
          {farms.map((farm) => (
            <button
              key={farm.id}
              onClick={() => onSelectFarm(farm.id)}
              className={`group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                selectedFarmId === farm.id
                  ? "border-primary bg-accent"
                  : "border-border bg-muted/60 hover:border-primary/25"
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-brand-mint text-lg leading-none">
                <span aria-hidden>{farm.category === "shop" ? "🧺" : "🚜"}</span>
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">{farm.name}</p>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{farm.distanceKm} km</span>
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${farm.openNow ? "bg-primary" : "bg-muted-foreground/40"}`}
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
      </section>
    </aside>
  )
}
