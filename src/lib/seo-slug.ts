/** Normalizes user input into a URL-safe slug segment (lowercase, hyphens). Returns null if empty. */
export function normalizePublicSlugInput(raw: string): string | null {
  const trimmed = raw.trim().toLowerCase()
  if (!trimmed) return null
  const collapsed = trimmed
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
  if (!collapsed) return null
  return collapsed.slice(0, 120)
}
