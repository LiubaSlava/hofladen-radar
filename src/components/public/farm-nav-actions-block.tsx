"use client"

import { cn } from "@/lib/utils"

const SECONDARY_ACTIONS = [
  { key: "contact" as const, emoji: "📇" },
  { key: "website" as const, emoji: "🌐" },
  { key: "share" as const, emoji: "📤" },
]

type FarmNavActionsBlockProps = {
  kicker: string
  title: string
  hint: string
  routeLabel: string
  actionLabels: Record<(typeof SECONDARY_ACTIONS)[number]["key"], string>
  onActionClick: (key: "route" | "contact" | "website" | "share") => void
  contactDisabled: boolean
  websiteDisabled: boolean
}

export function FarmNavActionsBlock({
  kicker,
  title,
  hint,
  routeLabel,
  actionLabels,
  onActionClick,
  contactDisabled,
  websiteDisabled,
}: FarmNavActionsBlockProps) {
  return (
    <section
      className="hr-farm-nav-cta hr-search-promo hr-search-promo--no-orb notranslate shrink-0"
      translate="no"
      aria-label={title}
    >
      <div className="hr-search-promo__glow" aria-hidden />
      <div className="hr-search-promo__inner">
        <span className="hr-search-promo__badge font-pixel">{kicker}</span>
        <h2 className="hr-search-promo__title">{title}</h2>
        <p className="hr-search-promo__hint">{hint}</p>
        <div className="hr-farm-nav-cta__actions">
          <button type="button" onClick={() => onActionClick("route")} className="hr-farm-nav-cta__btn-primary">
            🧭 {routeLabel} →
          </button>
          <div className="hr-farm-nav-cta__secondary">
            {SECONDARY_ACTIONS.map((action) => {
              const disabled =
                (action.key === "contact" && contactDisabled) || (action.key === "website" && websiteDisabled)
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={() => onActionClick(action.key)}
                  disabled={disabled}
                  className={cn(
                    "hr-farm-nav-cta__btn-secondary",
                    disabled && "disabled:cursor-not-allowed disabled:opacity-45",
                  )}
                  aria-label={actionLabels[action.key]}
                >
                  {action.emoji} {actionLabels[action.key]} →
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
