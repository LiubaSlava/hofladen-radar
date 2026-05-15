"use client"

import { Mail, Shield, Smartphone } from "lucide-react"
import { EarlyAccessButton } from "@/components/public/early-access-button"
import { cn } from "@/lib/utils"

const actionClass =
  "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gray-300/80 bg-white/90 text-gray-600 shadow-sm backdrop-blur-sm transition-colors hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"

type BrandFooterActionsProps = {
  className?: string
}

export function BrandFooterActions({ className }: BrandFooterActionsProps) {
  return (
    <div className={cn("flex items-center gap-1", className)} role="group" aria-label="Service links">
      <a
        href="/datenschutz"
        target="_blank"
        rel="noopener noreferrer"
        className={actionClass}
        aria-label="Datenschutz"
        title="Datenschutz"
      >
        <Shield className="h-3.5 w-3.5" aria-hidden />
      </a>
      <button
        type="button"
        disabled
        title="Bald verfügbar"
        aria-label="Android App herunterladen"
        className={cn(actionClass, "cursor-not-allowed opacity-55 hover:border-gray-300/80 hover:text-gray-600")}
      >
        <Smartphone className="h-3.5 w-3.5" aria-hidden />
      </button>
      <EarlyAccessButton
        className={cn(actionClass, "border-gray-300/80 bg-white/90 p-0")}
        triggerContent={<Mail className="h-3.5 w-3.5" aria-hidden />}
        ariaLabel="Früher Zugang"
        title="Früher Zugang"
      />
    </div>
  )
}
