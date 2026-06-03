import Link from "next/link"
import { MapPin } from "lucide-react"
import { BrandLogoMark } from "@/components/public/brand-logo-mark"
import { PublicFarmSubmitForm } from "@/components/public/public-farm-submit-form"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Hof oder Attraktion eintragen | Hofladen Radar",
  description:
    "Trage einen Hofladen, Bauernhof oder eine Attraktion in der Schweiz ein. Nach kurzer Prüfung erscheint der Eintrag auf der Karte.",
}

export default function EintragenPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-card/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <BrandLogoMark size="sm" priority />
            <span className="font-pixel truncate text-sm text-primary">Hofladen Radar</span>
          </Link>
          <Link
            href="/"
            className="shrink-0 rounded-full border border-primary/25 px-4 py-2 text-xs font-semibold text-primary"
          >
            Zur Karte
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <p className="font-pixel text-[11px] uppercase tracking-[0.1em] text-primary">Community</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          Hof, Laden oder Attraktion eintragen
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Fülle das Formular aus — gleiche Daten wie in unserer Verwaltung. Nach Freigabe erscheint der Ort auf der
          Karte für alle.
        </p>
        <p className="mt-2 flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
          Nur Standorte in der Schweiz. Falsche oder doppelte Einträge werden nicht veröffentlicht.
        </p>
        <div className="mt-8">
          <PublicFarmSubmitForm />
        </div>
      </main>
    </div>
  )
}
