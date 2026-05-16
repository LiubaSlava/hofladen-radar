"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import type { SupabaseClient } from "@supabase/supabase-js"
import { Star } from "lucide-react"
import { getSupabaseBrowserClient } from "@/lib/supabase-browser"
import type { Farm } from "@/lib/data"
import { resolveInitialLocale, subscribeAppLocale, type AppLocale } from "@/lib/ui-locale"
import { isPersistedFarmUuid } from "@/lib/farm-id"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

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
    cardTagline: string
    cardFooter: string
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
    cardTagline: "Stimmen von Besucher:innen.",
    cardFooter: "Ehrlich • Öffentlich • Für alle sichtbar",
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
    cardTagline: "La voix des visiteurs.",
    cardFooter: "Honnête • Public • Visible par tous",
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
    cardTagline: "Voci di chi ci visita.",
    cardFooter: "Onesto • Pubblico • Visibile a tutti",
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
    cardTagline: "Voices from visitors.",
    cardFooter: "Honest • Public • Visible to everyone",
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
    cardTagline: "Голос відвідувачів.",
    cardFooter: "Чесно • Публічно • Бачать усі",
  },
}

type ReviewRow = {
  id: string
  farm_id: string
  author_name: string
  rating: number
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

function ReviewFarmCardShell({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("hr-review-farm-card notranslate", className)} translate="no">
      <div className="hr-review-farm-card__glow hr-review-farm-card__glow--tr" aria-hidden />
      <div className="hr-review-farm-card__glow hr-review-farm-card__glow--bl" aria-hidden />
      <div className="hr-review-farm-card__inner">{children}</div>
    </div>
  )
}

function ReviewsSectionSkeleton() {
  return (
    <ReviewFarmCardShell>
      <div className="h-40 animate-pulse rounded-2xl bg-[oklch(100%_0_0/0.08)]" aria-busy="true" />
    </ReviewFarmCardShell>
  )
}

function ReviewFarmCardHeader({
  farmName,
  averageRating,
  reviewCount,
  sectionTitle,
  tagline,
}: {
  farmName: string
  averageRating: number
  reviewCount: number
  sectionTitle: string
  tagline: string
}) {
  const filledStars = Math.max(0, Math.min(5, Math.round(averageRating)))

  return (
    <>
      <span className="hr-review-farm-card__badge font-pixel">✨ {sectionTitle}</span>
      <div className="hr-review-farm-card__score">
        <span className="hr-review-farm-card__score-prefix" aria-hidden>
          ★
        </span>
        <span className="hr-review-farm-card__score-value font-pixel tabular-nums">{averageRating.toFixed(1)}</span>
        <span className="hr-review-farm-card__score-suffix">
          / 5 · <span className="font-pixel tabular-nums">({reviewCount})</span>
        </span>
      </div>
      <p className="hr-review-farm-card__title">{farmName}</p>
      <p className="mt-1 text-center text-[11px] font-medium text-[oklch(92%_0.02_140/0.82)]">{tagline}</p>
      <div className="hr-review-farm-card__stars-pill" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <span key={i}>{i < filledStars ? "⭐" : "☆"}</span>
        ))}
      </div>
    </>
  )
}

interface FarmReviewsSectionProps {
  farm: Farm
}

export function FarmReviewsSection({ farm }: FarmReviewsSectionProps) {
  const [mounted, setMounted] = useState(false)
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null)
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
    setSupabase(getSupabaseBrowserClient())
    setLocale(resolveInitialLocale())
    const unsubscribe = subscribeAppLocale(setLocale)
    setMounted(true)
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!mounted) return
    void loadReviews()
  }, [loadReviews, mounted])

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

  if (!mounted) {
    return <ReviewsSectionSkeleton />
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
      <ReviewFarmCardShell>
        <ReviewFarmCardHeader
          farmName={farm.name}
          averageRating={farm.rating}
          reviewCount={0}
          sectionTitle={t.sectionTitle}
          tagline={t.cardTagline}
        />
        <p className="hr-review-farm-card__footer mt-4">{t.previewReviewsNote}</p>
      </ReviewFarmCardShell>
    )
  }

  return (
    <>
      <ReviewFarmCardShell>
        <ReviewFarmCardHeader
          farmName={farm.name}
          averageRating={averageRating}
          reviewCount={reviewCount}
          sectionTitle={t.sectionTitle}
          tagline={t.cardTagline}
        />

        <div className="hr-review-farm-card__form">
          <div>
            <p className="hr-review-farm-card__label">{t.yourName}</p>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder={t.yourNamePlaceholder}
              className="hr-review-farm-card__input"
            />
          </div>
          <div>
            <p className="hr-review-farm-card__label">{t.rating}</p>
            <div className="flex justify-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRating(n)}
                  className="hr-review-farm-card__star-btn"
                  aria-label={`${n} ${t.outOfFive}`}
                >
                  <Star
                    className={cn(
                      "h-6 w-6",
                      n <= rating ? "fill-amber-300 text-amber-200" : "text-[oklch(100%_0_0/0.35)]",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="hr-review-farm-card__label">{t.text}</p>
            <Textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={4}
              placeholder={t.textPlaceholder}
              className="hr-review-farm-card__textarea"
            />
          </div>
          {submitError ? <p className="hr-review-farm-card__error">{submitError}</p> : null}
          <button
            type="button"
            onClick={() => void submitReview()}
            disabled={submitting}
            className="hr-review-farm-card__cta"
          >
            → {submitting ? t.sending : t.send}
          </button>
        </div>
        <p className="hr-review-farm-card__footer">{t.cardFooter}</p>
      </ReviewFarmCardShell>

      <div className="mt-3 space-y-2">
        {reviewsLoading ? (
          <div className="space-y-2">
            <div className="h-20 animate-pulse rounded-2xl bg-muted/50" />
            <div className="h-20 animate-pulse rounded-2xl bg-muted/40" />
          </div>
        ) : reviews.length > 0 ? (
          reviews.map((review) => (
            <div key={review.id} className="hr-review-item">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {review.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{review.author_name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {formatReviewDate(review.created_at, locale)}
                    </p>
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
