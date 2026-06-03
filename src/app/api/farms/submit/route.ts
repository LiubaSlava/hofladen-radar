import { createSupabaseAdminServer } from "@/lib/supabase-admin-server"
import type { SupabaseFarmRow } from "@/lib/farms-mapper"
import { normalizeFarmPayload, toNumberSafe } from "@/lib/farm-payload"
import { FARM_TABLE_SELECT } from "@/lib/farms-table-select"
import { suggestFarmPublicSlug, uniqueFarmSlugFromNameAddress } from "@/lib/farm-slug-suggest"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  try {
    return await handleFarmSubmit(request)
  } catch (err) {
    console.error("farm submit unexpected:", err)
    return Response.json({ error: "Speichern fehlgeschlagen. Bitte später erneut versuchen." }, { status: 500 })
  }
}

async function handleFarmSubmit(request: Request) {
  const supabase = createSupabaseAdminServer()
  if (!supabase) {
    return Response.json(
      { error: "Server nicht konfiguriert (SUPABASE_SERVICE_ROLE_KEY fehlt)." },
      { status: 503 },
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return Response.json({ error: "Ungültige Anfrage." }, { status: 400 })
  }

  const submitterEmail = String(body.submitter_email ?? "").trim().toLowerCase()
  const submitterName = String(body.submitter_name ?? "").trim()
  if (!submitterName || submitterName.length < 2) {
    return Response.json({ error: "Bitte gib deinen Namen ein." }, { status: 400 })
  }
  if (!EMAIL_RE.test(submitterEmail)) {
    return Response.json({ error: "Bitte gib eine gültige E-Mail-Adresse ein." }, { status: 400 })
  }

  const payload = normalizeFarmPayload(body, true)
  if (!payload.name || payload.name.length < 2) {
    return Response.json({ error: "Bitte gib einen Namen für den Betrieb ein." }, { status: 400 })
  }
  if (!payload.address || payload.address.length < 5) {
    return Response.json({ error: "Bitte gib eine vollständige Adresse ein." }, { status: 400 })
  }
  if (!Number.isFinite(payload.latitude) || !Number.isFinite(payload.longitude)) {
    return Response.json({ error: "Bitte gib gültige Koordinaten (Breite/Länge) ein." }, { status: 400 })
  }
  if (Math.abs(payload.latitude) > 90 || Math.abs(payload.longitude) > 180) {
    return Response.json({ error: "Koordinaten liegen außerhalb des gültigen Bereichs." }, { status: 400 })
  }

  const lat = toNumberSafe(payload.latitude)
  const lng = toNumberSafe(payload.longitude)
  const inSwitzerland = lat >= 45.5 && lat <= 47.9 && lng >= 5.7 && lng <= 10.6
  if (!inSwitzerland) {
    return Response.json(
      { error: "Hofladen Radar ist für die Schweiz. Bitte prüfe Breite und Länge." },
      { status: 400 },
    )
  }

  const { data: slugRows } = await supabase.from("farms").select("public_slug")
  const takenSlugs = new Set(
    (slugRows ?? [])
      .map((row) => (typeof row.public_slug === "string" ? row.public_slug.trim().toLowerCase() : ""))
      .filter(Boolean),
  )
  const slug =
    payload.public_slug ||
    uniqueFarmSlugFromNameAddress(payload.name, payload.address ?? "", takenSlugs) ||
    suggestFarmPublicSlug(payload.name, payload.address ?? "")

  const insertRow = {
    ...payload,
    status: "pending",
    rating: 0,
    public_slug: slug,
    submitter_name: submitterName,
    submitter_email: submitterEmail,
    submitted_at: new Date().toISOString(),
  }

  const { data, error } = await supabase
    .from("farms")
    .insert(insertRow)
    .select(FARM_TABLE_SELECT)
    .single<SupabaseFarmRow>()

  if (error || !data) {
    const code = (error as { code?: string } | undefined)?.code
    const message = error?.message ?? ""
    if (code === "23505") {
      return Response.json({ error: "Ein ähnlicher Eintrag existiert bereits." }, { status: 409 })
    }
    if (message.includes("invalid input value for enum") && message.includes("pending")) {
      return Response.json(
        {
          error:
            'Datenbank: Status "pending" fehlt. Bitte die Migration in Supabase ausführen (farm_status → pending).',
        },
        { status: 400 },
      )
    }
    if (message.includes("submitter_name") || message.includes("submitter_email")) {
      return Response.json(
        {
          error:
            "Datenbank: Spalten submitter_name / submitter_email fehlen. Bitte Migration in Supabase ausführen.",
        },
        { status: 400 },
      )
    }
    console.error("farm submit:", message)
    return Response.json({ error: message || "Speichern fehlgeschlagen." }, { status: 400 })
  }

  return Response.json({ ok: true, id: data.id })
}
