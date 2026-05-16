import {
  SITE_CONTACT_EMAIL,
  SITE_CONTACT_MAILTO,
  SITE_DEVELOPER,
  SITE_MANIFEST_URL,
  SITE_MARKETING_HOST,
  SITE_MARKETING_URL,
} from "@/lib/site-credits"
import { cn } from "@/lib/utils"

const linkClass =
  "underline-offset-2 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 rounded-sm"

type RadarSiteCreditsProps = {
  className?: string
}

export function RadarSiteCredits({ className }: RadarSiteCreditsProps) {
  return (
    <div className={cn("min-w-0 text-[8px] leading-snug text-gray-500 lg:text-center lg:text-[9px]", className)}>
      <p className="flex flex-wrap items-center gap-x-1 gap-y-0 lg:justify-center">
        <span>
          Entwickelt von <span className="font-medium text-gray-600">{SITE_DEVELOPER}</span>
        </span>
        <span className="text-gray-400" aria-hidden>
          ·
        </span>
        <span>Made in Switzerland 🇨🇭</span>
      </p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-1 gap-y-0 lg:justify-center">
        <span className="font-medium text-gray-600">Kontakt</span>
        <a href={SITE_CONTACT_MAILTO} className={linkClass}>
          <span aria-hidden>✉ </span>
          {SITE_CONTACT_EMAIL}
        </a>
        <span className="text-gray-400" aria-hidden>
          ·
        </span>
        <a href={SITE_MANIFEST_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Manifest
        </a>
        <span className="text-gray-400" aria-hidden>
          ·
        </span>
        <a href={SITE_MARKETING_URL} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {SITE_MARKETING_HOST}
        </a>
      </p>
    </div>
  )
}
