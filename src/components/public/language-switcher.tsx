"use client"

import { Globe } from "lucide-react"
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
}

export function LanguageSwitcher({ value }: LanguageSwitcherProps) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border/70 bg-background/70 px-1 py-1">
      <Globe className="ml-1 h-3.5 w-3.5 text-muted-foreground" />
      {LOCALES.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => setAppLocale(item.key)}
          className={`rounded-full px-2 py-1 text-[10px] font-semibold transition-colors ${
            value === item.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
          aria-pressed={value === item.key}
          aria-label={`Switch language to ${item.label}`}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
