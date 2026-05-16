"use client"

import dynamic from "next/dynamic"
import type { Farm } from "@/lib/data"

const FarmReviewsSection = dynamic(
  () => import("@/components/public/farm-reviews-section").then((mod) => mod.FarmReviewsSection),
  {
    ssr: false,
    loading: () => (
      <div
        className="overflow-hidden rounded-2xl border border-border bg-muted/30 p-6"
        aria-busy="true"
        aria-live="polite"
      >
        <div className="h-3.5 w-40 animate-pulse rounded bg-muted-foreground/15" />
        <div className="mt-4 h-44 animate-pulse rounded-2xl bg-muted-foreground/10" />
        <div className="mt-2 h-16 animate-pulse rounded-xl bg-muted-foreground/10" />
      </div>
    ),
  },
)

type HofPublicReviewsLazyProps = {
  farm: Farm
}

export function HofPublicReviewsLazy({ farm }: HofPublicReviewsLazyProps) {
  return <FarmReviewsSection farm={farm} />
}
