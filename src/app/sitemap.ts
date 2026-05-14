import type { MetadataRoute } from "next"
import { getPublicSiteOrigin } from "@/lib/site-url"
import { createSupabaseAnonServer } from "@/lib/supabase-anon-server"

/** Sitemap hits Supabase; never let a stalled network hang `next build` or the route. */
const SUPABASE_SITEMAP_MS = 12_000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error("timeout")), ms)
    promise
      .then((v) => {
        clearTimeout(id)
        resolve(v)
      })
      .catch((e) => {
        clearTimeout(id)
        reject(e)
      })
  })
}

/** Generate on request so production `next build` does not wait on Supabase. */
export const dynamic = "force-dynamic"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = getPublicSiteOrigin()
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/datenschutz`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  const supabase = createSupabaseAnonServer()
  if (!supabase) return staticEntries

  let data: { public_slug: unknown }[] | null = null
  let error: { message?: string } | null = null
  try {
    const res = await withTimeout(
      supabase.from("farms").select("public_slug").eq("status", "active"),
      SUPABASE_SITEMAP_MS
    )
    data = res.data
    error = res.error
  } catch {
    return staticEntries
  }

  if (error || !data) return staticEntries

  const farmUrls: MetadataRoute.Sitemap = []
  for (const row of data) {
    const slug = typeof row.public_slug === "string" ? row.public_slug.trim() : ""
    if (!slug) continue
    farmUrls.push({
      url: `${BASE}/hof/${encodeURIComponent(slug)}`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    })
  }

  return [...staticEntries, ...farmUrls]
}
