"use client"

import { useMemo, useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

type FormLocale = "de" | "en" | "it" | "uk" | "fr"

const COPY: Record<
  FormLocale,
  {
    open: string
    title: string
    subtitle: string
    language: string
    name: string
    email: string
    cancel: string
    submit: string
  }
> = {
  de: {
    open: "Früher Zugang",
    title: "Früher Zugang",
    subtitle: "Bitte kurze Anfrage senden.",
    language: "Sprache",
    name: "Name",
    email: "E-Mail",
    cancel: "Abbrechen",
    submit: "Senden",
  },
  en: {
    open: "Early access",
    title: "Early access",
    subtitle: "Please send a short request.",
    language: "Language",
    name: "Name",
    email: "Email",
    cancel: "Cancel",
    submit: "Send",
  },
  it: {
    open: "Accesso anticipato",
    title: "Accesso anticipato",
    subtitle: "Invia una breve richiesta.",
    language: "Lingua",
    name: "Nome",
    email: "Email",
    cancel: "Annulla",
    submit: "Invia",
  },
  uk: {
    open: "Ранній доступ",
    title: "Ранній доступ",
    subtitle: "Надішліть короткий запит.",
    language: "Мова",
    name: "Ім'я",
    email: "Ел. пошта",
    cancel: "Скасувати",
    submit: "Надіслати",
  },
  fr: {
    open: "Accès anticipé",
    title: "Accès anticipé",
    subtitle: "Veuillez envoyer une courte demande.",
    language: "Langue",
    name: "Nom",
    email: "E-mail",
    cancel: "Annuler",
    submit: "Envoyer",
  },
}

const TARGET_EMAIL = "axoncreative.ch@gmail.com"

interface EarlyAccessButtonProps {
  className?: string
  triggerContent?: ReactNode
  ariaLabel?: string
  title?: string
}

export function EarlyAccessButton({
  className = "",
  triggerContent,
  ariaLabel,
  title,
}: EarlyAccessButtonProps) {
  const [open, setOpen] = useState(false)
  const [locale, setLocale] = useState<FormLocale>("de")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const t = COPY[locale]

  const canSubmit = useMemo(() => name.trim().length > 0 && email.trim().length > 0, [name, email])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit) return
    const subject = encodeURIComponent(`[Early Access] ${name.trim()}`)
    const body = encodeURIComponent(
      `Name: ${name.trim()}\nEmail: ${email.trim()}\nSprache: ${locale.toUpperCase()}\n`,
    )
    window.location.href = `mailto:${TARGET_EMAIL}?subject=${subject}&body=${body}`
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={ariaLabel}
        title={title}
        className={cn(
          "inline-flex items-center justify-center gap-1 rounded-full border border-border/60 bg-background/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-border hover:bg-background/70 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
          className,
        )}
      >
        {triggerContent ?? COPY.de.open}
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative z-[81] w-full max-w-sm rounded-3xl border border-border/70 bg-card/95 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)] backdrop-blur-xl"
          >
            <h3 className="text-base font-semibold tracking-tight text-foreground">{t.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{t.subtitle}</p>

            <div className="mt-4 space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground">{t.language}</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as FormLocale)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
                <option value="it">Italiano</option>
                <option value="uk">Українська</option>
                <option value="fr">Français</option>
              </select>
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground">{t.name}</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                required
              />
            </div>

            <div className="mt-3 space-y-2">
              <label className="text-[10px] font-medium text-muted-foreground">{t.email}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
                required
              />
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-border bg-background px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-muted"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.submit}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  )
}

