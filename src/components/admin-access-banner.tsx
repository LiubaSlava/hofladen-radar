"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

interface AdminAccessBannerProps {
  message: string
  autoHideMs?: number
}

export function AdminAccessBanner({ message, autoHideMs = 5000 }: AdminAccessBannerProps) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => setVisible(false), autoHideMs)
    return () => window.clearTimeout(timeoutId)
  }, [autoHideMs])

  if (!visible) return null

  return (
    <div className="fixed left-1/2 top-4 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-900 shadow-md">
      <span>{message}</span>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="rounded-full p-0.5 text-amber-900/70 transition-colors hover:bg-amber-100 hover:text-amber-950"
        aria-label="Закрыть уведомление"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
