import Link from "next/link"
import { MapPin } from "lucide-react"
import { BrandLogoMark } from "@/components/public/brand-logo-mark"

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <BrandLogoMark size="md" />
      <p className="mt-6 font-pixel text-sm uppercase tracking-wider text-primary">404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-foreground">Seite nicht gefunden</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Dieser Hofladen oder diese Seite existiert nicht oder ist noch nicht freigeschaltet.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground"
      >
        <MapPin className="h-4 w-4" aria-hidden />
        Zur Karte
      </Link>
    </div>
  )
}
