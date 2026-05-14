"use client"

import { useCallback, useId, useMemo, useState } from "react"
import { FileJson2, Loader2, Pencil, Send, Sparkles } from "lucide-react"
import type { Farm } from "@/lib/data"
import {
  apiPayloadToFarmPreview,
  duplicateEarlierInPayloadBatch,
  findExistingFarmDuplicate,
  normalizeImportedFarmRecord,
  parseImportedFarmJson,
  type AdminFarmApiPayload,
} from "@/lib/json-farm-import"
import { FarmDetailCard } from "@/components/public/farm-detail-card"

export type JsonFarmImportPanelProps = {
  existingFarms: Farm[]
  onOpenInModal: (farm: Farm) => void
  onPublished: (farm: Farm) => void
  getAdminAuthHeader: () => string
}

type Draft = {
  payload: AdminFarmApiPayload
  warnings: string[]
  editorJson: string
}

function mergeImportWarnings(
  payload: AdminFarmApiPayload,
  index: number,
  allPayloads: AdminFarmApiPayload[],
  existingFarms: Farm[],
  baseWarnings: string[],
): string[] {
  const out = [...baseWarnings]
  const j = duplicateEarlierInPayloadBatch(allPayloads, index)
  if (j !== null) {
    out.push(`Doppelt in dieser JSON-Liste (wie Eintrag ${j + 1}).`)
  }
  const existing = findExistingFarmDuplicate(payload, existingFarms)
  if (existing) {
    out.push(`Bereits in der Verwaltung: «${existing.name}» (${existing.address}).`)
  }
  return out
}

function stripDuplicateHintWarnings(warnings: string[]): string[] {
  const prefixes = ["Doppelt in dieser JSON-Liste", "Bereits in der Verwaltung"]
  return warnings.filter((line) => !prefixes.some((p) => line.startsWith(p)))
}

function recomputeAllDuplicateWarnings(drafts: Draft[], farms: Farm[]): Draft[] {
  const payloads = drafts.map((d) => d.payload)
  return drafts.map((d, i) => ({
    ...d,
    warnings: mergeImportWarnings(d.payload, i, payloads, farms, stripDuplicateHintWarnings(d.warnings)),
  }))
}

export function JsonFarmImportPanel({
  existingFarms,
  onOpenInModal,
  onPublished,
  getAdminAuthHeader,
}: JsonFarmImportPanelProps) {
  const formId = useId()
  const [rawInput, setRawInput] = useState("")
  const [drafts, setDrafts] = useState<Draft[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [parseError, setParseError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [publishMessage, setPublishMessage] = useState<string | null>(null)

  const currentDraft = drafts[selectedIndex] ?? null
  const previewFarm = useMemo(() => {
    if (!currentDraft) return null
    const p = currentDraft.payload
    const previewId = `import-preview-${selectedIndex}-${p.latitude}-${p.longitude}-${encodeURIComponent(p.name)}`
    return apiPayloadToFarmPreview(p, previewId)
  }, [currentDraft, selectedIndex])

  const publishBlocked = useMemo(() => {
    if (!currentDraft) return true
    const payloads = drafts.map((d) => d.payload)
    if (duplicateEarlierInPayloadBatch(payloads, selectedIndex) !== null) return true
    if (findExistingFarmDuplicate(currentDraft.payload, existingFarms)) return true
    return false
  }, [currentDraft, drafts, existingFarms, selectedIndex])

  const analyze = useCallback(() => {
    setParseError(null)
    setPublishMessage(null)
    const { records, error } = parseImportedFarmJson(rawInput)
    if (error || records.length === 0) {
      setParseError(error ?? "Keine Datensätze.")
      setDrafts([])
      return
    }
    const next: Draft[] = []
    const normalized: { payload: AdminFarmApiPayload; base: string[] }[] = []
    for (let i = 0; i < records.length; i++) {
      const result = normalizeImportedFarmRecord(records[i]!)
      if (!result.ok) {
        setParseError(`Eintrag ${i + 1}: ${result.error}`)
        setDrafts([])
        return
      }
      normalized.push({ payload: result.payload, base: result.warnings })
    }
    const payloads = normalized.map((n) => n.payload)
    for (let i = 0; i < normalized.length; i++) {
      const { payload, base } = normalized[i]!
      next.push({
        payload,
        warnings: mergeImportWarnings(payload, i, payloads, existingFarms, base),
        editorJson: JSON.stringify(payload, null, 2),
      })
    }
    setDrafts(next)
    setSelectedIndex(0)
  }, [rawInput, existingFarms])

  const applyEditorJson = useCallback(() => {
    if (!currentDraft) return
    let parsed: unknown
    try {
      parsed = JSON.parse(currentDraft.editorJson)
    } catch {
      setParseError("JSON im Editor ist ungültig.")
      return
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      setParseError("Editor: ein Objekt erwartet.")
      return
    }
    const result = normalizeImportedFarmRecord(parsed as Record<string, unknown>)
    if (!result.ok) {
      setParseError(result.error)
      return
    }
    setParseError(null)
    setDrafts((prev) => {
      const updated = prev.map((d, i) =>
        i === selectedIndex
          ? {
              ...d,
              payload: result.payload,
              warnings: result.warnings,
              editorJson: JSON.stringify(result.payload, null, 2),
            }
          : d,
      )
      return recomputeAllDuplicateWarnings(updated, existingFarms)
    })
  }, [currentDraft, selectedIndex, existingFarms])

  const publishCurrent = useCallback(async () => {
    if (!currentDraft) return
    setBusy(true)
    setPublishMessage(null)
    try {
      let body: AdminFarmApiPayload
      try {
        const parsed = JSON.parse(currentDraft.editorJson) as unknown
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          setPublishMessage("Editor-JSON: ein Objekt erwartet.")
          return
        }
        const r = normalizeImportedFarmRecord(parsed as Record<string, unknown>)
        if (!r.ok) {
          setPublishMessage(r.error)
          return
        }
        body = r.payload
      } catch {
        setPublishMessage("JSON im Editor ist ungültig — bitte korrigieren oder Übernehmen.")
        return
      }

      const dupExisting = findExistingFarmDuplicate(body, existingFarms)
      if (dupExisting) {
        setPublishMessage(`Bereits vorhanden: «${dupExisting.name}» (${dupExisting.address}). Nicht gespeichert.`)
        return
      }
      const batchPayloads = drafts.map((d) => d.payload)
      if (duplicateEarlierInPayloadBatch(batchPayloads, selectedIndex) !== null) {
        setPublishMessage("Doppelt in dieser JSON-Liste. Bitte einen Eintrag entfernen oder anpassen.")
        return
      }

      const adminAuth = getAdminAuthHeader()
      const response = await fetch("/api/admin/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-auth": adminAuth },
        body: JSON.stringify(body),
      })
      const result = (await response.json()) as { farm?: Farm; error?: string }
      if (!response.ok || !result.farm) {
        setPublishMessage(result.error ?? "Speichern fehlgeschlagen.")
        return
      }
      onPublished(result.farm)
      setPublishMessage(`Gespeichert: ${result.farm.name}`)
      const removed = selectedIndex
      const farmsAfterSave = [result.farm, ...existingFarms]
      setDrafts((prev) => {
        const next = prev.filter((_, i) => i !== removed)
        const nextSel = next.length === 0 ? 0 : Math.min(removed, next.length - 1)
        queueMicrotask(() => setSelectedIndex(nextSel))
        return recomputeAllDuplicateWarnings(next, farmsAfterSave)
      })
    } finally {
      setBusy(false)
    }
  }, [currentDraft, drafts, existingFarms, getAdminAuthHeader, onPublished, selectedIndex])

  const openInFullForm = useCallback(() => {
    if (!previewFarm) return
    onOpenInModal(previewFarm)
  }, [onOpenInModal, previewFarm])

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">JSON-Import</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Rohdaten einfügen (ein Objekt oder Array). Felder wie{" "}
              <code className="rounded bg-muted px-1 text-xs">adresse</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">website</code>,{" "}
              <code className="rounded bg-muted px-1 text-xs">telefon</code> werden automatisch ins API-Format gemappt.
              Vorschau wie auf der Website, danach speichern oder im Formular öffnen. Doppelte Einträge (gleicher Name
              und Adresse, oder fast gleiche Koordinaten) werden gegen die aktuelle Hofliste und innerhalb der JSON-Liste
              geprüft; Veröffentlichen ist dann blockiert, bis du anpasst.
            </p>
          </div>
          <FileJson2 className="h-10 w-10 shrink-0 text-primary/70" aria-hidden />
        </div>

        <label htmlFor={formId} className="mt-4 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Roh-JSON
        </label>
        <textarea
          id={formId}
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder='[{"name":"…","adresse":"…","latitude":47.2,"longitude":7.7,…}]'
          rows={10}
          className="mt-2 w-full rounded-2xl border border-border bg-background px-4 py-3 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void analyze()}
            className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Analysieren &amp; normalisieren
          </button>
        </div>
        {parseError ? <p className="mt-2 text-sm text-destructive">{parseError}</p> : null}
        {publishMessage ? <p className="mt-2 text-sm text-primary">{publishMessage}</p> : null}
      </div>

      {drafts.length > 0 ? (
        <div className="grid gap-6 xl:grid-cols-[280px,minmax(0,1fr)]">
          <aside className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Einträge</p>
            <ul className="mt-2 space-y-1">
              {drafts.map((d, i) => (
                <li key={`${d.payload.name}-${i}`}>
                  <button
                    type="button"
                    onClick={() => setSelectedIndex(i)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition-colors ${
                      i === selectedIndex
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:bg-muted/50"
                    }`}
                  >
                    <span className="font-medium">{d.payload.name}</span>
                    {d.warnings.length > 0 ? (
                      <span className="mt-0.5 block text-[10px] text-amber-700">{d.warnings.length} Hinweis(e)</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          </aside>

          <div className="space-y-4">
            {currentDraft?.warnings.length ? (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-xs text-amber-900 dark:text-amber-100">
                <p className="font-semibold">Hinweise</p>
                <ul className="mt-1 list-inside list-disc">
                  {currentDraft.warnings.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">API-JSON (bearbeitbar)</p>
                <button
                  type="button"
                  onClick={() => void applyEditorJson()}
                  className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
                >
                  Übernehmen
                </button>
              </div>
              <textarea
                value={currentDraft?.editorJson ?? ""}
                onChange={(e) => {
                  const v = e.target.value
                  setDrafts((prev) => prev.map((d, i) => (i === selectedIndex ? { ...d, editorJson: v } : d)))
                }}
                rows={16}
                className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 font-mono text-xs text-foreground focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {publishBlocked && currentDraft ? (
              <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-xs text-destructive">
                <p className="font-semibold">Veröffentlichen nicht möglich</p>
                <p className="mt-1 text-destructive/90">
                  Dieser Eintrag ist ein Duplikat (bereits in der Verwaltung oder doppelt in der JSON-Liste). Bitte
                  Eintrag anpassen oder entfernen.
                </p>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !previewFarm || publishBlocked}
                onClick={() => void publishCurrent()}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Veröffentlichen (POST)
              </button>
              <button
                type="button"
                disabled={!previewFarm}
                onClick={openInFullForm}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50"
              >
                <Pencil className="h-4 w-4" />
                Im Hofladen-Formular öffnen
              </button>
            </div>

            {previewFarm ? (
              <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-4">
                <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden />
                  Vorschau (wie auf der Karte)
                </p>
                <div className="max-h-[min(80vh,900px)] overflow-y-auto rounded-2xl border border-border bg-background shadow-inner">
                  <FarmDetailCard farm={previewFarm} allPoints={[previewFarm]} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}
