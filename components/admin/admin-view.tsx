"use client"

import { useMemo, useState } from "react"
import { Plus, Search, Store, Package, Users, TrendingUp } from "lucide-react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { FarmsTable } from "@/components/admin/farms-table"
import { FarmModal } from "@/components/admin/farm-modal"
import { FARMS, type Farm } from "@/lib/data"

export function AdminView() {
  const [activeNav, setActiveNav] = useState("hofladen")
  const [farms, setFarms] = useState<Farm[]>(FARMS)
  const [search, setSearch] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Farm | null>(null)

  const filtered = useMemo(
    () =>
      farms.filter(
        (f) =>
          f.name.toLowerCase().includes(search.toLowerCase()) ||
          f.address.toLowerCase().includes(search.toLowerCase()),
      ),
    [farms, search],
  )

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
  const removeFarm = (id: string) => {
    setFarms((prev) => prev.filter((f) => f.id !== id))
  }
  const saveFarm = (data: Omit<Farm, "id" | "image" | "distanceKm" | "rating" | "openNow"> & { id?: string }) => {
    if (data.id) {
      setFarms((prev) =>
        prev.map((f) =>
          f.id === data.id
            ? {
                ...f,
                name: data.name,
                address: data.address,
                lat: data.lat,
                lng: data.lng,
                hours: data.hours,
                categories: data.categories,
                status: data.status,
              }
            : f,
        ),
      )
    } else {
      const newFarm: Farm = {
        id: `f${Date.now()}`,
        name: data.name,
        address: data.address,
        lat: data.lat,
        lng: data.lng,
        category: "farm",
        hours: data.hours,
        categories: data.categories,
        products: data.categories,
        status: data.status,
        distanceKm: 0,
        rating: 0,
        reviewCount: 0,
        openNow: data.status === "active",
        image: "/farm-placeholder.jpg",
        bio: false,
        features: { shop: true, parking: false, restaurant: false, playground: false },
        seasonal: [],
        description: "",
        reviews: [],
        attractionIds: [],
      }
      setFarms((prev) => [newFarm, ...prev])
    }
    setModalOpen(false)
  }

  return (
    <div className="flex h-screen w-full bg-secondary text-foreground">
      <AdminSidebar active={activeNav} onChange={setActiveNav} />

      <main className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-border bg-card/80 px-6 py-5 backdrop-blur-xl md:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Verwaltung
              </p>
              <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                Hofladen Management
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Suchen…"
                  className="h-10 w-56 rounded-full border border-border bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Neuen Hofladen hinzufügen</span>
                <span className="sm:hidden">Neu</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-6 md:px-8">
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
            <FarmsTable
              farms={filtered}
              onEdit={openEdit}
              onToggleStatus={toggleStatus}
              onDelete={removeFarm}
            />
          </div>
        </div>
      </main>

      <FarmModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={saveFarm}
        initial={editing}
      />
    </div>
  )
}
