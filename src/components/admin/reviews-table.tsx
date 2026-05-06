"use client"

import { Pencil, Trash2 } from "lucide-react"

export type AdminReview = {
  id: string
  farm_id: string | null
  author_name: string | null
  rating: number | null
  text: string | null
  created_at: string | null
}

interface ReviewsTableProps {
  reviews: AdminReview[]
  farmNameById: (farmId: string | null) => string
  onEdit: (review: AdminReview) => void
  onDelete: (id: string) => void
}

export function ReviewsTable({ reviews, farmNameById, onEdit, onDelete }: ReviewsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border">
          <thead className="bg-muted/30">
            <tr>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Farm
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Autor
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Rating
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Kommentar
              </th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Datum
              </th>
              <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reviews.map((r) => (
              <tr key={r.id} className="hover:bg-muted/20">
                <td className="px-4 py-3 text-sm text-foreground">{farmNameById(r.farm_id)}</td>
                <td className="px-4 py-3 text-sm text-foreground">{r.author_name ?? "—"}</td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {typeof r.rating === "number" ? r.rating : "—"}
                </td>
                <td className="max-w-[520px] px-4 py-3 text-sm text-foreground">
                  <span className="line-clamp-2">{r.text ?? "—"}</span>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {r.created_at ? new Date(r.created_at).toLocaleString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Kommentar wirklich löschen?")) onDelete(r.id)
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {reviews.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-sm text-muted-foreground" colSpan={6}>
                  Keine Kommentare gefunden.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}

