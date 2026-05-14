import type { MetadataRoute } from "next"
import { getPublicSiteOrigin } from "@/lib/site-url"
import { createSupabaseAnonServer } from "@/lib/supabase-anon-server"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const BASE = getPublicSiteOrigin()
  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/datenschutz`, lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ]

  const supabase = createSupabaseAnonServer()
  if (!supabase) return staticEntries

  const { data, error } = await supabase.from("farms").select("public_slug").eq("status", "active")
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
