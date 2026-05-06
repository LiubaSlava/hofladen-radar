"use client"

import Image from "next/image"
import { MapPin, Footprints, Award } from "lucide-react"
import type { Attraction } from "@/lib/data"

interface AttractionCardProps {
  attraction: Attraction
}

export function AttractionCard({ attraction }: AttractionCardProps) {
  return (
    <article className="overflow-hidden rounded-[28px] border border-border/70 bg-card shadow-[0_14px_28px_rgba(0,0,0,0.1)]">
      {/* Hero image */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        <Image
          src={attraction.image || "/placeholder.svg"}
          alt={attraction.name}
          fill
          sizes="(max-width: 768px) 100vw, 480px"
          className="object-cover"
        />

        {/* UNESCO badge */}
        {attraction.unesco && (
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-foreground shadow-md backdrop-blur-md">
            <Award className="h-3 w-3 text-amber-500" />
            UNESCO Welterbe
          </div>
        )}

        {/* Walking time chip */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-background/95 px-2.5 py-1 text-[11px] font-semibold text-foreground shadow-md">
          <Footprints className="h-3.5 w-3.5" />
          Zu Fuß {attraction.walkMinutes} Min
        </div>
      </div>

      {/* Body */}
      <div className="space-y-3 p-4">
        <div>
          <h4 className="text-base font-semibold leading-tight tracking-tight text-foreground">
            {attraction.name}
          </h4>
          <p className="mt-0.5 text-xs text-muted-foreground">{attraction.city}</p>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          {attraction.description}
        </p>

        {/* Mini map snippet */}
        <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-border/60">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%), repeating-linear-gradient(0deg, transparent, transparent 14px, hsl(var(--border) / 0.4) 14px, hsl(var(--border) / 0.4) 15px), repeating-linear-gradient(90deg, transparent, transparent 14px, hsl(var(--border) / 0.4) 14px, hsl(var(--border) / 0.4) 15px)",
              backgroundBlendMode: "multiply",
            }}
            aria-hidden="true"
          />
          {/* Soft "road" lines */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                "linear-gradient(105deg, transparent 30%, hsl(var(--border)) 30%, hsl(var(--border)) 32%, transparent 32%), linear-gradient(60deg, transparent 55%, hsl(var(--border)) 55%, hsl(var(--border)) 57%, transparent 57%)",
            }}
            aria-hidden="true"
          />
          {/* Pin */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
            <div className="relative">
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full bg-foreground/30 blur-sm" />
              <MapPin className="h-7 w-7 fill-red-500 text-red-600 drop-shadow-md" />
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
        >
          <Footprints className="h-4 w-4" />
          Fußweg planen
        </button>
      </div>
    </article>
  )
}
