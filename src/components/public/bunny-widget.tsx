"use client"

import { useEffect, useMemo, useState } from "react"
import { Rabbit, X } from "lucide-react"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"

const COPY: Record<
  AppLocale,
  {
    tips: string[]
    close: string
    bunnyLabel: string
    says: string
    nextTip: string
  }
> = {
  de: {
    tips: [
      "Tanke mich mit Abenteuer.",
      "Heute frische Erdbeeren bei Hof Müller!",
      "Probier mal Käse vom Alpenhof.",
      "Sonntags hat Grünfeld geöffnet.",
    ],
    close: "Schließen",
    bunnyLabel: "Hopper, der Hase",
    says: "Hopper sagt",
    nextTip: "Nächster Tipp ->",
  },
  fr: {
    tips: [
      "Remplis-moi d'aventures.",
      "Aujourd'hui, fraises fraîches chez Hof Müller !",
      "Essaie le fromage d'Alpenhof.",
      "Le dimanche, Grünfeld est ouvert.",
    ],
    close: "Fermer",
    bunnyLabel: "Hopper, le lapin",
    says: "Hopper dit",
    nextTip: "Astuce suivante ->",
  },
  it: {
    tips: [
      "Caricami di avventura.",
      "Oggi fragole fresche da Hof Müller!",
      "Prova il formaggio dell'Alpenhof.",
      "La domenica Grünfeld e aperto.",
    ],
    close: "Chiudi",
    bunnyLabel: "Hopper, il coniglio",
    says: "Hopper dice",
    nextTip: "Prossimo consiglio ->",
  },
  en: {
    tips: [
      "Fuel me with adventure.",
      "Fresh strawberries at Hof Müller today!",
      "Try cheese from Alpenhof.",
      "Grünfeld is open on Sundays.",
    ],
    close: "Close",
    bunnyLabel: "Hopper the rabbit",
    says: "Hopper says",
    nextTip: "Next tip ->",
  },
  uk: {
    tips: [
      "Наповнюй мене пригодами.",
      "Сьогодні свіжі полуниці у Hof Müller!",
      "Спробуй сир з Alpenhof.",
      "У неділю Grünfeld відкритий.",
    ],
    close: "Закрити",
    bunnyLabel: "Хоппер, кролик",
    says: "Каже Хоппер",
    nextTip: "Наступна порада ->",
  },
}

interface BunnyWidgetProps {
  variant?: "mobile" | "desktop"
}

export function BunnyWidget({ variant = "mobile" }: BunnyWidgetProps) {
  const [open, setOpen] = useState(true)
  const [tipIndex, setTipIndex] = useState(0)
  const [locale, setLocale] = useState<AppLocale>("de")
  const t = COPY[locale]

  useEffect(() => {
    setLocale(resolveInitialLocale())
    return subscribeAppLocale(setLocale)
  }, [])

  const tips = useMemo(() => t.tips, [t.tips])
  const cycleTip = () => setTipIndex((i) => (i + 1) % tips.length)

  if (variant === "desktop") {
    return (
      <div className="pointer-events-auto fixed bottom-6 right-6 z-[60] hidden md:block">
        <div className="flex items-end gap-3">
          {open && (
            <div className="notranslate relative max-w-xs rounded-3xl border border-border/60 bg-card/80 p-4 shadow-xl backdrop-blur-xl" translate="no">
              <button
                onClick={() => setOpen(false)}
                className="absolute right-2 top-2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label={t.close}
              >
                <X className="h-3 w-3" />
              </button>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">{t.says}</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground text-pretty">{tips[tipIndex]}</p>
              <button
                onClick={cycleTip}
                className="mt-3 text-xs font-medium text-primary hover:underline"
              >
                {t.nextTip}
              </button>
              {/* Tail */}
              <div className="absolute -right-2 bottom-6 h-4 w-4 rotate-45 border-b border-r border-border/60 bg-card/80 backdrop-blur-xl" />
            </div>
          )}
          <button
            onClick={() => setOpen(true)}
            className="notranslate flex h-16 w-16 items-center justify-center rounded-full border border-border/60 bg-card/80 shadow-xl backdrop-blur-xl transition-transform hover:scale-105"
            aria-label={t.bunnyLabel}
            translate="no"
          >
            <Rabbit className="h-8 w-8 text-primary" />
          </button>
        </div>
      </div>
    )
  }

  // Mobile variant — top right
  return (
    <div className="pointer-events-auto fixed right-3 top-36 z-[60] md:hidden">
      <div className="flex flex-col items-end gap-2">
        <button
          onClick={() => setOpen(true)}
          className="notranslate flex h-12 w-12 items-center justify-center rounded-full border border-border/60 bg-card/80 shadow-lg backdrop-blur-xl"
          aria-label={t.bunnyLabel}
          translate="no"
        >
          <Rabbit className="h-6 w-6 text-primary" />
        </button>
        {open && (
          <div className="notranslate relative max-w-[220px] rounded-2xl border border-border/60 bg-card/80 p-3 shadow-lg backdrop-blur-xl" translate="no">
            <button
              onClick={() => setOpen(false)}
              className="absolute right-1.5 top-1.5 rounded-full p-1 text-muted-foreground"
              aria-label={t.close}
            >
              <X className="h-3 w-3" />
            </button>
            <p className="pr-3 text-xs leading-snug text-foreground text-pretty">{tips[tipIndex]}</p>
            <button onClick={cycleTip} className="mt-2 text-[10px] font-medium text-primary">
              {t.nextTip}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
