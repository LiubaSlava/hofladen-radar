import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"
import { getLatestAppApkUrl } from "@/lib/app-download"

const ADMIN_AUTH_HEADER = "x-admin-auth"
const ADMIN_AUTH_VALUE = "Gloryadmin:Glory27041958"
const APK_FILENAME = "farm-app-latest.apk"
const APPS_BUCKET = "apps"

function isAdminAuthorized(request: Request): boolean {
  return request.headers.get(ADMIN_AUTH_HEADER) === ADMIN_AUTH_VALUE
}

export async function POST(request: Request) {
  if (!isAdminAuthorized(request)) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const supabase = createSupabaseAdminServer()
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const formData = await request.formData()
  const file = formData.get("file")
  if (!(file instanceof File)) return Response.json({ error: "No file provided" }, { status: 400 })
  if (!file.name.toLowerCase().endsWith(".apk")) {
    return Response.json({ error: "Only .apk files are allowed" }, { status: 400 })
  }

  const bytes = await file.arrayBuffer()
  let { error } = await supabase.storage
    .from(APPS_BUCKET)
    .upload(APK_FILENAME, Buffer.from(bytes), {
      upsert: true,
      contentType: file.type || "application/vnd.android.package-archive",
    })

  // If the bucket does not exist yet, create it once and retry.
  if (error && /bucket/i.test(error.message) && /not found|does not exist/i.test(error.message)) {
    const { error: createBucketError } = await supabase.storage.createBucket(APPS_BUCKET, { public: false })
    if (!createBucketError) {
      const retry = await supabase.storage
        .from(APPS_BUCKET)
        .upload(APK_FILENAME, Buffer.from(bytes), {
          upsert: true,
          contentType: file.type || "application/vnd.android.package-archive",
        })
      error = retry.error
    }
  }

  if (error) return Response.json({ error: error.message ?? "Upload failed" }, { status: 400 })
  return Response.json({ ok: true, url: getLatestAppApkUrl() })
}

