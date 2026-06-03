"use client"

import Link from "next/link"
import { useState } from "react"
import { MapPin, Send } from "lucide-react"
import { CategoryIcon } from "@/components/category-icon"
import { PRODUCT_LABELS, type CategoryKey } from "@/lib/data"
import { surfaceCapsulePad } from "@/lib/typography"
import { cn } from "@/lib/utils"

const VENUE_OPTIONS = [
  { value: "farm" as const, emoji: "🚜", title: "Bauernhof", desc: "Hof mit Direktverkauf" },
  { value: "shop" as const, emoji: "🏪", title: "Hofladen / Laden", desc: "Verkauf vor Ort" },
  { value: "attraction" as const, emoji: "🏞️", title: "Attraktion", desc: "Sehenswertes in der Region" },
]

const ALL_PRODUCTS = Object.keys(PRODUCT_LABELS) as CategoryKey[]

export function PublicFarmSubmitForm() {
  const [category, setCategory] = useState<"farm" | "shop" | "attraction">("farm")
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [lat, setLat] = useState("47.4239")
  const [lng, setLng] = useState("9.3767")
  const [hours, setHours] = useState("")
  const [description, setDescription] = useState("")
  const [products, setProducts] = useState<CategoryKey[]>([])
  const [hasShop, setHasShop] = useState(true)
  const [hasParking, setHasParking] = useState(false)
  const [hasRestaurant, setHasRestaurant] = useState(false)
  const [hasPlayground, setHasPlayground] = useState(false)
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [website, setWebsite] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [submitterName, setSubmitterName] = useState("")
  const [submitterEmail, setSubmitterEmail] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const toggleProduct = (key: CategoryKey) => {
    setProducts((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch("/api/farms/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          name,
          address,
          latitude: lat,
          longitude: lng,
          products,
          has_shop: hasShop,
          has_parking: hasParking,
          has_restaurant: hasRestaurant,
          has_playground: hasPlayground,
          ai_message_de: description,
          website_url: website,
          image_url: imageUrl,
          contact_info: { phone, email },
          opening_hours: hours.trim() ? hours.trim() : null,
          submitter_name: submitterName,
          submitter_email: submitterEmail,
        }),
      })

      const raw = await response.text()
      let result: { ok?: boolean; error?: string } = {}
      try {
        result = raw ? (JSON.parse(raw) as { ok?: boolean; error?: string }) : {}
      } catch {
        setError(
          response.status === 404
            ? "API nicht gefunden — bitte neueste Version deployen."
            : `Serverfehler (${response.status}). Bitte später erneut versuchen.`,
        )
        return
      }

      if (!response.ok || !result.ok) {
        setError(result.error ?? `Speichern fehlgeschlagen (${response.status}).`)
        return
      }
      setDone(true)
    } catch (cause) {
      console.error("farm submit client:", cause)
      setError("Verbindungsfehler. Bitte Internet prüfen und erneut versuchen.")
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <section className={cn(surfaceCapsulePad, "text-center")}>
        <p className="text-4xl" aria-hidden>
          ✅
        </p>
        <h2 className="mt-3 text-xl font-extrabold text-foreground">Danke für deinen Eintrag!</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Wir prüfen die Angaben und schalten den Betrieb nach Freigabe auf der Karte frei. Das dauert in der Regel
          kurz.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <MapPin className="h-4 w-4" aria-hidden />
          Zur Karte
        </Link>
      </section>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      <section className={surfaceCapsulePad}>
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Art des Ortes</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          {VENUE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setCategory(opt.value)}
              className={cn(
                "rounded-2xl border px-3 py-3 text-left transition-colors",
                category === opt.value
                  ? "border-primary/40 bg-brand-mint/50 ring-2 ring-primary/15"
                  : "border-border bg-muted/30 hover:bg-muted/50",
              )}
            >
              <span className="text-xl" aria-hidden>
                {opt.emoji}
              </span>
              <p className="mt-1 text-sm font-semibold text-foreground">{opt.title}</p>
              <p className="text-xs text-muted-foreground">{opt.desc}</p>
            </button>
          ))}
        </div>
      </section>

      <section className={surfaceCapsulePad}>
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Betrieb</p>
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Name *</span>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Adresse (Schweiz) *</span>
            <input
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Breite (lat) *</span>
              <input
                required
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-muted-foreground">Länge (lng) *</span>
              <input
                required
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-mono"
              />
            </label>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Tipp: In Google Maps Rechtsklick auf den Ort → Koordinaten kopieren.
          </p>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Öffnungszeiten</span>
            <input
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="z. B. Mo–Sa 8–18"
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Kurzbeschreibung</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className={surfaceCapsulePad}>
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Sortiment</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ALL_PRODUCTS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => toggleProduct(key)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm",
                products.includes(key)
                  ? "border-primary/30 bg-brand-mint/45 text-foreground"
                  : "border-border bg-muted/30 text-muted-foreground",
              )}
            >
              <CategoryIcon category={key} />
              {PRODUCT_LABELS[key]}
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasShop} onChange={(e) => setHasShop(e.target.checked)} />
            Shop
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasParking} onChange={(e) => setHasParking(e.target.checked)} />
            Parkplatz
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasRestaurant} onChange={(e) => setHasRestaurant(e.target.checked)} />
            Restaurant
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={hasPlayground} onChange={(e) => setHasPlayground(e.target.checked)} />
            Spielplatz
          </label>
        </div>
      </section>

      <section className={surfaceCapsulePad}>
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Kontakt des Betriebs</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Telefon</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">E-Mail Betrieb</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Webseite</span>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-medium text-muted-foreground">Bild-URL (optional)</span>
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className={surfaceCapsulePad}>
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-ink-3">Deine Angaben</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Dein Name *</span>
            <input
              required
              value={submitterName}
              onChange={(e) => setSubmitterName(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-muted-foreground">Deine E-Mail *</span>
            <input
              required
              type="email"
              value={submitterEmail}
              onChange={(e) => setSubmitterEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
      >
        <Send className="h-4 w-4" aria-hidden />
        {busy ? "Wird gesendet…" : "Zur Prüfung einreichen"}
      </button>
    </form>
  )
}
