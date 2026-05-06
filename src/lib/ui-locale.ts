"use client"

export type AppLocale = "de" | "fr" | "it" | "en" | "uk"

const DEFAULT_LOCALE: AppLocale = "de"
const LOCALE_STORAGE_KEY = "hofladen.ui-locale"
const LOCALE_EVENT = "hofladen:locale-change"

function isLocale(value: string): value is AppLocale {
  return value === "de" || value === "fr" || value === "it" || value === "en" || value === "uk"
}

export function resolveInitialLocale(): AppLocale {
  if (typeof window === "undefined") return DEFAULT_LOCALE
  const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (stored && isLocale(stored)) return stored
  const short = window.navigator.language.toLowerCase().slice(0, 2)
  return isLocale(short) ? short : DEFAULT_LOCALE
}

export function setAppLocale(locale: AppLocale) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  window.dispatchEvent(new CustomEvent<AppLocale>(LOCALE_EVENT, { detail: locale }))
}

export function subscribeAppLocale(onChange: (locale: AppLocale) => void): () => void {
  if (typeof window === "undefined") return () => {}
  const handler = (event: Event) => {
    const next = (event as CustomEvent<AppLocale>).detail
    if (isLocale(next)) onChange(next)
  }
  window.addEventListener(LOCALE_EVENT, handler as EventListener)
  return () => window.removeEventListener(LOCALE_EVENT, handler as EventListener)
}
