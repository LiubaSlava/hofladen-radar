"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import { HopperRabbitFace } from "@/components/graphics/hopper-rabbit-face"
import { cn } from "@/lib/utils"
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
    nextTip: "Nächster Tipp →",
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
    nextTip: "Astuce suivante →",
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
    nextTip: "Prossimo consiglio →",
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
    nextTip: "Next tip →",
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
    nextTip: "Наступна порада →",
  },
}

interface HopperAvatarProps {
  onClick: () => void
  label: string
  size: "md" | "lg"
}

function HopperAvatar({ onClick, label, size }: HopperAvatarProps) {
  const lg = size === "lg"
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "notranslate group relative z-10 shrink-0 overflow-hidden rounded-full border border-border/80 bg-card p-[3px] shadow-md ring-1 ring-primary/[0.06] transition-transform hover:scale-[1.02] active:scale-[0.98]",
        lg ? "h-16 w-16" : "h-12 w-12",
      )}
      aria-label={label}
      translate="no"
    >
      <HopperRabbitFace className="h-full w-full transition-transform group-hover:scale-[1.04]" />
    </button>
  )
}

interface SpeechBubbleProps {
  tip: string
  says: string
  close: string
  nextTip: string
  onClose: () => void
  onNext: () => void
  tail: "right" | "bottom"
  className?: string
}

function SpeechBubble({ tip, says, close, nextTip, onClose, onNext, tail, className }: SpeechBubbleProps) {
  return (
    <div className={cn("notranslate relative", className)} translate="no">
      <div className="hr-surface hr-surface-solid overflow-hidden shadow-[var(--shadow-soft)] ring-1 ring-primary/[0.06]">
        <div className="hr-hopper-bubble__head flex items-center justify-between gap-2 border-b px-3 py-2">
          <span className="hr-hopper-bubble__says font-pixel text-[11px] leading-none">{says}</span>
          <button
            type="button"
            onClick={onClose}
            className="hr-hopper-bubble__close rounded-lg p-1.5 transition-colors"
            aria-label={close}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="relative p-3">
          <div className="rounded-xl border border-border/50 bg-muted/50 px-3 py-2.5">
            <p className="text-sm leading-relaxed text-foreground text-pretty">{tip}</p>
          </div>
          <button
            type="button"
            onClick={onNext}
            className="mt-2.5 text-left text-xs font-semibold text-primary underline-offset-2 hover:underline"
          >
            {nextTip}
          </button>
        </div>
      </div>

      {tail === "right" ? (
        <div
          aria-hidden
          className="absolute -right-2 bottom-7 z-0 h-3.5 w-3.5 rotate-45 border border-border bg-card shadow-sm"
        />
      ) : (
        <div
          aria-hidden
          className="absolute -bottom-2 right-8 z-0 h-3.5 w-3.5 rotate-45 border border-border bg-card shadow-sm"
        />
      )}
    </div>
  )
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
        <div className="flex flex-row-reverse items-end gap-2">
          <HopperAvatar size="lg" label={t.bunnyLabel} onClick={() => setOpen(true)} />
          {open ? (
            <SpeechBubble
              className="max-w-xs min-w-[240px]"
              tip={tips[tipIndex]}
              says={t.says}
              close={t.close}
              nextTip={t.nextTip}
              onClose={() => setOpen(false)}
              onNext={cycleTip}
              tail="right"
            />
          ) : null}
        </div>
      </div>
    )
  }

  return (
    <div className="pointer-events-auto fixed right-3 top-36 z-[60] md:hidden">
      <div className="flex max-w-[min(280px,calc(100vw-1.5rem))] flex-col items-end gap-2">
        {open ? (
          <SpeechBubble
            className="w-full"
            tip={tips[tipIndex]}
            says={t.says}
            close={t.close}
            nextTip={t.nextTip}
            onClose={() => setOpen(false)}
            onNext={cycleTip}
            tail="bottom"
          />
        ) : null}
        <HopperAvatar size="md" label={t.bunnyLabel} onClick={() => setOpen(true)} />
      </div>
    </div>
  )
}
