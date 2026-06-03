"use client"

import { Check, Pencil, X } from "lucide-react"
import type { Farm } from "@/lib/data"

function formatSubmittedAt(iso?: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleString("de-CH", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return iso
  }
}

function categoryLabel(category: Farm["category"]): string {
  if (category === "shop") return "Laden"
  if (category === "attraction") return "Attraktion"
  return "Hof"
}

interface SubmissionsTableProps {
  submissions: Farm[]
  busyId: string | null
  onEdit: (farm: Farm) => void
  onApprove: (id: string) => void
  onReject: (id: string) => void
}

export function SubmissionsTable({ submissions, busyId, onEdit, onApprove, onReject }: SubmissionsTableProps) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
        Keine offenen Einreichungen.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left">
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Betrieb
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Art</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Eingereicht von
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Datum</th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((farm) => {
              const busy = busyId === farm.id
              return (
                <tr key={farm.id} className="border-b border-border last:border-0 hover:bg-muted/25">
                  <td className="px-4 py-3.5">
                    <p className="font-medium text-foreground">{farm.name}</p>
                    <p className="text-xs text-muted-foreground">{farm.address}</p>
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">{categoryLabel(farm.category)}</td>
                  <td className="px-4 py-3.5">
                    <p className="text-foreground">{farm.submitter_name ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{farm.submitter_email ?? ""}</p>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-muted-foreground">
                    {formatSubmittedAt(farm.submitted_at)}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onApprove(farm.id)}
                        className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/15 disabled:opacity-50"
                      >
                        <Check className="h-3.5 w-3.5" aria-hidden />
                        Freigeben
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => onEdit(farm)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
                        aria-label="Bearbeiten"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => {
                          if (window.confirm(`Einreichung „${farm.name}" ablehnen und löschen?`)) {
                            onReject(farm.id)
                          }
                        }}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        aria-label="Ablehnen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
