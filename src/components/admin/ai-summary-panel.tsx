"use client"

import Image from "next/image"
import { useMemo, useState } from "react"
import { CheckCircle2, MapPin, Sparkles } from "lucide-react"
import type { Farm } from "@/lib/data"

export type AiSummaryFormData = {
  id: string
  content: string
}

interface AiSummaryPanelProps {
  farms: Farm[]
  totalCount: number
  savingId?: string | null
  onSave: (data: AiSummaryFormData) => Promise<void>
}

function createDraft(farm: Farm): AiSummaryFormData {
  return {
    id: farm.id,
    content: farm.ai_summary_content ?? "",
  }
}

function hasAiSummary(farm: Farm): boolean {
  return Boolean(farm.ai_summary_content?.trim())
}

function hasDraftChanges(farm: Farm, draft: AiSummaryFormData | null): boolean {
  if (!draft) return false
  return draft.content !== (farm.ai_summary_content ?? "")
}

export function AiSummaryPanel({ farms, totalCount, savingId = null, onSave }: AiSummaryPanelProps) {
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id ?? "")
  const [draftsByFarmId, setDraftsByFarmId] = useState<Record<string, AiSummaryFormData>>({})

  const selectedFarm = useMemo(
    () => farms.find((farm) => farm.id === selectedFarmId) ?? farms[0] ?? null,
    [farms, selectedFarmId],
  )
  const draft = useMemo(
    () => (selectedFarm ? draftsByFarmId[selectedFarm.id] ?? createDraft(selectedFarm) : null),
    [draftsByFarmId, selectedFarm],
  )

  const previewText = useMemo(() => {
    if (!draft) return ""
    return draft.content.trim()
  }, [draft])

  const handleFieldChange = (key: keyof AiSummaryFormData, value: string) => {
    if (!selectedFarm) return
    setDraftsByFarmId((prev) => ({
      ...prev,
      [selectedFarm.id]: {
        ...(prev[selectedFarm.id] ?? createDraft(selectedFarm)),
        [key]: value,
      },
    }))
  }

  const handleReset = () => {
    if (!selectedFarm) return
    setDraftsByFarmId((prev) => {
      const next = { ...prev }
      delete next[selectedFarm.id]
      return next
    })
  }

  const handleSave = async () => {
    if (!draft) return
    await onSave(draft)
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
      <section className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-4 py-4">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Höfe für KI-Überblick</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {farms.length} von {totalCount} Höfen passend
          </p>
        </div>
        <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
          {farms.map((farm) => {
            const active = farm.id === selectedFarm?.id
            const filled = hasAiSummary(farm)
            return (
              <button
                key={farm.id}
                type="button"
                onClick={() => setSelectedFarmId(farm.id)}
                className={`w-full rounded-2xl border p-3 text-left transition-colors ${
                  active ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{farm.name}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{farm.address}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      filled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {filled ? "gefüllt" : "leer"}
                  </span>
                </div>
              </button>
            )
          })}
          {farms.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              Keine Höfe für diese Suche gefunden.
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-4">
        {selectedFarm && draft ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr),minmax(0,1.08fr)]">
              <div className="overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
                  <Image
                    src={selectedFarm.image || "/placeholder.svg"}
                    alt={selectedFarm.name}
                    fill
                    sizes="(max-width: 1200px) 100vw, 420px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <h3 className="text-base font-semibold tracking-tight text-foreground">
                      {selectedFarm.name}
                    </h3>
                    <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{selectedFarm.address}</span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-border bg-background px-2.5 py-1 text-foreground">
                      {selectedFarm.category}
                    </span>
                    <span
                      className={`rounded-full px-2.5 py-1 ${
                        selectedFarm.status === "active"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {selectedFarm.status === "active" ? "Aktiv" : "Inaktiv"}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Auf dieser Seite wird nur der Inhalt des öffentlichen Blocks `KI-Überblick`
                    gepflegt. Andere Farmdaten bleiben unverändert.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold tracking-tight text-foreground">
                      Live-Vorschau des öffentlichen KI-Blocks
                    </h3>
                  <p className="text-xs text-muted-foreground">
                    Die Vorschau zeigt genau den Inhalt des Blocks auf der Farmseite.
                    </p>
                  </div>
                </div>
                <div className="mt-4 relative overflow-hidden rounded-2xl p-[1.5px]">
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(168, 85, 247, 0.5), rgba(59, 130, 246, 0.4), rgba(16, 185, 129, 0.4))",
                    }}
                    aria-hidden="true"
                  />
                  <div className="relative rounded-[14px] bg-card/95 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                      </div>
                      <h4 className="text-sm font-semibold tracking-tight text-foreground">
                        KI-Überblick
                      </h4>
                      <span className="ml-auto rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-purple-700">
                        Beta
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground">
                      {previewText || "Noch kein KI-Text hinterlegt. Der Platzhalter bleibt sichtbar, bis ein Text gespeichert wurde."}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold tracking-tight text-foreground">
                    KI-Überblick Text
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Speichert nur den Inhalt des KI-Blocks aus `ki_ueberblick.content`. Die Farm
                    selbst wird nicht neu angelegt oder umstrukturiert.
                  </p>
                </div>
                {hasDraftChanges(selectedFarm, draft) ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-1 text-[10px] font-medium text-amber-700">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Ungespeicherte Änderungen
                  </span>
                ) : null}
              </div>

              <div className="mt-4">
                <AiField label="Inhalt" value={draft.content} onChange={(value) => handleFieldChange("content", value)} />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  Zurücksetzen
                </button>
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={savingId === draft.id}
                  className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingId === draft.id ? "Speichert..." : "KI-Überblick speichern"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-sm text-muted-foreground">
            Wähle links einen Hof aus, um den KI-Überblick zu bearbeiten.
          </div>
        )}
      </section>
    </div>
  )
}

function AiField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div>
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 h-32 w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </div>
  )
}
