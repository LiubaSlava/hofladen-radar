"use client"

import dynamic from "next/dynamic"
import { useEffect, useMemo, useState } from "react"
import { Plus, Search, Store, Package, Users, TrendingUp, Smartphone } from "lucide-react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { FarmsTable } from "@/components/admin/farms-table"
import type { Farm } from "@/lib/data"
import { ReviewsTable, type AdminReview } from "@/components/admin/reviews-table"
import type { AiSummaryFormData } from "@/components/admin/ai-summary-panel"
import { getLatestAppApkUrl } from "@/lib/app-download"
import { isPersistedFarmUuid } from "@/lib/farm-id"

const AiSummaryPanel = dynamic(
  () => import("@/components/admin/ai-summary-panel").then((m) => m.AiSummaryPanel),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-2xl bg-muted/40" aria-hidden />,
  },
)

const JsonFarmImportPanel = dynamic(
  () => import("@/components/admin/json-farm-import-panel").then((m) => m.JsonFarmImportPanel),
  {
    ssr: false,
    loading: () => <div className="h-64 animate-pulse rounded-2xl bg-muted/40" aria-hidden />,
  },
)

const FarmModal = dynamic(() => import("@/components/admin/farm-modal").then((m) => m.FarmModal), {
  ssr: false,
})

const ReviewModal = dynamic(() => import("@/components/admin/review-modal").then((m) => m.ReviewModal), {
  ssr: false,
})

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
  products: Farm["products"]
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
  public_slug: string
  seo_title: string
  seo_description: string
  public_page_text: string
}

interface AdminViewProps {
  initialFarms?: Farm[]
}

const ADMIN_AUTH_STORAGE_KEY = "glory_admin_auth"

function getAdminAuthHeader(): string {
  if (typeof window === "undefined") return ""
  return window.localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) ?? ""
}

export function AdminView({ initialFarms = [] }: AdminViewProps) {
  const [activeNav, setActiveNav] = useState("hofladen")
  const [categoryFilter, setCategoryFilter] = useState<"all" | "farm" | "shop" | "attraction">("all")
  const [farms, setFarms] = useState<Farm[]>(() => initialFarms)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Farm | null>(null)
  const [reviews, setReviews] = useState<AdminReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewEditing, setReviewEditing] = useState<AdminReview | null>(null)
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [appFile, setAppFile] = useState<File | null>(null)
  const [appUploadProgress, setAppUploadProgress] = useState(0)
  const [appUploadBusy, setAppUploadBusy] = useState(false)
  const [appUploadMessage, setAppUploadMessage] = useState("")
  const [aiSummarySavingId, setAiSummarySavingId] = useState<string | null>(null)

  useEffect(() => {
    if (activeNav !== "kommentare") return
    const load = async () => {
      setReviewsLoading(true)
      try {
        const adminAuth = getAdminAuthHeader()
        const response = await fetch("/api/admin/reviews", { headers: { "x-admin-auth": adminAuth } })
        const result = (await response.json()) as { reviews?: AdminReview[]; error?: string }
        if (!response.ok || !result.reviews) {
          console.error("Fetch reviews failed:", result.error ?? "unknown")
          setReviews([])
          return
        }
        setReviews(result.reviews)
      } finally {
        setReviewsLoading(false)
      }
    }
    void load()
  }, [activeNav])

  const farmNameById = useMemo(() => {
    const map = new Map(farms.map((f) => [f.id, f.name]))
    return (farmId: string | null) => (farmId && map.get(farmId)) || farmId || "—"
  }, [farms])

  const openReviewEdit = (review: AdminReview) => {
    setReviewEditing(review)
    setReviewModalOpen(true)
  }

  const saveReview = async (patch: { id: string; author_name: string; rating: number; text: string }) => {
    const adminAuth = getAdminAuthHeader()
    const response = await fetch("/api/admin/reviews", {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-auth": adminAuth },
      body: JSON.stringify(patch),
    })
    const result = (await response.json()) as { review?: AdminReview; error?: string }
    if (!response.ok || !result.review) {
      console.error("Update review failed:", result.error ?? "unknown")
      window.alert(`Speichern fehlgeschlagen: ${result.error ?? "Unbekannter Fehler"}`)
      return
    }
    setReviews((prev) => prev.map((r) => (r.id === result.review!.id ? result.review! : r)))
    setReviewModalOpen(false)
  }

  const deleteReview = async (id: string) => {
    const adminAuth = getAdminAuthHeader()
    const response = await fetch("/api/admin/reviews", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-auth": adminAuth },
      body: JSON.stringify({ id }),
    })
    const result = (await response.json()) as { ok?: boolean; error?: string }
    if (!response.ok || !result.ok) {
      console.error("Delete review failed:", result.error ?? "unknown")
      window.alert(`Löschen fehlgeschlagen: ${result.error ?? "Unbekannter Fehler"}`)
      return
    }
    setReviews((prev) => prev.filter((r) => r.id !== id))
  }

  const uploadApp = async () => {
    if (!appFile) return
    const adminAuth = getAdminAuthHeader()
    const formData = new FormData()
    formData.append("file", appFile)
    setAppUploadBusy(true)
    setAppUploadProgress(0)
    setAppUploadMessage("")

    await new Promise<void>((resolve) => {
      const xhr = new XMLHttpRequest()
      xhr.open("POST", "/api/admin/upload-app")
      xhr.setRequestHeader("x-admin-auth", adminAuth)
      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable) return
        setAppUploadProgress(Math.round((event.loaded / event.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setAppUploadMessage("App-Datei wurde erfolgreich aktualisiert")
          setAppFile(null)
        } else {
          let message = "Upload fehlgeschlagen."
          try {
            const parsed = JSON.parse(xhr.responseText) as { error?: string }
            if (parsed?.error) message = `Upload fehlgeschlagen: ${parsed.error}`
          } catch {
            // keep default message
          }
          setAppUploadMessage(message)
        }
        setAppUploadBusy(false)
        resolve()
      }
      xhr.onerror = () => {
        setAppUploadMessage("Upload fehlgeschlagen.")
        setAppUploadBusy(false)
        resolve()
      }
      xhr.send(formData)
    })
  }

  const filtered = useMemo(
    () =>
      farms.filter((f) => {
        const matchesCategory = categoryFilter === "all" || f.category === categoryFilter
        const matchesSearch =
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.address.toLowerCase().includes(search.toLowerCase())
        return matchesCategory && matchesSearch
      }),
    [farms, search, categoryFilter],
  )
  const aiSummaryFiltered = useMemo(
    () =>
      farms.filter((f) => {
        const needle = search.toLowerCase()
        return f.name.toLowerCase().includes(needle) || f.address.toLowerCase().includes(needle)
      }),
    [farms, search],
  )

  const categoryStats = useMemo(() => {
    const farm = farms.filter((f) => f.category === "farm").length
    const shop = farms.filter((f) => f.category === "shop").length
    const attraction = farms.filter((f) => f.category === "attraction").length
    return { farm, shop, attraction, all: farms.length }
  }, [farms])

  const stats = useMemo(() => {
    const active = farms.filter((f) => f.status === "active").length
    const products = new Set(farms.flatMap((f) => f.categories)).size
    return [
      { label: "Hofläden", value: farms.length, icon: Store, hint: `${active} aktiv` },
      { label: "Produktarten", value: products, icon: Package, hint: "Kategorien" },
      { label: "Benutzer", value: 1284, icon: Users, hint: "+12 % diese Woche" },
      { label: "Aufrufe heute", value: "3.2k", icon: TrendingUp, hint: "Radar-Suchen" },
    ]
  }, [farms])

  const openCreate = () => {
    setEditing(null)
    setModalOpen(true)
  }
  const openEdit = (farm: Farm) => {
    setEditing(farm)
    setModalOpen(true)
  }
  const toggleStatus = (id: string) => {
    setFarms((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: f.status === "active" ? "inactive" : "active" } : f)),
    )
  }
  const removeFarm = async (id: string) => {
    const adminAuth = getAdminAuthHeader()
    const response = await fetch("/api/admin/farms", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-admin-auth": adminAuth },
      body: JSON.stringify({ id }),
    })
    const result = (await response.json()) as { ok?: boolean; error?: string }
    if (!response.ok || !result.ok) {
      console.error("Delete farm failed:", result.error ?? "unknown")
      return
    }
    setFarms((prev) => prev.filter((f) => f.id !== id))
  }
  const saveFarm = async (data: FarmFormData) => {
    const adminAuth = getAdminAuthHeader()
    const updating = Boolean(data.id && isPersistedFarmUuid(data.id))
    const payload = {
      ...(updating ? { id: data.id } : {}),
      name: data.name,
      address: data.address,
      latitude: data.lat,
      longitude: data.lng,
      products: data.products.length > 0 ? data.products : data.categories,
      has_shop: data.has_shop,
      has_parking: data.has_parking,
      has_restaurant: data.has_restaurant,
      has_accommodation: data.has_accommodation,
      has_playground: data.has_playground,
      has_quiz: data.has_quiz,
      has_delivery: data.has_delivery,
      is_open: data.is_open,
      ai_message_de: data.ai_message_de,
      ai_message_en: data.ai_message_en,
      ai_message_fr: data.ai_message_fr,
      ai_message_it: data.ai_message_it,
      ai_message_sr: data.ai_message_sr,
      ai_message_ua: data.ai_message_ua,
      status: data.status,
      rating: data.rating,
      image_url: data.image_url,
      website_url: data.website_url,
      contact_info: data.contact_info,
      opening_hours: data.opening_hours,
      category: data.category,
      public_slug: data.public_slug,
      seo_title: data.seo_title,
      seo_description: data.seo_description,
      public_page_text: data.public_page_text,
    }

    const method = updating ? "PUT" : "POST"
    const response = await fetch("/api/admin/farms", {
      method,
      headers: { "Content-Type": "application/json", "x-admin-auth": adminAuth },
      body: JSON.stringify(payload),
    })
    const result = (await response.json()) as { farm?: Farm; error?: string }
    if (response.status === 409) {
      window.alert(result.error ?? "Dieser URL-Pfad (Slug) ist bereits vergeben.")
      return
    }
    if (!response.ok || !result.farm) {
      console.error("Save farm failed:", result.error ?? "unknown")
      window.alert(`Speichern fehlgeschlagen: ${result.error ?? "Unbekannter Fehler"}`)
      return
    }

    setFarms((prev) => {
      if (updating && data.id) return prev.map((f) => (f.id === data.id ? result.farm! : f))
      return [result.farm!, ...prev]
    })
    setModalOpen(false)
  }

  const openImportFarmInModal = (farm: Farm) => {
    setActiveNav("hofladen")
    setEditing(farm)
    setModalOpen(true)
  }

  const onImportFarmPublished = (farm: Farm) => {
    setFarms((prev) => [farm, ...prev])
  }

  const saveAiSummary = async (data: AiSummaryFormData) => {
    const adminAuth = getAdminAuthHeader()
    setAiSummarySavingId(data.id)
    try {
      const response = await fetch("/api/admin/farms/ai-summary", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-auth": adminAuth },
        body: JSON.stringify({
          id: data.id,
          content: data.content,
        }),
      })
      const result = (await response.json()) as { farm?: Farm; error?: string }
      if (!response.ok || !result.farm) {
        console.error("Save AI summary failed:", result.error ?? "unknown")
        window.alert(`Speichern fehlgeschlagen: ${result.error ?? "Unbekannter Fehler"}`)
        return
      }
      setFarms((prev) => prev.map((farm) => (farm.id === result.farm!.id ? result.farm! : farm)))
    } finally {
      setAiSummarySavingId(null)
    }
  }

  const headerCopy = useMemo(() => {
    if (activeNav === "json-import") {
      return {
        eyebrow: "Daten",
        title: "JSON-Import",
        searchPlaceholder: "",
        showSearch: false,
        showCreate: false,
      }
    }
    if (activeNav === "ki-ueberblick") {
      return {
        eyebrow: "KI-Verwaltung",
        title: "KI-Überblick",
        searchPlaceholder: "Hofladen suchen…",
        showSearch: true,
        showCreate: false,
      }
    }
    if (activeNav === "hofladen") {
      return {
        eyebrow: "Verwaltung",
        title: "Hofladen Management",
        searchPlaceholder: "Suchen…",
        showSearch: true,
        showCreate: true,
      }
    }
    return {
      eyebrow: "Verwaltung",
      title: "Hofladen Management",
      searchPlaceholder: "Suchen…",
      showSearch: false,
      showCreate: false,
    }
  }, [activeNav])

  return (
    <div className="flex h-screen w-full bg-secondary text-foreground">
      <AdminSidebar active={activeNav} onChange={setActiveNav} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/80 px-6 py-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {headerCopy.eyebrow}
              </p>
              <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                {headerCopy.title}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {headerCopy.showSearch ? (
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder={headerCopy.searchPlaceholder}
                    className="h-10 w-56 rounded-full border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ) : null}
              {headerCopy.showCreate ? (
                <button
                  onClick={openCreate}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Neuen Hofladen hinzufügen</span>
                  <span className="sm:hidden">Neu</span>
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 md:px-8">
          {activeNav === "kommentare" ? (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">Kommentare</h2>
                  <p className="text-xs text-muted-foreground">
                    {reviewsLoading ? "Lade…" : `${reviews.length} Kommentare`}
                  </p>
                </div>
              </div>
              <ReviewsTable
                reviews={reviews}
                farmNameById={farmNameById}
                onEdit={openReviewEdit}
                onDelete={deleteReview}
              />
            </>
          ) : activeNav === "ki-ueberblick" ? (
            <AiSummaryPanel
              farms={aiSummaryFiltered}
              totalCount={farms.length}
              savingId={aiSummarySavingId}
              onSave={saveAiSummary}
            />
          ) : activeNav === "json-import" ? (
            <JsonFarmImportPanel
              existingFarms={farms}
              getAdminAuthHeader={getAdminAuthHeader}
              onOpenInModal={openImportFarmInModal}
              onPublished={onImportFarmPublished}
            />
          ) : activeNav === "app-verwaltung" ? (
            <div className="max-w-xl rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold tracking-tight text-foreground">Android App Update</h2>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Lade eine neue APK hoch. Der Download-Link auf der Website zeigt immer die letzte Version.
              </p>

              <div className="mt-4">
                <label className="text-[10px] font-medium text-muted-foreground">APK-Datei</label>
                <input
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    if (file && !file.name.toLowerCase().endsWith(".apk")) {
                      setAppFile(null)
                      setAppUploadMessage("Nur .apk Dateien sind erlaubt.")
                      return
                    }
                    setAppFile(file)
                    setAppUploadMessage("")
                  }}
                  className="mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary"
                />
              </div>

              <div className="mt-4">
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${appUploadProgress}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{appUploadProgress}%</p>
              </div>

              {appUploadMessage ? (
                <p className="mt-3 text-xs text-foreground">{appUploadMessage}</p>
              ) : null}

              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void uploadApp()}
                  disabled={!appFile || appUploadBusy}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {appUploadBusy ? "Wird hochgeladen..." : "APK hochladen"}
                </button>
                <a
                  href={getLatestAppApkUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  Aktueller Download-Link
                </a>
              </div>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div
                      key={stat.label}
                      className="rounded-2xl border border-border bg-card p-4 transition-shadow hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          {stat.label}
                        </p>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{stat.value}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{stat.hint}</p>
                    </div>
                  )
                })}
              </div>

              {/* Mobile search */}
              <div className="mt-4 sm:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Hofladen suchen…"
                    className="h-10 w-full rounded-full border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="mt-6">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold tracking-tight text-foreground">
                      Registrierte Hofläden
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {filtered.length} von {farms.length} angezeigt
                    </p>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-2">
                  {(
                    [
                      { key: "all", label: `Alle (${categoryStats.all})` },
                      { key: "farm", label: `Farmen (${categoryStats.farm})` },
                      { key: "shop", label: `Shops (${categoryStats.shop})` },
                      { key: "attraction", label: `Attraktionen (${categoryStats.attraction})` },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setCategoryFilter(item.key)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                        categoryFilter === item.key
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                <FarmsTable
                  farms={filtered}
                  onEdit={openEdit}
                  onToggleStatus={toggleStatus}
                  onDelete={removeFarm}
                />
              </div>
            </>
          )}
        </div>
      </main>

      {modalOpen ? (
        <FarmModal
          key={editing?.id ?? "new-farm"}
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={saveFarm}
          initial={editing}
          allFarms={farms}
        />
      ) : null}

      {reviewModalOpen && reviewEditing ? (
        <ReviewModal
          open={reviewModalOpen}
          initial={reviewEditing}
          onClose={() => setReviewModalOpen(false)}
          onSave={saveReview}
        />
      ) : null}
    </div>
  )
}
