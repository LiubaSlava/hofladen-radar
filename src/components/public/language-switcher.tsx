"use client"

import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { setAppLocale, type AppLocale } from "@/lib/ui-locale"

const LOCALES: Array<{ key: AppLocale; label: string }> = [
  { key: "de", label: "DE" },
  { key: "fr", label: "FR" },
  { key: "it", label: "IT" },
  { key: "en", label: "EN" },
  { key: "uk", label: "UK" },
]

interface LanguageSwitcherProps {
  value: AppLocale
  /** `bare` — без зовнішньої рамки; батько дає `rounded-2xl border bg-muted p-1` як у фільтрів. */
  variant?: "default" | "bare"
  className?: string
}

export function LanguageSwitcher({ value, variant = "default", className }: LanguageSwitcherProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-0.5",
        variant === "default" && "rounded-2xl border border-border bg-muted p-1 shadow-sm",
        variant === "bare" && "w-full min-w-0",
        className,
      )}
    >
      <Globe className="ml-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      {LOCALES.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setAppLocale(item.key)}
          className={cn(
            "rounded-xl px-2 py-1.5 text-[10px] font-semibold transition-colors",
            value === item.key
              ? "bg-accent text-primary shadow-sm"
              : "text-muted-foreground hover:bg-card/90 hover:text-foreground",
          )}
          aria-pressed={value === item.key}
          aria-label={`Switch language to ${item.label}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
