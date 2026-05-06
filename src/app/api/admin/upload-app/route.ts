import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"

const ADMIN_AUTH_HEADER = "x-admin-auth"
const ADMIN_AUTH_VALUE = "Gloryadmin:Glory27041958"
const APPS_BUCKET = "apps"
const APK_FILENAME = "farm-app.apk"
const BUCKET_FILE_SIZE_LIMIT = "500MB"
const APK_MIME_TYPES = [
  "application/vnd.android.package-archive",
  "application/octet-stream",
]

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
  let { error } = await supabase.storage.from(APPS_BUCKET).upload(APK_FILENAME, Buffer.from(bytes), {
    upsert: true,
    contentType: file.type || "application/vnd.android.package-archive",
  })

  if (error && /bucket/i.test(error.message) && /not found|does not exist/i.test(error.message)) {
    const created = await supabase.storage.createBucket(APPS_BUCKET, {
      public: true,
      fileSizeLimit: BUCKET_FILE_SIZE_LIMIT,
      allowedMimeTypes: APK_MIME_TYPES,
    })
    if (!created.error) {
      const retry = await supabase.storage.from(APPS_BUCKET).upload(APK_FILENAME, Buffer.from(bytes), {
        upsert: true,
        contentType: file.type || "application/vnd.android.package-archive",
      })
      error = retry.error
    }
  }

  if (error) return Response.json({ error: error.message ?? "Upload failed" }, { status: 400 })

  // Ensure direct public URL works and allow larger APK files.
  await supabase.storage.updateBucket(APPS_BUCKET, {
    public: true,
    fileSizeLimit: BUCKET_FILE_SIZE_LIMIT,
    allowedMimeTypes: APK_MIME_TYPES,
  })

  return Response.json({ ok: true })
}

