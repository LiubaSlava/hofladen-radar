import { normalizePublicSlugInput } from "@/lib/seo-slug"

/** Name + Adresse zu lateinischen Buchstaben/Ziffern (Diakritika entfernen, ß → ss). */
export function farmNameAddressToSlugSource(name: string, address: string): string {
  return [name, address]
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" ")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "")
    .replace(/ß/gi, "ss")
}

/** Vorschlag für `public_slug` aus Name und Adresse (ohne Eindeutigkeitsprüfung). */
export function suggestFarmPublicSlug(name: string, address: string): string | null {
  const raw = farmNameAddressToSlugSource(name, address)
  if (!raw.trim()) return null
  return normalizePublicSlugInput(raw)
}

function candidateSlugWithSuffix(base: string, suffixNum: number): string | null {
  if (suffixNum <= 0) return base
  const suffix = `-${suffixNum + 1}`
  const maxBase = 120 - suffix.length
  if (maxBase < 1) return normalizePublicSlugInput(String(suffixNum + 1))
  const trimmed = base.slice(0, maxBase).replace(/-+$/g, "")
  return normalizePublicSlugInput(trimmed + suffix)
}

/**
 * Wie `suggestFarmPublicSlug`, aber kollisionsfrei gegen `takenLower`
 * (bereits normalisierte Slugs in Kleinbuchstaben).
 */
export function uniqueFarmSlugFromNameAddress(
  name: string,
  address: string,
  takenLower: Set<string>,
): string | null {
  const base = suggestFarmPublicSlug(name, address)
  if (!base) return null
  for (let n = 0; n < 120; n++) {
    const slug = n === 0 ? base : candidateSlugWithSuffix(base, n)
    if (!slug) continue
    if (!takenLower.has(slug)) return slug
  }
  return null
}
