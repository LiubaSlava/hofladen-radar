import type { Metadata } from "next"
import { SITE_ICONS } from "@/lib/site-icons"

export const metadata: Metadata = {
  title: "Datenschutz | Hofladen Radar",
  description:
    "Datenschutzerklärung von Hofladen Radar: Nutzung ohne Registrierung, minimale Datenverarbeitung, technisch notwendige Cookies und Ihre Rechte nach geltendem Datenschutzrecht.",
  icons: SITE_ICONS,
}

export default function DatenschutzPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 text-foreground">
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Datenschutz</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Wir nehmen den Schutz Ihrer personenbezogenen Daten sehr ernst. Diese Website wird im
        "Free Zone"-Modell betrieben: Die Nutzung ist ohne Registrierung und ohne Benutzerkonto
        möglich.
      </p>

      <section className="mt-6 space-y-3 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">1. Verantwortliche Stelle</h2>
        <p>
          Verantwortlich für die Datenverarbeitung auf dieser Website ist AXON CREATIVE CH.
        </p>

        <h2 className="text-base font-semibold text-foreground">2. Erhobene Daten</h2>
        <p>
          Für die reine Nutzung der Website ist keine Registrierung erforderlich. Es werden keine
          Benutzerkonten geführt. Technisch notwendige Informationen (z. B. Browsertyp,
          Zugriffszeit, Verbindungsdaten) können zur Bereitstellung der Website verarbeitet werden.
          Personenbezogene Daten werden nur in minimalem, technisch notwendigem Umfang verarbeitet.
        </p>

        <h2 className="text-base font-semibold text-foreground">3. Zweck der Verarbeitung</h2>
        <p>
          Die Verarbeitung erfolgt zur Bereitstellung der Website, zur Sicherstellung der
          Funktionalität und zur Anzeige von Hof- und Standortinformationen.
        </p>

        <h2 className="text-base font-semibold text-foreground">4. Datenquellen zu Höfen</h2>
        <p>
          Informationen zu Höfen, Läden und Standorten werden nur aus öffentlich zugänglichen
          Quellen bzw. öffentlich bereitgestellten Daten verwendet.
        </p>

        <h2 className="text-base font-semibold text-foreground">5. Speicherung und Sicherheit</h2>
        <p>
          Daten werden nur so lange gespeichert, wie es für den jeweiligen Zweck erforderlich ist
          oder gesetzliche Aufbewahrungsfristen bestehen. Wir treffen angemessene technische und
          organisatorische Maßnahmen zum Schutz Ihrer Daten.
        </p>

        <h2 className="text-base font-semibold text-foreground">6. Cookies</h2>
        <p>
          Diese Website verwendet ausschließlich technisch notwendige Cookies bzw. lokale
          Speichermechanismen, die für den Betrieb und die Darstellung der Seite erforderlich sind.
          Es erfolgt kein Tracking zu Werbezwecken.
        </p>

        <h2 className="text-base font-semibold text-foreground">7. Weitergabe an Dritte</h2>
        <p>
          Eine Weitergabe personenbezogener Daten erfolgt nur, wenn dies gesetzlich erlaubt ist,
          zur Vertragserfüllung erforderlich ist oder Sie ausdrücklich eingewilligt haben.
        </p>

        <h2 className="text-base font-semibold text-foreground">8. Ihre Rechte</h2>
        <p>
          Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung
          sowie auf Datenübertragbarkeit im Rahmen der geltenden Datenschutzgesetze.
        </p>

        <h2 className="text-base font-semibold text-foreground">9. Kontakt</h2>
        <p>
          Bei Fragen zum Datenschutz kontaktieren Sie uns bitte über die in der Website angegebenen
          Kontaktmöglichkeiten.
        </p>
      </section>
    </main>
  )
}

