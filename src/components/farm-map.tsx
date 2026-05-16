"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import type { Map as LeafletMap } from "leaflet"
import { useMapEvents } from "react-leaflet"
import type { Farm, VenueKind } from "@/lib/data"

import "leaflet/dist/leaflet.css"

const MapContainer = dynamic(() => import("react-leaflet").then((mod) => mod.MapContainer), {
  ssr: false,
})
const TileLayer = dynamic(() => import("react-leaflet").then((mod) => mod.TileLayer), {
  ssr: false,
})
const Marker = dynamic(() => import("react-leaflet").then((mod) => mod.Marker), {
  ssr: false,
})
const Popup = dynamic(() => import("react-leaflet").then((mod) => mod.Popup), {
  ssr: false,
})
const Circle = dynamic(() => import("react-leaflet").then((mod) => mod.Circle), {
  ssr: false,
})

function MapMoveEndListener({
  isProgrammaticMove,
  onMoveEnd,
}: {
  isProgrammaticMove: () => boolean
  onMoveEnd: (lat: number, lng: number) => void
}) {
  useMapEvents({
    moveend: (e) => {
      if (isProgrammaticMove()) return
      const c = e.target.getCenter()
      onMoveEnd(c.lat, c.lng)
    },
  })
  return null
}

interface FarmMapProps {
  farms: Farm[]
  onFarmSelect: (farm: Farm) => void
  selectedFarmId?: string | null
  distanceKm?: number
  onUserLocationChange?: (location: { lat: number; lng: number } | null) => void
}

const DEFAULT_CENTER: [number, number] = [47.4239, 9.3767]
const INITIAL_ZOOM = 12
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 0,
}

type UserLocation = {
  lat: number
  lng: number
  accuracy: number
}

function safelyDisposeMap(map: LeafletMap | null) {
  if (!map) return

  try {
    // Explicitly free container marker before remove to avoid reuse errors in dev/hot-reload.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const container = map.getContainer?.() as any
    if (container && "_leaflet_id" in container) {
      try {
        delete container._leaflet_id
      } catch {
        // ignore readonly edge-cases
      }
    }
    map.off()
    map.remove()
  } catch {
    // Ignore hot-reload disposal races from Leaflet internals.
  }
}

function venueMarkerEmoji(kind: VenueKind): string {
  if (kind === "shop") return "🧺"
  return "🚜"
}

function makeFarmMarkerIcon(L: typeof import("leaflet"), emoji: string, active: boolean) {
  const bg = active ? "rgba(248,250,252,0.98)" : "rgba(255,255,255,0.96)"
  const border = active ? "rgba(71,85,105,0.55)" : "rgba(148,163,184,0.65)"
  const shadow = active ? "0 4px 14px rgba(15,23,42,0.2)" : "0 3px 10px rgba(15,23,42,0.14)"
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
        <div style="
          width:34px;height:34px;border-radius:9999px;
          background:${bg};
          border:2px solid ${border};
          box-shadow:${shadow};
          display:flex;align-items:center;justify-content:center;
          font-size:17px;line-height:1;
        ">${emoji}</div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
    popupAnchor: [0, -22],
  })
}

function makeUserMarkerIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    className: "",
    html: `
      <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
        <div style="font-size:26px;line-height:1;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.22));">📍</div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 32],
    popupAnchor: [0, -28],
  })
}

function distanceMeters(a: UserLocation, b: UserLocation): number {
  const toRad = (value: number) => (value * Math.PI) / 180
  const earthRadius = 6371000
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) * Math.sin(dLng / 2)

  return 2 * earthRadius * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export function FarmMap({
  farms,
  onFarmSelect,
  selectedFarmId,
  distanceKm = 10,
  onUserLocationChange,
}: FarmMapProps) {
  const [hasMounted, setHasMounted] = useState(false)
  const [containerReady, setContainerReady] = useState(false)
  const isGeolocationSupported = hasMounted && "geolocation" in navigator
  const [leafletModule, setLeafletModule] = useState<typeof import("leaflet") | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>(() => DEFAULT_CENTER)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [isLocating, setIsLocating] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const hasAppliedInitialGeoViewRef = useRef(false)
  const mapRef = useRef<LeafletMap | null>(null)
  const mapHostRef = useRef<HTMLDivElement | null>(null)
  const programmaticMoveRef = useRef(false)
  const programmaticMoveUntilRef = useRef(0)
  const leafletRef = useRef<typeof import("leaflet") | null>(null)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  useEffect(() => {
    if (!hasMounted) return
    const host = mapHostRef.current
    if (host) {
      host.querySelectorAll(".leaflet-container").forEach((node) => {
        // In dev/hot-reload Leaflet can leave stale container markers behind.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyNode = node as any
        if ("_leaflet_id" in anyNode) {
          try {
            delete anyNode._leaflet_id
          } catch {
            // ignore readonly edge-cases
          }
        }
        node.remove()
      })
    }
    setContainerReady(true)
  }, [hasMounted])

  useEffect(() => {
    import("leaflet").then((L) => {
      leafletRef.current = L
      setLeafletModule(L)
    })
  }, [])

  const farmIconsById = useMemo(() => {
    if (!leafletModule) return null
    const L = leafletModule
    const m = new Map<string, { def: ReturnType<typeof makeFarmMarkerIcon>; act: ReturnType<typeof makeFarmMarkerIcon> }>()
    for (const farm of farms) {
      const emoji = venueMarkerEmoji(farm.category)
      m.set(farm.id, {
        def: makeFarmMarkerIcon(L, emoji, false),
        act: makeFarmMarkerIcon(L, emoji, true),
      })
    }
    return m
  }, [farms, leafletModule])

  const userMarkerIcon = useMemo(() => {
    if (!leafletModule) return null
    return makeUserMarkerIcon(leafletModule)
  }, [leafletModule])

  const fitToSearchRadius = useCallback(
    (location: UserLocation, km: number) => {
      const map = mapRef.current
      if (!map) return

      const radiusMeters = Math.max(1, km) * 1000

      // Tighter padding for small radii (more "zoomed in"), looser for large radii.
      const clampedKm = Math.max(1, Math.min(20, km))
      const padding = Math.round(10 + (22 - clampedKm))

      const applyFit = (L: typeof import("leaflet")) => {
        // Leaflet's LatLng#toBounds expects a "size in meters" where each boundary is size/2 meters away.
        // We want a circle radius of `radiusMeters`, so pass diameter.
        const bounds = L.latLng(location.lat, location.lng).toBounds(radiusMeters * 2)

        const paddingPoint = L.point(padding, padding)
        const targetZoom = map.getBoundsZoom(bounds, false, paddingPoint)
        const center = bounds.getCenter()

        programmaticMoveRef.current = true
        programmaticMoveUntilRef.current = Date.now() + 900
        map.setView(center, targetZoom, { animate: true })
        window.setTimeout(() => {
          programmaticMoveRef.current = false
        }, 900)
      }

      const cached = leafletRef.current
      if (cached) {
        applyFit(cached)
        return
      }

      void import("leaflet").then((L) => {
        leafletRef.current = L
        applyFit(L)
      })
    },
    [],
  )

  useEffect(() => {
    onUserLocationChange?.(
      userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null,
    )
  }, [onUserLocationChange, userLocation])

  useEffect(() => {
    if (!isGeolocationSupported) return

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }

        setUserLocation((prev) => {
          if (!prev) return nextLocation

          const movedMeters = distanceMeters(prev, nextLocation)
          const jitterThresholdMeters = Math.max(12, Math.min(35, nextLocation.accuracy * 0.6))

          // Ignore tiny jumps inside normal GPS error radius.
          if (movedMeters < jitterThresholdMeters) return prev

          // Smooth large jumps to reduce visible marker wobble.
          const smoothed: UserLocation = {
            lat: prev.lat + (nextLocation.lat - prev.lat) * 0.45,
            lng: prev.lng + (nextLocation.lng - prev.lng) * 0.45,
            accuracy: nextLocation.accuracy,
          }
          return smoothed
        })
      },
      () => {
        // Keep map stable on geolocation errors.
      },
      GEOLOCATION_OPTIONS,
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [hasMounted, isGeolocationSupported])

  useEffect(() => {
    if (!isMapReady) return
    const anchor: UserLocation | null = userLocation
      ? userLocation
      : { lat: mapCenter[0], lng: mapCenter[1], accuracy: Infinity }
    if (!anchor) return

    // Distance slider should always re-scale the map to the selected real-world radius.
    // Also applies the first time we have both a map instance and a GPS fix.
    if (userLocation && !hasAppliedInitialGeoViewRef.current) {
      hasAppliedInitialGeoViewRef.current = true
      setMapCenter([userLocation.lat, userLocation.lng])
      mapRef.current?.setView([userLocation.lat, userLocation.lng], mapRef.current.getZoom(), { animate: true })
    }

    fitToSearchRadius(anchor, distanceKm)
  }, [distanceKm, fitToSearchRadius, isMapReady, mapCenter, userLocation])

  const handleFindMe = () => {
    if (!isGeolocationSupported) return
    if (!isMapReady || !mapRef.current) return

    const centerOnLocation = (location: UserLocation) => {
      const nextCenter: [number, number] = [location.lat, location.lng]
      setMapCenter(nextCenter)
      mapRef.current?.setView(nextCenter, mapRef.current.getZoom(), { animate: true })
      fitToSearchRadius(location, distanceKm)
    }

    if (userLocation) {
      centerOnLocation(userLocation)
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLocation: UserLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        }
        setUserLocation(nextLocation)
        centerOnLocation(nextLocation)
        setIsLocating(false)
      },
      () => {
        setIsLocating(false)
      },
      GEOLOCATION_OPTIONS,
    )
  }

  useEffect(() => {
    return () => {
      safelyDisposeMap(mapRef.current)
      mapRef.current = null
      setIsMapReady(false)
    }
  }, [])

  const isProgrammaticMove = useCallback(() => {
    return programmaticMoveRef.current || Date.now() < programmaticMoveUntilRef.current
  }, [])

  if (!leafletModule || !farmIconsById || !userMarkerIcon || !hasMounted || !containerReady) {
    return (
      <div className="notranslate flex h-full w-full animate-pulse items-center justify-center bg-muted/40" translate="no">
        <div className="text-sm text-muted-foreground">Karte wird geladen…</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full" ref={mapHostRef}>
      <MapContainer
        ref={mapRef}
        center={mapCenter}
        zoom={INITIAL_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
        zoomSnap={0.25}
        zoomDelta={0.25}
        preferCanvas
        whenReady={() => {
          setIsMapReady(true)
        }}
      >
        <MapMoveEndListener
          isProgrammaticMove={isProgrammaticMove}
          onMoveEnd={(lat, lng) => setMapCenter([lat, lng])}
        />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          keepBuffer={6}
          updateWhenIdle={false}
          updateWhenZooming={false}
          updateInterval={120}
          crossOrigin
        />
        {farms.map((farm) => {
          const pair = farmIconsById.get(farm.id)
          if (!pair) return null
          return (
            <Marker
              key={farm.id}
              position={[farm.lat, farm.lng]}
              icon={selectedFarmId === farm.id ? pair.act : pair.def}
              eventHandlers={{
                click: () => onFarmSelect(farm),
              }}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="text-sm font-semibold text-foreground">{farm.name}</h3>
                  <p className="text-xs text-muted-foreground">{farm.distanceKm} km · ★ {farm.rating}</p>
                </div>
              </Popup>
            </Marker>
          )
        })}
        {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={userMarkerIcon} />}
        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={distanceKm * 1000}
            pathOptions={{
              color: "rgba(71,85,105,0.55)",
              weight: 1.5,
              opacity: 0.55,
              fillColor: "#cbd5e1",
              fillOpacity: 0.18,
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
