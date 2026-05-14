import { cn } from "@/lib/utils"
import type { CategoryKey } from "@/lib/data"

interface CategoryIconProps {
  category: CategoryKey
  className?: string
}

/** Same emoji vocabulary as HofladenRadar.com marketing / filters (product pictograms). */
const CATEGORY_EMOJI: Record<CategoryKey, string> = {
  milch: "🥛",
  kaese: "🧀",
  eier: "🥚",
  fleisch: "🥩",
  obst: "🍎",
  honig: "🍯",
  gemuese: "🥕",
  kraeuter: "🌿",
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  return (
    <span
      className={cn("inline-flex select-none items-center justify-center text-[1.05rem] leading-none", className)}
      aria-hidden
    >
      {CATEGORY_EMOJI[category]}
    </span>
  )
}
