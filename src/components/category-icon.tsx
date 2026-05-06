import { Milk, Egg, Beef, Apple, Carrot, Leaf } from "lucide-react"
import type { CategoryKey } from "@/lib/data"

interface CategoryIconProps {
  category: CategoryKey
  className?: string
}

function CheeseIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 14 L12 5 L21 14 L21 19 L3 19 Z" />
      <circle cx="9" cy="15.5" r="0.8" fill="currentColor" />
      <circle cx="14" cy="14" r="0.8" fill="currentColor" />
      <circle cx="16" cy="17" r="0.8" fill="currentColor" />
    </svg>
  )
}

function HoneyIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 2 L19 6 L19 14 L12 18 L5 14 L5 6 Z" />
      <path d="M9 9 L15 9" />
      <path d="M8 12 L16 12" />
      <path d="M10 15 L14 15" />
    </svg>
  )
}

export function CategoryIcon({ category, className }: CategoryIconProps) {
  const iconClass = className ?? "h-5 w-5"
  switch (category) {
    case "milch":
      return <Milk className={iconClass} />
    case "kaese":
      return <CheeseIcon className={iconClass} />
    case "eier":
      return <Egg className={iconClass} />
    case "fleisch":
      return <Beef className={iconClass} />
    case "obst":
      return <Apple className={iconClass} />
    case "honig":
      return <HoneyIcon className={iconClass} />
    case "gemuese":
      return <Carrot className={iconClass} />
    case "kraeuter":
      return <Leaf className={iconClass} />
    default:
      return null
  }
}
