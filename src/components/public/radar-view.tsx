"use client"

import dynamic from "next/dynamic"
import { useMemo, useState } from "react"
import Image from "next/image"
import { PRODUCT_LABELS, type CategoryKey, type Farm, type VenueFilter } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { DeferredBunnyWidget } from "@/components/public/deferred-bunny-widget"
import { RadarSiteCredits } from "@/components/public/radar-site-credits"
import { BRAND_LOGO_SRC } from "@/lib/brand-assets"
import { haversineDistanceKm } from "@/lib/geo"

const DetailPanel = dynamic(
  () => import("@/components/public/detail-panel").then((m) => m.DetailPanel),
  { ssr: false, loading: () => null },
)

const BrandFooterActions = dynamic(
  () => import("@/components/public/brand-footer-actions").then((m) => m.BrandFooterActions),
  { ssr: false, loading: () => null },
)

interface RadarViewProps {
  farms: Farm[]
}

type Coordinates = {
  lat: number
  lng: number
}

/** Same center as `FarmMap` default — distance filter uses this until GPS is available. */
const DEFAULT_DISTANCE_ORIGIN: Coordinates = { lat: 47.4239, lng: 9.3767 }

const FarmMap = dynamic(() => import("@/components/farm-map").then((mod) => mod.FarmMap), {
  ssr: false,
  loading: () => (
    <div
      className="notranslate flex h-full w-full animate-pulse items-center justify-center bg-muted/40"
      translate="no"
    >
      <div className="text-sm text-muted-foreground">Karte wird geladen…</div>
    </div>
  ),
})

const DesktopSidebar = dynamic(() => import("@/components/public/desktop-sidebar").then((m) => m.DesktopSidebar), {
  ssr: false,
  loading: () => (
    <aside
      className="pointer-events-none fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] max-h-[calc(100vh-2rem)] w-[340px] animate-pulse rounded-2xl border border-border/50 bg-muted/30 lg:block"
      aria-hidden
    />
  ),
})

const MobileBar = dynamic(() => import("@/components/public/mobile-bar").then((m) => m.MobileBar), {
  ssr: false,
  loading: () => (
    <div
      className="pointer-events-none fixed left-3 right-3 top-3 z-30 h-36 animate-pulse rounded-2xl border border-border/40 bg-muted/25 lg:hidden"
      aria-hidden
    />
  ),
})

export function RadarView({ farms }: RadarViewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<CategoryKey[]>([])
  const [distance, setDistance] = useState(10)
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [selectedFarmId, setSelectedFarmId] = useState<string | null>(null)
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null)
  const [onlyOpenNow, setOnlyOpenNow] = useState(false)
  const [venueFilter, setVenueFilter] = useState<VenueFilter>("all")

  // Main radar must never show attractions.
  const radarEntries = useMemo(
    () => farms.filter((farm) => farm.category === "farm" || farm.category === "shop"),
    [farms],
  )

  const farmsWithDistance = useMemo(() => {
    const origin = userLocation ?? DEFAULT_DISTANCE_ORIGIN
    return radarEntries.map((farm) => ({
      ...farm,
      distanceKm: Number(haversineDistanceKm(origin, { lat: farm.lat, lng: farm.lng }).toFixed(1)),
    }))
  }, [radarEntries, userLocation])

  const allPointsWithDistance = useMemo(() => {
    const origin = userLocation ?? DEFAULT_DISTANCE_ORIGIN
    return farms.map((point) => ({
      ...point,
      distanceKm: Number(haversineDistanceKm(origin, { lat: point.lat, lng: point.lng }).toFixed(1)),
    }))
  }, [farms, userLocation])

  const filteredFarms = useMemo(() => {
    return farmsWithDistance.filter((farm) => {
      const matchesSearch =
        searchQuery === "" || farm.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategories =
        selectedCategories.length === 0 ||
        selectedCategories.some((c) => farm.categories.includes(c))
      const matchesDistance = Number.isFinite(farm.distanceKm) && farm.distanceKm <= distance
      const matchesOpen = !onlyOpenNow || farm.openNow
      const matchesVenue =
        venueFilter === "all" ||
        (venueFilter === "farm" && farm.category === "farm") ||
        (venueFilter === "shop" && farm.category === "shop")
      return matchesSearch && matchesCategories && matchesDistance && matchesOpen && matchesVenue
    })
  }, [farmsWithDistance, searchQuery, selectedCategories, distance, onlyOpenNow, venueFilter])

  const effectiveSelectedFarmId =
    selectedFarmId && allPointsWithDistance.some((f) => f.id === selectedFarmId)
      ? selectedFarmId
      : null

  const selectedFarm = useMemo<Farm | null>(
    () => allPointsWithDistance.find((f) => f.id === effectiveSelectedFarmId) ?? null,
    [allPointsWithDistance, effectiveSelectedFarmId],
  )

  const toggleCategory = (key: CategoryKey) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const handleFarmSelect = (farm: Farm) => setSelectedFarmId(farm.id)
  const handleSelectById = (id: string) => setSelectedFarmId(id)
  const handleCloseDetail = () => setSelectedFarmId(null)

  return (
    <div className="relative h-screen w-full overflow-hidden bg-background">
      {/* Map background — stays fixed while side panels scroll */}
      <div className="absolute inset-0">
        <FarmMap
          farms={filteredFarms}
          onFarmSelect={handleFarmSelect}
          selectedFarmId={selectedFarmId}
          distanceKm={distance}
          onUserLocationChange={setUserLocation}
        />
      </div>

      {/* Soft vignette to enhance glassmorphism */}
      <div
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-primary/[0.05] via-transparent to-background/25"
        aria-hidden="true"
      />

      {/* Desktop distance pill (MobileBar is lg:hidden, so this keeps km visible on wide screens too) */}
      <div className="pointer-events-none fixed left-1/2 top-3 z-30 hidden -translate-x-1/2 lg:block">
        <div
          className="hr-pill font-pixel notranslate px-3 py-1.5 text-xs tabular-nums"
          translate="no"
        >
          {distance} km
        </div>
      </div>

      {/* Desktop sidebar */}
      <DesktopSidebar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        venueFilter={venueFilter}
        onVenueFilterChange={setVenueFilter}
        onlyOpenNow={onlyOpenNow}
        onOnlyOpenNowChange={setOnlyOpenNow}
        distance={distance}
        onDistanceChange={setDistance}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        farms={filteredFarms}
        onSelectFarm={handleSelectById}
        selectedFarmId={selectedFarmId}
      />

      {/* Mobile bar */}
      <MobileBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategories={selectedCategories}
        onToggleCategory={toggleCategory}
        venueFilter={venueFilter}
        onVenueFilterChange={setVenueFilter}
        onlyOpenNow={onlyOpenNow}
        onOnlyOpenNowChange={setOnlyOpenNow}
        distance={distance}
        onDistanceChange={setDistance}
      />

      {/* Bunny widget */}
      <DeferredBunnyWidget variant="desktop" />

      {/* Desktop list-mode overlay (only when no detail open) */}
      {viewMode === "list" && !selectedFarm && (
        <div className="hr-scroll-pane pointer-events-auto fixed bottom-6 left-[372px] right-6 top-6 z-30 hidden overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-[0_14px_44px_rgba(13,61,40,0.12)] backdrop-blur-2xl lg:block">
          <h2 className="text-display text-lg font-extrabold tracking-tight text-foreground">
            Höfe in der Nähe
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredFarms.length} Ergebnisse innerhalb {distance} km
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {filteredFarms.map((farm) => (
              <button
                key={farm.id}
                type="button"
                onClick={() => handleSelectById(farm.id)}
                className="rounded-2xl border border-border bg-muted/70 p-4 text-left transition-colors hover:border-primary/30 hover:bg-accent/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{farm.name}</h3>
                  <span className="rounded-full border border-primary/20 bg-accent px-2 py-0.5 text-[10px] font-medium text-primary">
                    {farm.distanceKm} km
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{farm.address}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {farm.products.slice(0, 3).map((product) => PRODUCT_LABELS[product]).join(" · ")}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {farm.categories.map((cat) => (
                    <span
                      key={cat}
                      className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground"
                    >
                      <CategoryIcon category={cat} className="h-3 w-3" />
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Detail panel — desktop drawer + mobile bottom sheet */}
      {selectedFarm ? (
        <DetailPanel
          farm={selectedFarm}
          allPoints={allPointsWithDistance}
          onClose={handleCloseDetail}
          onSelectPoint={handleSelectById}
        />
      ) : null}

      {/* Footer signature */}
      <footer
        className="notranslate pointer-events-auto fixed bottom-2 left-2 z-20 flex items-center gap-1.5 text-left leading-tight text-gray-500 lg:left-1/2 lg:-translate-x-1/2 lg:gap-2"
        translate="no"
      >
        <Image
          src={BRAND_LOGO_SRC}
          alt=""
          aria-hidden
          width={24}
          height={24}
          loading="lazy"
          fetchPriority="low"
          className="h-4 w-4 shrink-0 rounded-full object-contain lg:h-5 lg:w-5"
        />
        <RadarSiteCredits />
        <BrandFooterActions className="shrink-0" />
      </footer>
    </div>
  )
}
