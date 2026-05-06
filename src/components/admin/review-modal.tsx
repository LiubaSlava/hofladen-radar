"use client"

import { useState } from "react"
import { X } from "lucide-react"
import type { AdminReview } from "@/components/admin/reviews-table"

interface ReviewModalProps {
  open: boolean
  initial: AdminReview | null
  onClose: () => void
  onSave: (patch: { id: string; author_name: string; rating: number; text: string }) => Promise<void> | void
}

export function ReviewModal({ open, initial, onClose, onSave }: ReviewModalProps) {
  const [author, setAuthor] = useState(initial?.author_name ?? "")
  const [rating, setRating] = useState(String(initial?.rating ?? 0))
  const [text, setText] = useState(initial?.text ?? "")

  if (!open || !initial) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const parsedRating = Math.max(0, Math.min(5, Math.trunc(Number(rating))))
    await onSave({ id: initial.id, author_name: author.trim(), rating: parsedRating, text: text.trim() })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative z-10 w-full max-w-xl overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">Kommentar bearbeiten</h2>
            <p className="text-xs text-muted-foreground">Review ID: {initial.id}</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="text-[10px] font-medium text-muted-foreground">author_name</label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
            <div>
              <label className="text-[10px] font-medium text-muted-foreground">rating (0-5)</label>
              <input
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                type="number"
                min={0}
                max={5}
                step={1}
                className="mt-1 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
              />
            </div>
          </div>

          <div className="mt-3">
            <label className="text-[10px] font-medium text-muted-foreground">text</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-1 h-28 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>

          <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

