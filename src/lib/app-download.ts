export function getLatestAppApkUrl(): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/+$/, "")
  if (!base) return "#"
  return `${base}/storage/v1/object/public/apps/farm-app.apk`
}

