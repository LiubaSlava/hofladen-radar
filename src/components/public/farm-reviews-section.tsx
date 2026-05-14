"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Star } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Farm } from "@/lib/data"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"
import { isPersistedFarmUuid } from "@/lib/farm-id"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

const UI_TEXT: Record<
  AppLocale,
  {
    unavailable: string
    sectionTitle: string
    yourName: string
    yourNamePlaceholder: string
    emptyReviews: string
    rating: string
    outOfFive: string
    text: string
    textPlaceholder: string
    sending: string
    send: string
    enterReviewText: string
    enterName: string
    previewReviewsNote: string
  }
> = {
  de: {
    unavailable: "Bewertungen sind nicht verfügbar: NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen.",
    sectionTitle: "Nutzerbewertungen",
    yourName: "Dein Name",
    yourNamePlaceholder: "Name eingeben",
    emptyReviews: "Noch keine Bewertungen - sei der Erste!",
    previewReviewsNote:
      "Vorschau: Bewertungen sind erst verfügbar, wenn der Hof in der Datenbank gespeichert ist.",
    rating: "Bewertung",
    outOfFive: "von 5",
    text: "Text",
    textPlaceholder: "Deine Bewertung...",
    sending: "Senden...",
    send: "Senden",
    enterReviewText: "Bitte schreibe einen Bewertungstext.",
    enterName: "Bitte gib deinen Namen ein.",
  },
  fr: {
    unavailable: "Les avis sont indisponibles: configurez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    sectionTitle: "Avis utilisateurs",
    yourName: "Votre nom",
    yourNamePlaceholder: "Entrez votre nom",
    emptyReviews: "Aucun avis pour le moment - soyez le premier!",
    previewReviewsNote:
      "Aperçu: les avis seront disponibles une fois la ferme enregistrée dans la base de données.",
    rating: "Note",
    outOfFive: "sur 5",
    text: "Texte",
    textPlaceholder: "Votre avis...",
    sending: "Envoi...",
    send: "Envoyer",
    enterReviewText: "Veuillez saisir le texte de l'avis.",
    enterName: "Veuillez saisir votre nom.",
  },
  it: {
    unavailable: "Recensioni non disponibili: imposta NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    sectionTitle: "Recensioni utenti",
    yourName: "Il tuo nome",
    yourNamePlaceholder: "Inserisci il nome",
    emptyReviews: "Nessuna recensione - sii il primo!",
    previewReviewsNote:
      "Anteprima: le recensioni saranno disponibili dopo il salvataggio della fattoria nel database.",
    rating: "Valutazione",
    outOfFive: "su 5",
    text: "Testo",
    textPlaceholder: "La tua recensione...",
    sending: "Invio...",
    send: "Invia",
    enterReviewText: "Inserisci il testo della recensione.",
    enterName: "Inserisci il tuo nome.",
  },
  en: {
    unavailable: "Reviews are unavailable: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    sectionTitle: "User reviews",
    yourName: "Your name",
    yourNamePlaceholder: "Enter your name",
    emptyReviews: "No reviews yet - be the first!",
    previewReviewsNote: "Preview: reviews are available after the farm is saved to the database.",
    rating: "Rating",
    outOfFive: "out of 5",
    text: "Text",
    textPlaceholder: "Your review...",
    sending: "Sending...",
    send: "Send",
    enterReviewText: "Please enter review text.",
    enterName: "Please enter your name.",
  },
  uk: {
    unavailable: "Відгуки недоступні: задайте NEXT_PUBLIC_SUPABASE_URL і NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    sectionTitle: "Відгуки користувачів",
    yourName: "Ваше ім'я",
    yourNamePlaceholder: "Введіть ім'я",
    emptyReviews: "Поки немає відгуків - будьте першим!",
    previewReviewsNote:
      "Перегляд: відгуки з’являться після збереження ферми в базі даних.",
    rating: "Оцінка",
    outOfFive: "з 5",
    text: "Текст",
    textPlaceholder: "Ваш відгук...",
    sending: "Надсилання...",
    send: "Надіслати",
    enterReviewText: "Напишіть текст відгуку.",
    enterName: "Вкажіть ваше ім'я.",
  },
}

type ReviewRow = {
  id: string
  farm_id: string
  author_name: string
  rating: number
  /** Колонка БД `text` — текст отзыва (имя совместимо с Android). */
  text: string
  created_at: string
}

function formatReviewDate(iso: string, locale: AppLocale): string {
  try {
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}

interface FarmReviewsSectionProps {
  farm: Farm
}

export function FarmReviewsSection({ farm }: FarmReviewsSectionProps) {
  const [supabase] = useState<SupabaseClient | null>(() => getSupabaseBrowserClient())
  const [clientReady] = useState(true)
  const [reviews, setReviews] = useState<ReviewRow[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [rating, setRating] = useState(5)
  const [authorName, setAuthorName] = useState("")
  const [reviewText, setReviewText] = useState("")
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [locale, setLocale] = useState<AppLocale>("de")
  const t = UI_TEXT[locale]

  const loadReviews = useCallback(async () => {
    if (!supabase) {
      setReviews([])
      setReviewsLoading(false)
      return
    }
    if (!isPersistedFarmUuid(farm.id)) {
      setReviews([])
      setReviewsLoading(false)
      return
    }
    setReviewsLoading(true)
    const { data, error } = await supabase
      .from("reviews")
      .select('id,farm_id,author_name,rating,created_at,"text"')
      .eq("farm_id", farm.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("reviews load:", error.message)
      setReviews([])
    } else {
      setReviews((data ?? []) as ReviewRow[])
    }
    setReviewsLoading(false)
  }, [farm.id, supabase])

  useEffect(() => {
    setTimeout(() => setLocale(resolveInitialLocale()), 0)
    const unsubscribe = subscribeAppLocale(setLocale)
    return unsubscribe
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadReviews()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadReviews])

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return farm.rating
    const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
    return sum / reviews.length
  }, [reviews, farm.rating])

  const reviewCount = reviews.length

  const submitReview = async () => {
    if (!supabase) return
    if (!isPersistedFarmUuid(farm.id)) {
      setSubmitError(t.previewReviewsNote)
      return
    }
    const trimmedName = authorName.trim()
    const trimmed = reviewText.trim()
    if (!trimmedName) {
      setSubmitError(t.enterName)
      return
    }
    if (!trimmed) {
      setSubmitError(t.enterReviewText)
      return
    }
    setSubmitting(true)
    setSubmitError(null)
    const { error } = await supabase.from("reviews").insert({
      farm_id: farm.id,
      user_id: null,
      author_name: trimmedName,
      rating,
      text: trimmed,
    })
    setSubmitting(false)
    if (error) {
      setSubmitError(error.message)
      return
    }
    setAuthorName("")
    setReviewText("")
    setRating(5)
    await loadReviews()
  }

  if (!clientReady) {
    return (
      <div className="space-y-3" aria-hidden>
        <div className="flex items-center justify-between gap-2">
          <div className="h-3 w-32 animate-pulse rounded-md bg-muted/70" />
          <div className="h-3 w-14 animate-pulse rounded-md bg-muted/70" />
        </div>
        <div className="h-14 animate-pulse rounded-2xl bg-muted/50" />
        <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
      </div>
    )
  }

  if (!supabase) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
        {t.unavailable}
      </div>
    )
  }

  if (!isPersistedFarmUuid(farm.id)) {
    return (
      <>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.sectionTitle}</h3>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
            {farm.rating.toFixed(1)}
            <span className="text-muted-foreground">(0)</span>
          </span>
        </div>
        <p className="mt-3 rounded-xl border border-border/60 bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          {t.previewReviewsNote}
        </p>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.sectionTitle}</h3>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-foreground">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
          {averageRating.toFixed(1)}
          <span className="text-muted-foreground">({reviewCount})</span>
        </span>
      </div>

      <div className="mt-3 rounded-2xl border border-border bg-muted p-3">
        <div className="grid gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-foreground">{t.yourName}</p>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t.yourNamePlaceholder}
              className="rounded-xl"
            />
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-foreground">{t.rating}</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="rounded-md p-1 transition-colors hover:bg-muted"
                  aria-label={`${n} ${t.outOfFive}`}
                >
                  <Star
                    className={`h-6 w-6 ${n <= rating ? "fill-amber-400 text-amber-500" : "text-muted-foreground/40"}`}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1.5 text-xs font-medium text-foreground">{t.text}</p>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder={t.textPlaceholder}
              className="rounded-xl"
            />
          </div>
          {submitError ? <p className="text-xs text-destructive">{submitError}</p> : null}
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => void submitReview()}
              disabled={submitting}
              variant="secondary"
              className="w-full rounded-2xl border border-border bg-secondary font-semibold text-foreground shadow-sm hover:bg-secondary/90"
            >
              {submitting ? t.sending : t.send}
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {reviewsLoading ? (
          <div className="space-y-2">
            <div className="h-20 animate-pulse rounded-2xl bg-muted/50" />
            <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="rounded-2xl border border-border/40 bg-card/80 p-3 shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {review.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{review.author_name}</p>
                    <p className="text-[10px] text-muted-foreground">{formatReviewDate(review.created_at, locale)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: review.rating }).map((_, idx) => (
                    <Star key={idx} className="h-3 w-3 fill-amber-400 text-amber-500" />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{review.text}</p>
            </div>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-border/60 px-4 py-6 text-center text-xs text-muted-foreground">
            {t.emptyReviews}
          </div>
        )}
      </div>

    </>
  )
}
