"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import type { Map as LeafletMap } from "leaflet"
import type { Farm } from "@/lib/data"

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [icons, setIcons] = useState<{ default: any; active: any; user: any } | null>(null)
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
      const makeIcon = (active: boolean) =>
        L.divIcon({
          className: "",
          html: `
            <div style="position:relative;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">
              <div style="
                width:30px;height:30px;border-radius:9999px;
                background:${active ? "oklch(0.45 0.18 145)" : "oklch(0.55 0.18 145)"};
                border:3px solid white;
                box-shadow:0 4px 12px rgba(0,0,0,0.18);
                display:flex;align-items:center;justify-content:center;
              ">
                <div style="width:8px;height:8px;border-radius:9999px;background:white;"></div>
              </div>
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
          popupAnchor: [0, -20],
        })

      const user = L.divIcon({
        className: "",
        html: `
          <div style="position:relative;width:34px;height:34px;display:flex;align-items:center;justify-content:center;">
            <div style="position:absolute;inset:-6px;border-radius:9999px;background:rgba(59,130,246,0.2);"></div>
            <div style="
              width:18px;height:18px;border-radius:9999px;
              background:#3b82f6;
              border:3px solid white;
              box-shadow:0 4px 12px rgba(0,0,0,0.18);
            "></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      })

      setIcons({ default: makeIcon(false), active: makeIcon(true), user })
    })
  }, [])

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

  if (!icons || !hasMounted || !containerReady) {
    return (
      <div className="notranslate flex h-full w-full animate-pulse items-center justify-center bg-muted/40" translate="no">
        <div className="text-sm text-muted-foreground">Karte wird geladen…</div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full" ref={mapHostRef}>
      <MapContainer
        center={mapCenter}
        zoom={INITIAL_ZOOM}
        className="h-full w-full"
        zoomControl={false}
        zoomSnap={0.25}
        zoomDelta={0.25}
        whenReady={(event) => {
          if (mapRef.current && mapRef.current !== event.target) {
            safelyDisposeMap(mapRef.current)
          }
          mapRef.current = event.target
          setIsMapReady(true)
        }}
        eventHandlers={{
          moveend: (event) => {
            if (isProgrammaticMove()) return
            const center = event.target.getCenter()
            setMapCenter([center.lat, center.lng])
          },
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {farms.map((farm) => (
          <Marker
            key={farm.id}
            position={[farm.lat, farm.lng]}
            icon={selectedFarmId === farm.id ? icons.active : icons.default}
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
        ))}
        {userLocation && <Marker position={[userLocation.lat, userLocation.lng]} icon={icons.user} />}
        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={distanceKm * 1000}
            pathOptions={{
              color: "#3b82f6",
              weight: 1.5,
              opacity: 0.45,
              fillColor: "#3b82f6",
              fillOpacity: 0.06,
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}
