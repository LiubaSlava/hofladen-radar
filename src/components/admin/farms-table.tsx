"use client"

import { useMemo, useState } from "react"
import { ArrowUpDown, Pencil, Trash2 } from "lucide-react"
import type { Farm } from "@/lib/data"
import { CategoryIcon } from "@/components/category-icon"

type SortKey = "name" | "address" | "status"
type SortDir = "asc" | "desc"

interface FarmsTableProps {
  farms: Farm[]
  onEdit: (farm: Farm) => void
  onToggleStatus: (id: string) => void
  onDelete: (id: string) => void
}

export function FarmsTable({ farms, onEdit, onToggleStatus, onDelete }: FarmsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  const sorted = useMemo(() => {
    const arr = [...farms]
    arr.sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      const cmp = String(av).localeCompare(String(bv), "de")
      return sortDir === "asc" ? cmp : -cmp
    })
    return arr
  }, [farms, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <SortableHeader label="Name" active={sortKey === "name"} dir={sortDir} onClick={() => toggleSort("name")} />
              <SortableHeader
                label="Adresse"
                active={sortKey === "address"}
                dir={sortDir}
                onClick={() => toggleSort("address")}
              />
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sortiment
              </th>
              <SortableHeader
                label="Status"
                active={sortKey === "status"}
                dir={sortDir}
                onClick={() => toggleSort("status")}
              />
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((farm) => (
              <tr key={farm.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                <td className="px-4 py-3.5">
                  <p className="font-medium text-foreground">{farm.name}</p>
                  <p className="text-xs text-muted-foreground">
                    ★ {farm.rating.toFixed(1)} · {farm.reviewCount} Bewertungen
                  </p>
                </td>
                <td className="px-4 py-3.5 text-muted-foreground">{farm.address}</td>
                <td className="px-4 py-3.5">
                  <div className="flex flex-wrap gap-1">
                    {farm.categories.map((cat) => (
                      <span
                        key={cat}
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary"
                        title={cat}
                      >
                        <CategoryIcon category={cat} className="h-3.5 w-3.5" />
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <button
                    onClick={() => onToggleStatus(farm.id)}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      farm.status === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        farm.status === "active" ? "bg-primary" : "bg-muted-foreground/60"
                      }`}
                    />
                    {farm.status === "active" ? "Aktiv" : "Inaktiv"}
                  </button>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEdit(farm)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      aria-label="Bearbeiten"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Hofladen "${farm.name}" wirklich löschen?`)) {
                          void onDelete(farm.id)
                        }
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label="Löschen"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Keine Hofläden gefunden.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SortableHeader({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
}) {
  return (
    <th className="px-4 py-3">
      <button
        onClick={onClick}
        className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
        <ArrowUpDown className={`h-3 w-3 ${active ? "opacity-100" : "opacity-40"} ${active && dir === "desc" ? "rotate-180" : ""}`} />
      </button>
    </th>
  )
}
