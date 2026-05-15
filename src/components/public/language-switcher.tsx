"use client"

import { cn } from "@/lib/utils"
import { setAppLocale, type AppLocale } from "@/lib/ui-locale"

type LocaleCard = {
  key: AppLocale
  badge: string
  code: string
  name: string
  note: string
}

export const LOCALE_CARDS: LocaleCard[] = [
  { key: "de", badge: "DE", code: "DE", name: "Deutsch", note: "Primär" },
  { key: "fr", badge: "FR", code: "FR", name: "Français", note: "Romandie" },
  { key: "it", badge: "IT", code: "IT", name: "Italiano", note: "Ticino" },
  { key: "en", badge: "GB", code: "EN", name: "English", note: "Tourismus" },
  { key: "uk", badge: "UA", code: "UK", name: "Українська", note: "Diaspora" },
]

export function getLocaleSummary(locale: AppLocale): string {
  const item = LOCALE_CARDS.find((entry) => entry.key === locale)
  return item ? `${item.code} · ${item.name}` : locale.toUpperCase()
}

interface LanguageSwitcherProps {
  value: AppLocale
  variant?: "default" | "bare"
  className?: string
}

export function LanguageSwitcher({ value, variant = "default", className }: LanguageSwitcherProps) {
  return (
    <div
      className={cn(
        "hr-lang-panel notranslate",
        variant === "bare" && "hr-lang-panel--bare",
        variant === "default" && "hr-lang-panel--default",
        className,
      )}
      translate="no"
      role="group"
      aria-label="Language"
    >
      <div className="hr-lang-grid">
        {LOCALE_CARDS.map((item) => {
          const selected = value === item.key
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setAppLocale(item.key)}
              className={cn("hr-lang-card", selected && "hr-lang-card--on")}
              aria-pressed={selected}
              aria-label={`Switch language to ${item.name}`}
            >
              <span className="hr-lang-card__code font-pixel">{item.code}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
