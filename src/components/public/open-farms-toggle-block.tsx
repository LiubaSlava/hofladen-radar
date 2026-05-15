"use client"

import { useEffect, useState } from "react"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"

type OpenFarmsCopy = {
  kicker: string
  title: string
  hint: string
  toggleAria: string
}

const OPEN_FARMS_COPY: Record<AppLocale, OpenFarmsCopy> = {
  de: {
    kicker: "Offen",
    title: "Nur geöffnete Hofläden",
    hint: "Es werden nur Höfe angezeigt, die gerade geöffnet sind.",
    toggleAria: "Nur geöffnete Hofläden anzeigen",
  },
  fr: {
    kicker: "Ouvert",
    title: "Seulement les fermes ouvertes",
    hint: "Afficher uniquement les fermes actuellement ouvertes.",
    toggleAria: "Afficher uniquement les fermes ouvertes",
  },
  it: {
    kicker: "Aperto",
    title: "Solo fattorie aperte",
    hint: "Mostra solo le fattorie attualmente aperte.",
    toggleAria: "Mostra solo fattorie aperte",
  },
  en: {
    kicker: "Open",
    title: "Open farms only",
    hint: "Show only farms that are currently open.",
    toggleAria: "Show open farms only",
  },
  uk: {
    kicker: "Відкрито",
    title: "Лише відкриті ферми",
    hint: "Показувати лише ферми, які зараз відкриті.",
    toggleAria: "Показувати лише відкриті ферми",
  },
}

type OpenFarmsToggleBlockProps = {
  onlyOpenNow: boolean
  onOnlyOpenNowChange: (value: boolean) => void
  className?: string
  compact?: boolean
}

export function OpenFarmsToggleBlock({
  onlyOpenNow,
  onOnlyOpenNowChange,
  className,
  compact,
}: OpenFarmsToggleBlockProps) {
  const [locale, setLocale] = useState<AppLocale>("de")
  const copy = OPEN_FARMS_COPY[locale]

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    return subscribeAppLocale(setLocale)
  }, [])

  return (
    <section
      className={cn(
        "hr-open-farms hr-search-promo hr-search-promo--no-orb notranslate",
        compact && "hr-search-promo--compact",
        className,
      )}
      translate="no"
    >
      <div className="hr-search-promo__glow" aria-hidden />
      <div className="hr-search-promo__inner">
        <div className="hr-search-promo__copy">
          <span className="hr-search-promo__badge font-pixel">{copy.kicker}</span>
          <h2 className="hr-search-promo__title">{copy.title}</h2>
          {!compact ? <p className="hr-search-promo__hint">{copy.hint}</p> : null}
          <div className="hr-search-promo__field hr-open-promo__toggle">
            <Switch
              checked={onlyOpenNow}
              onCheckedChange={onOnlyOpenNowChange}
              aria-label={copy.toggleAria}
              className="hr-open-farms__switch"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
