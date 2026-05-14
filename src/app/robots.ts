import type { MetadataRoute } from "next"
import { getPublicSiteOrigin } from "@/lib/site-url"

export default function robots(): MetadataRoute.Robots {
  const base = getPublicSiteOrigin()
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/Glory"] }],
    sitemap: `${base}/sitemap.xml`,
  }
}
