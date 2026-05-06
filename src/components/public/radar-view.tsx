"use client"

import { useMemo, useState } from "react"
import { FarmMap } from "@/components/farm-map"
import { DesktopSidebar } from "@/components/public/desktop-sidebar"
import { MobileBar } from "@/components/public/mobile-bar"
import { BunnyWidget } from "@/components/public/bunny-widget"
import { DetailPanel } from "@/components/public/detail-panel"
import { PRODUCT_LABELS, type CategoryKey, type Farm, type VenueFilter } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"
import { haversineDistanceKm } from "@/lib/geo"

interface RadarViewProps {
  farms: Farm[]
}

type Coordinates = {
  lat: number
  lng: number
}

/** Same center as `FarmMap` default — distance filter uses this until GPS is available. */
const DEFAULT_DISTANCE_ORIGIN: Coordinates = { lat: 47.4239, lng: 9.3767 }

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
        className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-br from-background/30 via-transparent to-background/20"
        aria-hidden="true"
      />

      {/* Desktop distance pill (MobileBar is md:hidden, so this keeps km visible on wide screens too) */}
      <div className="pointer-events-none fixed left-1/2 top-3 z-30 hidden -translate-x-1/2 md:block">
        <div
          className="notranslate rounded-full bg-card/90 px-3 py-1 text-xs font-semibold tabular-nums text-foreground shadow-lg backdrop-blur border border-border/70"
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
      <BunnyWidget variant="desktop" />

      {/* Desktop list-mode overlay (only when no detail open) */}
      {viewMode === "list" && !selectedFarm && (
        <div className="pointer-events-auto fixed bottom-6 left-[372px] right-6 top-6 z-30 hidden overflow-y-auto rounded-3xl border border-border/60 bg-card/85 p-6 shadow-2xl backdrop-blur-2xl md:block">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
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
                className="rounded-2xl border border-border/50 bg-background/40 p-4 text-left transition-colors hover:border-border"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{farm.name}</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
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
                      className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
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
      <DetailPanel
        farm={selectedFarm}
        allPoints={allPointsWithDistance}
        onClose={handleCloseDetail}
        onSelectPoint={handleSelectById}
      />

      {/* Footer signature */}
      <footer
        className="notranslate pointer-events-none fixed bottom-2 left-2 z-20 text-left text-[10px] leading-tight text-gray-500 md:left-1/2 md:-translate-x-1/2 md:text-center md:text-xs"
        translate="no"
      >
        <p>Entwickelt von AXON CREATIVE CH</p>
        <p>Made in Switzerland 🇨🇭</p>
      </footer>
    </div>
  )
}
