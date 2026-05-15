"use client"

import { useEffect, useState } from "react"
import type { Farm } from "@/lib/data"
import { cn } from "@/lib/utils"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"

const SHOP_KICKER: Record<AppLocale, string> = {
  de: "Laden",
  fr: "Magasin",
  it: "Negozio",
  en: "Shop",
  uk: "Магазин",
}

type VenueListCardProps = {
  farm: Farm
  selected: boolean
  onSelect: () => void
  openNowLabel: string
  closedLabel: string
}

export function VenueListCard({ farm, selected, onSelect, openNowLabel, closedLabel }: VenueListCardProps) {
  const [locale, setLocale] = useState<AppLocale>("de")

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    return subscribeAppLocale(setLocale)
  }, [])

  if (farm.category !== "shop") {
    return (
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
          selected
            ? "border-primary bg-accent"
            : "border-border bg-muted/60 hover:border-primary/25",
        )}
        aria-pressed={selected}
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-brand-mint text-lg leading-none">
          <span aria-hidden>🚜</span>
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-medium text-foreground">{farm.name}</p>
            <span className="font-pixel shrink-0 text-[10px] tabular-nums text-muted-foreground">
              {farm.distanceKm} km
            </span>
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                farm.openNow ? "bg-primary" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            <p className="truncate text-xs text-muted-foreground">
              {farm.openNow ? openNowLabel : closedLabel} · ★ {farm.rating}
            </p>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "hr-venue-shop-row group flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all",
        selected && "hr-venue-shop-row--on",
      )}
      aria-pressed={selected}
      aria-label={farm.name}
    >
      <div className="hr-venue-shop-row__icon flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg leading-none">
        <span aria-hidden>🧺</span>
      </div>
      <div className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <p className="hr-venue-shop-row__name truncate text-sm font-medium">{farm.name}</p>
          <span className="hr-venue-shop-row__km font-pixel shrink-0 text-[10px] tabular-nums">
            {farm.distanceKm} km
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2">
          <span
            className={cn(
              "h-1.5 w-1.5 shrink-0 rounded-full",
              farm.openNow ? "bg-[oklch(88%_0.12_145)]" : "bg-[oklch(100%_0_0/0.35)]",
            )}
            aria-hidden
          />
          <p className="hr-venue-shop-row__meta min-w-0 truncate text-xs">
            {farm.openNow ? openNowLabel : closedLabel} · ★ {farm.rating}
          </p>
          <span className="hr-venue-shop-row__tag font-pixel shrink-0">{SHOP_KICKER[locale]}</span>
        </div>
      </div>
    </button>
  )
}
