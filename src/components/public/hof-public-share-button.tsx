"use client"

import { Share2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

type HofPublicShareButtonProps = {
  title: string
  address: string
  shareUrl: string
  className?: string
}

export function HofPublicShareButton({ title, address, shareUrl, className }: HofPublicShareButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title} — ${address}`, url: shareUrl })
        return
      } catch {
        // fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(`${title} — ${address}\n${shareUrl}`)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full border border-primary/20 bg-card px-4 py-2.5 text-sm font-semibold text-primary shadow-sm transition-colors hover:bg-accent",
        className,
      )}
    >
      <Share2 className="h-4 w-4" aria-hidden />
      {copied ? "Link kopiert" : "Teilen"}
    </button>
  )
}
