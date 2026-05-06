"use client"

import { useEffect, useState } from "react"
import { X, MapPin } from "lucide-react"
import { CATEGORIES, type CategoryKey, type Farm } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"

interface FarmModalProps {
  open: boolean
  onClose: () => void
  onSave: (farm: Omit<Farm, "id" | "image" | "distanceKm" | "rating" | "openNow"> & { id?: string }) => void
  initial?: Farm | null
}

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

export function FarmModal({ open, onClose, onSave, initial }: FarmModalProps) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState("52.52")
  const [lng, setLng] = useState("13.405")
  const [hours, setHours] = useState("Mo–Fr 8–18")
  const [stock, setStock] = useState<CategoryKey[]>([])
  const [status, setStatus] = useState<"active" | "inactive">("active")

  useEffect(() => {
    if (initial) {
      setName(initial.name)
      setAddress(initial.address)
      setLat(String(initial.lat))
      setLng(String(initial.lng))
      setHours(initial.hours)
      setStock(initial.categories)
      setStatus(initial.status)
    } else {
      setName("")
      setAddress("")
      setLat("52.52")
      setLng("13.405")
      setHours("Mo–Fr 8–18")
      setStock([])
      setStatus("active")
    }
  }, [initial, open])

  if (!open) return null

  const toggleStock = (key: CategoryKey) => {
    setStock((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      id: initial?.id,
      name,
      address,
      lat: Number(lat),
      lng: Number(lng),
      hours,
      categories: stock,
      status,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border/60 bg-card/95 px-6 py-4 backdrop-blur-xl">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              {initial ? "Hofladen bearbeiten" : "Neuen Hofladen hinzufügen"}
            </h2>
            <p className="text-xs text-muted-foreground">Pflege Stammdaten und Sortiment</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. Hof Müller"
              required
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Address */}
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Adresse
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Straße Hausnr., PLZ Ort"
              required
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-2 grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Latitude</label>
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Longitude</label>
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            {/* Simulated map coord selector */}
            <div className="mt-2 flex h-32 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40">
              <div className="flex flex-col items-center gap-1 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span className="text-[10px]">Karten-Koordinaten Auswahl (Simulation)</span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Öffnungszeiten
            </label>
            <input
              type="text"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Mo–Fr 8–18, Sa 8–14"
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {DAYS.map((day) => (
                <div
                  key={day}
                  className="rounded-xl border border-border bg-background py-1.5 text-center text-[10px] font-medium text-muted-foreground"
                >
                  {day}
                </div>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-border bg-background/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">Status</p>
              <p className="text-xs text-muted-foreground">
                {status === "active" ? "Aktiv und sichtbar im Radar" : "Inaktiv, nur intern"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStatus((s) => (s === "active" ? "inactive" : "active"))}
              className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                status === "active" ? "bg-primary" : "bg-muted"
              }`}
              aria-pressed={status === "active"}
            >
              <span
                className={`h-5 w-5 rounded-full bg-card shadow transition-transform ${
                  status === "active" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Stock grid */}
          <div className="mt-5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Sortiment auf Lager
            </label>
            <div className="mt-3 grid grid-cols-5 gap-2">
              {CATEGORIES.map((cat) => {
                const active = stock.includes(cat.key)
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => toggleStock(cat.key)}
                    className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-all ${
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-foreground/20 hover:text-foreground"
                    }`}
                    aria-pressed={active}
                  >
                    <CategoryIcon category={cat.key} className="h-6 w-6" />
                    <span className="text-[10px] font-medium">{cat.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
