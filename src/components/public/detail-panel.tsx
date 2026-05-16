"use client"

import dynamic from "next/dynamic"
import { useEffect } from "react"
import { X } from "lucide-react"
import type { Farm } from "@/lib/data"

const FarmDetailCard = dynamic(
  () => import("@/components/public/farm-detail-card").then((mod) => mod.FarmDetailCard),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3 p-1" aria-busy="true" aria-live="polite">
        <div className="h-44 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-24 animate-pulse rounded-2xl bg-muted/40" />
        <div className="h-36 animate-pulse rounded-2xl bg-muted/40" />
        <p className="text-center text-xs text-muted-foreground">Details werden geladen…</p>
      </div>
    ),
  },
)

interface DetailPanelProps {
  farm: Farm | null
  allPoints: Farm[]
  onClose: () => void
  onSelectPoint?: (id: string) => void
}

export function DetailPanel({ farm, allPoints, onClose, onSelectPoint }: DetailPanelProps) {
  // Lock body scroll on mobile when sheet is open
  useEffect(() => {
    if (!farm) return
    const original = document.body.style.overflow
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = original
    }
  }, [farm])

  // Esc to close
  useEffect(() => {
    if (!farm) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [farm, onClose])

  if (!farm) return null

  return (
    <>
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Schließen"
        onClick={onClose}
        className="pointer-events-auto fixed inset-0 z-40 bg-foreground/25 backdrop-blur-sm lg:hidden"
      />

      {/* Mobile bottom sheet */}
      <aside
        role="dialog"
        aria-label={`Details: ${farm.name}`}
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-3xl border-t border-border bg-card shadow-[0_-12px_48px_rgba(13,61,40,0.1)] backdrop-blur-2xl lg:hidden"
      >
        <div className="flex items-center justify-end px-3 pb-1 pt-1">
          <button
            type="button"
            onClick={onClose}
            aria-label="Details schließen"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground transition-colors hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="hr-scroll-pane no-scrollbar max-h-[calc(88vh-3rem)] overflow-y-auto px-3 pb-10 pt-0">
          <FarmDetailCard farm={farm} allPoints={allPoints} onSelectPoint={onSelectPoint} />
        </div>
      </aside>

      {/* Desktop right-side drawer */}
      <aside
        role="dialog"
        aria-label={`Details: ${farm.name}`}
        className="pointer-events-auto fixed right-4 top-4 z-40 hidden h-[calc(100vh-2rem)] w-[420px] flex-col overflow-hidden rounded-3xl border border-border bg-card/95 shadow-[0_14px_44px_rgba(13,61,40,0.12)] backdrop-blur-2xl lg:flex"
      >
        <div className="flex items-center justify-between border-b border-border/50 px-5 py-3.5">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">Hofladen-Details</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Details schließen"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-background/60 text-foreground transition-colors hover:bg-background"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="hr-scroll-pane no-scrollbar flex-1 overflow-y-auto px-4 pb-10 pt-4">
          <FarmDetailCard farm={farm} allPoints={allPoints} onSelectPoint={onSelectPoint} />
        </div>
      </aside>
    </>
  )
}
