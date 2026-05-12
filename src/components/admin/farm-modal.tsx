"use client"

import { useEffect, useState } from "react"
import { X, MapPin } from "lucide-react"
import { CATEGORIES, PRODUCT_LABELS, type CategoryKey, type Farm } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"

type FarmFormData = {
  id?: string
  name: string
  address: string
  lat: number
  lng: number
  hours: string
  categories: Farm["categories"]
  status: Farm["status"]
  category: "farm" | "shop" | "attraction"
  products: CategoryKey[]
  has_shop: boolean
  has_parking: boolean
  has_restaurant: boolean
  has_accommodation: boolean
  has_playground: boolean
  has_quiz: boolean
  has_delivery: boolean
  is_open: boolean
  rating: number
  image_url: string
  website_url: string
  ai_message_de: string
  ai_message_en: string
  ai_message_fr: string
  ai_message_it: string
  ai_message_sr: string
  ai_message_ua: string
  contact_info: string
  opening_hours: string
}

interface FarmModalProps {
  open: boolean
  onClose: () => void
  onSave: (farm: FarmFormData) => Promise<void> | void
  initial?: Farm | null
}

const DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const
type DayKey = (typeof DAY_KEYS)[number]
const ALL_PRODUCT_KEYS = Object.keys(PRODUCT_LABELS) as CategoryKey[]

function safeParseObject(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value)
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function toNumberSafe(value: string): number {
  const normalized = value.trim().replace(",", ".")
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : NaN
}

export function FarmModal({ open, onClose, onSave, initial }: FarmModalProps) {
  const [name, setName] = useState(initial?.name ?? "")
  const [address, setAddress] = useState(initial?.address ?? "")
  const [lat, setLat] = useState(String(initial?.lat ?? "52.52"))
  const [lng, setLng] = useState(String(initial?.lng ?? "13.405"))
  const [hours, setHours] = useState(initial?.hours ?? "Mo–Fr 8–18")
  const [stock, setStock] = useState<CategoryKey[]>(initial?.products ?? initial?.categories ?? [])
  const [status, setStatus] = useState<"active" | "inactive">(initial?.status ?? "active")
  const [category, setCategory] = useState<"farm" | "shop" | "attraction">(initial?.category ?? "farm")
  const [products, setProducts] = useState<CategoryKey[]>(initial?.products ?? initial?.categories ?? [])
  const [hasShop, setHasShop] = useState(initial?.has_shop ?? initial?.features.shop ?? true)
  const [hasParking, setHasParking] = useState(initial?.has_parking ?? initial?.features.parking ?? false)
  const [hasRestaurant, setHasRestaurant] = useState(
    initial?.has_restaurant ?? initial?.features.restaurant ?? false,
  )
  const [hasPlayground, setHasPlayground] = useState(
    initial?.has_playground ?? initial?.features.playground ?? false,
  )
  const [hasAccommodation, setHasAccommodation] = useState(initial?.has_accommodation ?? false)
  const [hasQuiz, setHasQuiz] = useState(initial?.has_quiz ?? false)
  const [hasDelivery, setHasDelivery] = useState(initial?.has_delivery ?? false)
  const [isOpen, setIsOpen] = useState(initial?.is_open ?? initial?.openNow ?? false)
  const [rating, setRating] = useState(String(initial?.rating ?? 0))
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? initial?.image ?? "")
  const [websiteUrl, setWebsiteUrl] = useState(initial?.website_url ?? "")
  const [aiDe, setAiDe] = useState(initial?.ai_message_de ?? initial?.description ?? "")
  const [aiEn, setAiEn] = useState(initial?.ai_message_en ?? "")
  const [aiFr, setAiFr] = useState(initial?.ai_message_fr ?? "")
  const [aiIt, setAiIt] = useState(initial?.ai_message_it ?? "")
  const [aiSr, setAiSr] = useState(initial?.ai_message_sr ?? "")
  const [aiUa, setAiUa] = useState(initial?.ai_message_ua ?? "")
  const [contactInfo, setContactInfo] = useState(
    initial?.contact_info ? JSON.stringify(initial.contact_info) : "{}",
  )
  const [openingHours, setOpeningHours] = useState(
    typeof initial?.opening_hours === "string"
      ? initial.opening_hours
      : initial?.opening_hours
        ? JSON.stringify(initial.opening_hours)
        : "{}",
  )
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [instagram, setInstagram] = useState("")
  const [facebook, setFacebook] = useState("")
  const [telegram, setTelegram] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [dayOpen, setDayOpen] = useState<Record<DayKey, string>>({
    mon: "",
    tue: "",
    wed: "",
    thu: "",
    fri: "",
    sat: "",
    sun: "",
  })
  const [dayClose, setDayClose] = useState<Record<DayKey, string>>({
    mon: "",
    tue: "",
    wed: "",
    thu: "",
    fri: "",
    sat: "",
    sun: "",
  })
  const [dayClosed, setDayClosed] = useState<Record<DayKey, boolean>>({
    mon: false,
    tue: false,
    wed: false,
    thu: false,
    fri: false,
    sat: false,
    sun: false,
  })
  const [helpersInitialized, setHelpersInitialized] = useState(false)
  const [allDaysOpen, setAllDaysOpen] = useState("")
  const [allDaysClose, setAllDaysClose] = useState("")

  useEffect(() => {
    const contact = safeParseObject(contactInfo)
    setPhone(typeof contact.phone === "string" ? contact.phone : "")
    setEmail(typeof contact.email === "string" ? contact.email : "")
    setInstagram(typeof contact.instagram === "string" ? contact.instagram : "")
    setFacebook(typeof contact.facebook === "string" ? contact.facebook : "")
    setTelegram(typeof contact.telegram === "string" ? contact.telegram : "")
    setWhatsapp(typeof contact.whatsapp === "string" ? contact.whatsapp : "")

    const opening = safeParseObject(openingHours)
    const nextOpen = { ...dayOpen }
    const nextClose = { ...dayClose }
    const nextClosed = { ...dayClosed }
    DAY_KEYS.forEach((key) => {
      const entry = opening[key]
      if (!entry || typeof entry !== "object") return
      const raw = entry as Record<string, unknown>
      nextOpen[key] = typeof raw.open === "string" ? raw.open : ""
      nextClose[key] = typeof raw.close === "string" ? raw.close : ""
      nextClosed[key] = Boolean(raw.closed)
    })
    setDayOpen(nextOpen)
    setDayClose(nextClose)
    setDayClosed(nextClosed)
    setHelpersInitialized(true)
    // initialize helper inputs from raw JSON only once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!helpersInitialized) return
    const nextContact = {
      phone,
      email,
      instagram,
      facebook,
      telegram,
      whatsapp,
    }
    setContactInfo(JSON.stringify(nextContact))
  }, [email, facebook, helpersInitialized, instagram, phone, telegram, whatsapp])

  useEffect(() => {
    if (!helpersInitialized) return
    const nextOpening = DAY_KEYS.reduce<Record<string, { open: string; close: string; closed: boolean }>>(
      (acc, key) => {
        acc[key] = { open: dayOpen[key], close: dayClose[key], closed: dayClosed[key] }
        return acc
      },
      {},
    )
    setOpeningHours(JSON.stringify(nextOpening))
  }, [dayClose, dayClosed, dayOpen, helpersInitialized])

  if (!open) return null

  const toggleStock = (key: CategoryKey) => {
    setStock((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      setProducts(next)
      return next
    })
  }
  const toggleProducts = (key: CategoryKey) => {
    setProducts((prev) => {
      const next = prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      setStock(next)
      return next
    })
  }
  const applyHoursToAllDays = () => {
    setDayOpen(
      DAY_KEYS.reduce(
        (acc, key) => {
          acc[key] = allDaysOpen
          return acc
        },
        {} as Record<DayKey, string>,
      ),
    )
    setDayClose(
      DAY_KEYS.reduce(
        (acc, key) => {
          acc[key] = allDaysClose
          return acc
        },
        {} as Record<DayKey, string>,
      ),
    )
    setDayClosed(
      DAY_KEYS.reduce(
        (acc, key) => {
          acc[key] = false
          return acc
        },
        {} as Record<DayKey, boolean>,
      ),
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedLat = toNumberSafe(lat)
    const parsedLng = toNumberSafe(lng)
    const parsedRating = toNumberSafe(rating)

    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
      window.alert("Bitte gültige Koordinaten eingeben (z. B. 47.4239).")
      return
    }

    await onSave({
      id: initial?.id,
      name,
      address,
      lat: parsedLat,
      lng: parsedLng,
      hours,
      categories: products,
      status,
      category,
      products,
      has_shop: hasShop,
      has_parking: hasParking,
      has_restaurant: hasRestaurant,
      has_accommodation: hasAccommodation,
      has_playground: hasPlayground,
      has_quiz: hasQuiz,
      has_delivery: hasDelivery,
      is_open: isOpen,
      rating: Number.isFinite(parsedRating) ? parsedRating : 0,
      image_url: imageUrl,
      website_url: websiteUrl,
      ai_message_de: aiDe,
      ai_message_en: aiEn,
      ai_message_fr: aiFr,
      ai_message_it: aiIt,
      ai_message_sr: aiSr,
      ai_message_ua: aiUa,
      contact_info: contactInfo,
      opening_hours: openingHours,
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

          {/* Website (simple input) */}
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Website
            </label>
            <input
              type="text"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://..."
              className="h-11 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Type toggle (farm / shop / attraction) */}
          <div className="mt-4 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Typ
            </label>
            <div className="flex rounded-2xl border border-border bg-background/40 p-1">
              {(
                [
                  { key: "farm" as const, label: "Farm" },
                  { key: "shop" as const, label: "Shop" },
                  { key: "attraction" as const, label: "Attraction" },
                ] as const
              ).map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCategory(item.key)}
                  className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
                    category === item.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  }`}
                  aria-pressed={category === item.key}
                >
                  {item.label}
                </button>
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

          {/* Backend fields */}
          <div className="mt-5 rounded-2xl border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Backend Felder (farms)</p>

            <div className="mt-3 rounded-2xl border border-border/70 bg-background p-3">
              <p className="text-xs font-semibold text-foreground">Einfache Kontakteingabe</p>
              <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Telefon</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">E-Mail</label>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Instagram</label>
                  <input value={instagram} onChange={(e) => setInstagram(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Facebook</label>
                  <input value={facebook} onChange={(e) => setFacebook(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Telegram</label>
                  <input value={telegram} onChange={(e) => setTelegram(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">WhatsApp</label>
                  <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground" />
                </div>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-border/70 bg-background p-3">
              <p className="text-xs font-semibold text-foreground">Einfache Öffnungszeiten</p>
              <p className="mt-1 text-[10px] text-muted-foreground">
                Pro Tag nur Start und Ende eintragen. Wenn alle Tage gleich sind, einmal unten
                eintragen und auf alle Tage anwenden.
              </p>
              <div className="mt-2 flex items-center justify-between rounded-xl border border-border bg-background/60 px-3 py-2">
                <div>
                  <p className="text-[11px] font-medium text-foreground">Aktueller Öffnungsstatus</p>
                  <p className="text-[10px] text-muted-foreground">
                    {isOpen ? "Der Hof ist jetzt offen" : "Der Hof ist jetzt geschlossen"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen((v) => !v)}
                  className={`h-9 rounded-lg border px-3 text-[11px] font-semibold ${
                    isOpen ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                  }`}
                  aria-pressed={isOpen}
                >
                  {isOpen ? "Offen" : "Geschlossen"}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-1 gap-2 rounded-xl border border-border bg-background/60 p-3 md:grid-cols-[1fr,1fr,auto]">
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Alle Tage offen ab</label>
                  <input
                    type="time"
                    name="all-days-open"
                    aria-label="Alle Tage offen ab"
                    value={allDaysOpen}
                    onChange={(e) => setAllDaysOpen(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-medium text-muted-foreground">Alle Tage offen bis</label>
                  <input
                    type="time"
                    name="all-days-close"
                    aria-label="Alle Tage offen bis"
                    value={allDaysClose}
                    onChange={(e) => setAllDaysClose(e.target.value)}
                    className="mt-1 h-9 w-full rounded-lg border border-border bg-background px-2 text-xs text-foreground"
                  />
                </div>
                <button
                  type="button"
                  onClick={applyHoursToAllDays}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-[11px] font-medium text-foreground md:mt-5"
                >
                  Auf alle Tage anwenden
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {DAY_KEYS.map((key, idx) => (
                  <div key={key} className="grid grid-cols-[42px,1fr,1fr,76px] items-center gap-2">
                    <span className="text-[11px] font-medium text-muted-foreground">{DAYS[idx]}</span>
                    <input
                      type="time"
                      name={`${key}-open`}
                      aria-label={`${DAYS[idx]} offen ab`}
                      value={dayOpen[key]}
                      onChange={(e) => setDayOpen((prev) => ({ ...prev, [key]: e.target.value }))}
                      disabled={dayClosed[key]}
                      className="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground disabled:opacity-50"
                    />
                    <input
                      type="time"
                      name={`${key}-close`}
                      aria-label={`${DAYS[idx]} offen bis`}
                      value={dayClose[key]}
                      onChange={(e) => setDayClose((prev) => ({ ...prev, [key]: e.target.value }))}
                      disabled={dayClosed[key]}
                      className="h-9 rounded-lg border border-border bg-background px-2 text-xs text-foreground disabled:opacity-50"
                    />
                    <button
                      type="button"
                      onClick={() => setDayClosed((prev) => ({ ...prev, [key]: !prev[key] }))}
                      aria-label={`${DAYS[idx]} ${dayClosed[key] ? "als offen markieren" : "als geschlossen markieren"}`}
                      className={`h-9 rounded-lg border px-2 text-[10px] font-medium ${
                        dayClosed[key] ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {dayClosed[key] ? "Zu" : "Offen"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as "farm" | "shop" | "attraction")}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                >
                  <option value="farm">farm</option>
                  <option value="shop">shop</option>
                  <option value="attraction">attraction</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">Rating</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  step={0.1}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">image_url</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">website_url</label>
                <input
                  type="text"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                />
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
              {([
                ["has_shop", hasShop, setHasShop],
                ["has_parking", hasParking, setHasParking],
                ["has_restaurant", hasRestaurant, setHasRestaurant],
                ["has_accommodation", hasAccommodation, setHasAccommodation],
                ["has_playground", hasPlayground, setHasPlayground],
                ["has_quiz", hasQuiz, setHasQuiz],
                ["has_delivery", hasDelivery, setHasDelivery],
                ["is_open", isOpen, setIsOpen],
              ] as const).map(([label, value, setter]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setter(!value)}
                  className={`rounded-xl border px-2 py-2 text-[10px] font-medium ${
                    value ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-3">
              <p className="text-[10px] font-medium text-muted-foreground">products (ARRAY)</p>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {ALL_PRODUCT_KEYS.map((key) => {
                  const active = products.includes(key)
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleProducts(key)}
                      className={`rounded-xl border px-2 py-1.5 text-[10px] ${active ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground"}`}
                      aria-pressed={active}
                    >
                      {PRODUCT_LABELS[key]}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">ai_message_de</label>
                <textarea value={aiDe} onChange={(e) => setAiDe(e.target.value)} className="mt-1 h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">ai_message_en</label>
                <textarea value={aiEn} onChange={(e) => setAiEn(e.target.value)} className="mt-1 h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">ai_message_fr</label>
                <textarea value={aiFr} onChange={(e) => setAiFr(e.target.value)} className="mt-1 h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">ai_message_it</label>
                <textarea value={aiIt} onChange={(e) => setAiIt(e.target.value)} className="mt-1 h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">ai_message_sr</label>
                <textarea value={aiSr} onChange={(e) => setAiSr(e.target.value)} className="mt-1 h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
              </div>
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">ai_message_ua</label>
                <textarea value={aiUa} onChange={(e) => setAiUa(e.target.value)} className="mt-1 h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground" />
              </div>
            </div>

            <div className="mt-3">
              <div>
                <label className="text-[10px] font-medium text-muted-foreground">contact_info (jsonb)</label>
                <textarea value={contactInfo} onChange={(e) => setContactInfo(e.target.value)} className="mt-1 h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-mono" />
              </div>
              <details className="mt-3 rounded-2xl border border-border/70 bg-background">
                <summary className="cursor-pointer list-none px-3 py-2 text-[10px] font-medium text-muted-foreground">
                  Technisches Feld: opening_hours (jsonb)
                </summary>
                <div className="border-t border-border/70 p-3">
                  <label className="text-[10px] font-medium text-muted-foreground">opening_hours (jsonb)</label>
                  <textarea value={openingHours} onChange={(e) => setOpeningHours(e.target.value)} className="mt-1 h-20 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground font-mono" />
                </div>
              </details>
            </div>
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
