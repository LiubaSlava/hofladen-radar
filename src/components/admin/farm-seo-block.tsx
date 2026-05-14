"use client"

import { useMemo } from "react"
import { Globe, Search } from "lucide-react"
import { getPublicSiteOrigin } from "@/lib/site-url"
import { normalizePublicSlugInput } from "@/lib/seo-slug"

const SEO_TITLE_MAX = 200
const SEO_DESC_MAX = 320
const PUBLIC_PAGE_MAX = 20000

export type FarmSeoBlockProps = {
  publicSlug: string
  onPublicSlugChange: (value: string) => void
  seoTitle: string
  onSeoTitleChange: (value: string) => void
  seoDescription: string
  onSeoDescriptionChange: (value: string) => void
  publicPageText: string
  onPublicPageTextChange: (value: string) => void
  /** Für Hinweise im UI (optionaler Meta-Titel-Fallback). */
  farmName: string
  farmStatus: "active" | "inactive"
  /** Anderer Hof nutzt denselben Slug (nach Normalisierung). */
  slugDuplicateFarmName?: string | null
  /** Meta-Beschreibung und öffentlicher Fliesstext sind identisch (längere Texte). */
  duplicateMetaAndBody?: boolean
  /** Slug wieder automatisch aus Name + Adresse (löst Nutzer-„Touched“). */
  onResetSlugFromNameAddress?: () => void
}

function countLabel(current: number, max: number): string {
  return `${current} / ${max}`
}

export function FarmSeoBlock({
  publicSlug,
  onPublicSlugChange,
  seoTitle,
  onSeoTitleChange,
  seoDescription,
  onSeoDescriptionChange,
  publicPageText,
  onPublicPageTextChange,
  farmName,
  farmStatus,
  slugDuplicateFarmName = null,
  duplicateMetaAndBody = false,
  onResetSlugFromNameAddress,
}: FarmSeoBlockProps) {
  const normalizedSlug = useMemo(() => normalizePublicSlugInput(publicSlug), [publicSlug])

  const previewOrigin = getPublicSiteOrigin()

  const publicUrl = normalizedSlug ? `${previewOrigin}/hof/${normalizedSlug}` : null

  const slugDirty = publicSlug.trim().length > 0
  const slugInvalid = slugDirty && !normalizedSlug

  const pageVisibleHint =
    farmStatus === "active" && Boolean(normalizedSlug)
      ? "Mit aktuellem Status und Slug ist die Seite unter der Vorschau-URL erreichbar (nach Speichern)."
      : farmStatus !== "active"
        ? "Seite ist für Suchmaschinen nur sinnvoll bei Status „aktiv“."
        : "Ohne Slug gibt es keine eigene /hof/-Seite — Radar bleibt unverändert."

  return (
    <section
      className="mt-6 rounded-2xl border border-primary/25 bg-primary/[0.04] p-4 shadow-sm ring-1 ring-primary/10"
      aria-labelledby="farm-seo-block-heading"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-background/80 text-primary">
          <Search className="h-5 w-5" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <h3 id="farm-seo-block-heading" className="text-sm font-semibold tracking-tight text-foreground">
            SEO & öffentliche Seite
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
            Optional: eigene URL unter <span className="font-mono text-foreground">/hof/…</span> für Google und Teilen.
            Stammdaten und Karte bleiben unabhängig — leer lassen, wenn keine Extra-Seite gewünscht ist.
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">{pageVisibleHint}</p>
          <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/90">
            Jeder URL-Slug darf nur <strong className="font-medium text-foreground">einmal</strong> vorkommen. Die
            Vorschau prüft gegen die geladene Hofliste (ohne diesen Eintrag).
          </p>
          <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground/90">
            Der Slug wird <strong className="font-medium text-foreground">automatisch</strong> aus Name und Adresse
            erzeugt (Umlaute und Akzente werden vereinfacht), bis Sie das Slug-Feld selbst bearbeiten. Kollisionen mit
            anderen Höfen werden mit <span className="font-mono">-2</span>, <span className="font-mono">-3</span>{" "}
            vermieden.
          </p>
          {onResetSlugFromNameAddress ? (
            <button
              type="button"
              onClick={onResetSlugFromNameAddress}
              className="mt-2 text-left text-[10px] font-medium text-primary underline-offset-2 hover:underline"
            >
              Slug erneut aus Name &amp; Adresse vorschlagen
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-medium text-muted-foreground" htmlFor="farm-seo-slug">
              URL-Pfad (Slug)
            </label>
            {slugDuplicateFarmName ? (
              <span className="max-w-[55%] truncate text-right text-[10px] font-medium text-destructive" title={slugDuplicateFarmName}>
                vergeben: {slugDuplicateFarmName}
              </span>
            ) : slugInvalid ? (
              <span className="text-[10px] font-medium text-destructive">ungültig (nur a–z, 0–9, -)</span>
            ) : null}
          </div>
          <input
            id="farm-seo-slug"
            type="text"
            value={publicSlug}
            onChange={(e) => onPublicSlugChange(e.target.value)}
            placeholder="z. B. hof-mueller-st-gallen"
            maxLength={120}
            autoComplete="off"
            className={`mt-1 h-10 w-full rounded-xl border bg-background px-3 font-mono text-sm text-foreground ${
              slugDuplicateFarmName
                ? "border-destructive/80 ring-2 ring-destructive/20"
                : "border-border"
            }`}
          />
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {publicUrl ? (
              <a
                href={publicUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate font-mono text-primary underline-offset-2 hover:underline"
              >
                {publicUrl}
              </a>
            ) : (
              <span className="font-mono">…/hof/<span className="text-muted-foreground/80">slug</span></span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-medium text-muted-foreground" htmlFor="farm-seo-title">
              Seitentitel (Meta / Browser)
            </label>
            <span
              className={`text-[10px] tabular-nums ${seoTitle.length > SEO_TITLE_MAX ? "text-destructive" : "text-muted-foreground"}`}
            >
              {countLabel(seoTitle.length, SEO_TITLE_MAX)}
            </span>
          </div>
          <input
            id="farm-seo-title"
            type="text"
            value={seoTitle}
            onChange={(e) => onSeoTitleChange(e.target.value.slice(0, SEO_TITLE_MAX))}
            placeholder={farmName.trim() ? `leer = „${farmName.trim()} | Hofladen Radar“` : "optional"}
            maxLength={SEO_TITLE_MAX}
            className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-medium text-muted-foreground" htmlFor="farm-seo-desc">
              Kurzbeschreibung (Meta-Description)
            </label>
            <span
              className={`text-[10px] tabular-nums ${seoDescription.length > SEO_DESC_MAX ? "text-destructive" : "text-muted-foreground"}`}
            >
              {countLabel(seoDescription.length, SEO_DESC_MAX)}
            </span>
          </div>
          <textarea
            id="farm-seo-desc"
            value={seoDescription}
            onChange={(e) => onSeoDescriptionChange(e.target.value.slice(0, SEO_DESC_MAX))}
            placeholder="1–2 Sätze für Suchergebnisse"
            rows={3}
            maxLength={SEO_DESC_MAX}
            className={`mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground ${
              duplicateMetaAndBody ? "border-amber-500/60 ring-1 ring-amber-500/25" : "border-border"
            }`}
          />
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] font-medium text-muted-foreground" htmlFor="farm-seo-body">
              Text auf der öffentlichen Seite
            </label>
            <span
              className={`text-[10px] tabular-nums ${publicPageText.length > PUBLIC_PAGE_MAX ? "text-destructive" : "text-muted-foreground"}`}
            >
              {countLabel(publicPageText.length, PUBLIC_PAGE_MAX)}
            </span>
          </div>
          <textarea
            id="farm-seo-body"
            value={publicPageText}
            onChange={(e) => onPublicPageTextChange(e.target.value.slice(0, PUBLIC_PAGE_MAX))}
            placeholder="Sichtbarer Fliesstext (Klartext, keine HTML-Tags)"
            rows={6}
            maxLength={PUBLIC_PAGE_MAX}
            className={`mt-1 w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground ${
              duplicateMetaAndBody ? "border-amber-500/60 ring-1 ring-amber-500/25" : "border-border"
            }`}
          />
        </div>

        {duplicateMetaAndBody ? (
          <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-500/90">
            Meta-Beschreibung und öffentlicher Fliesstext sind identisch — für Google meist redundant. Kurze Meta
            (Snippet), längeren Text nur im unteren Feld.
          </p>
        ) : null}
      </div>
    </section>
  )
}
