import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"

const APK_PATH = "farm-app-latest.apk"
const APPS_BUCKET = "apps"

async function findFirstApkInBucket(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminServer>>,
  bucket: string,
): Promise<string | null> {
  const { data: rootItems } = await supabase.storage
    .from(bucket)
    .list("", { limit: 200, sortBy: { column: "updated_at", order: "desc" } })

  const direct = (rootItems ?? []).find((item) => item.name.toLowerCase().endsWith(".apk"))
  if (direct) return direct.name

  const folders = (rootItems ?? []).filter((item) => !item.name.toLowerCase().endsWith(".apk"))
  for (const folder of folders) {
    const { data: nested } = await supabase.storage
      .from(bucket)
      .list(folder.name, { limit: 200, sortBy: { column: "updated_at", order: "desc" } })
    const nestedApk = (nested ?? []).find((item) => item.name.toLowerCase().endsWith(".apk"))
    if (nestedApk) return `${folder.name}/${nestedApk.name}`
  }
  return null
}

async function resolveApkPath() {
  const supabase = createSupabaseAdminServer()
  if (!supabase) return { supabase: null, path: APK_PATH }

  const direct = await supabase.storage.from(APPS_BUCKET).download(APK_PATH)
  if (!direct.error && direct.data) return { supabase, path: APK_PATH, file: direct.data }

  // Backward compatibility: try to discover an APK in the same bucket (root or first-level folders).
  const fallbackInApps = await findFirstApkInBucket(supabase, APPS_BUCKET)
  if (fallbackInApps) return { supabase, path: fallbackInApps }

  // Last fallback: scan all buckets for the newest accessible APK.
  const { data: buckets } = await supabase.storage.listBuckets()
  for (const bucket of buckets ?? []) {
    const found = await findFirstApkInBucket(supabase, bucket.name)
    if (found) return { supabase, bucket: bucket.name, path: found }
  }

  // Final fallback: query Storage metadata table directly.
  const { data: objects } = await supabase
    .from("storage.objects")
    .select("bucket_id,name,updated_at")
    .ilike("name", "%.apk")
    .order("updated_at", { ascending: false })
    .limit(1)
  const latest = objects?.[0] as { bucket_id?: string; name?: string } | undefined
  if (latest?.bucket_id && latest?.name) {
    return { supabase, bucket: latest.bucket_id, path: latest.name }
  }

  return { supabase, path: APK_PATH }
}

export async function GET() {
  const resolved = await resolveApkPath()
  const supabase = resolved.supabase
  if (!supabase) return Response.json({ error: "Supabase admin client not configured" }, { status: 500 })

  const dataFromResolve = "file" in resolved ? resolved.file : null
  const bucket = "bucket" in resolved && resolved.bucket ? resolved.bucket : APPS_BUCKET
  const { data, error } = dataFromResolve
    ? { data: dataFromResolve, error: null }
    : await supabase.storage.from(bucket).download(resolved.path)
  if (error || !data) {
    return Response.json({ error: error?.message ?? "Datei nicht gefunden" }, { status: 404 })
  }

  return new Response(data, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.android.package-archive",
      "Content-Disposition": 'attachment; filename="farm-app-latest.apk"',
      "Cache-Control": "no-store",
    },
  })
}

