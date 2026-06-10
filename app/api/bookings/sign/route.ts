import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { CONTRACT_VERSION, CROSSBORDER_TRANSFER } from "@/lib/contract/contract-content"

type Body = {
  booking_id?: string
  consent_marketing?: boolean
  user_agent?: string
}

function clientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() ?? null
  return request.headers.get("x-real-ip")?.trim() ?? null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.booking_id || typeof body.booking_id !== "string") {
    return NextResponse.json({ error: "booking_id required" }, { status: 400 })
  }

  if (typeof body.consent_marketing !== "boolean") {
    return NextResponse.json({ error: "consent_marketing must be boolean" }, { status: 400 })
  }

  if (!body.user_agent || typeof body.user_agent !== "string" || !body.user_agent.trim()) {
    return NextResponse.json({ error: "user_agent required" }, { status: 400 })
  }

  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, user_id, status")
    .eq("id", body.booking_id)
    .single()

  if (fetchError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  if (booking.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (booking.status !== "pending") {
    return NextResponse.json({ error: "Booking is not pending" }, { status: 400 })
  }

  const ip = clientIp(request)

  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      signed_at: new Date().toISOString(),
      sign_ip: ip,
      sign_user_agent: body.user_agent.trim(),
      contract_version: CONTRACT_VERSION,
      consent_pdn: true,
      consent_crossborder: CROSSBORDER_TRANSFER,
      consent_marketing: body.consent_marketing,
    })
    .eq("id", body.booking_id)

  if (updateError) {
    console.error("bookings/sign update", updateError)
    return NextResponse.json({ error: "Failed to record contract signature" }, { status: 500 })
  }

  try {
    const svc = createServiceRoleClient()
    await svc.from("audit_log").insert({
      user_id: user.id,
      action: "contract.signed",
      entity: "booking",
      entity_id: body.booking_id,
      metadata: {
        contract_version: CONTRACT_VERSION,
        consent_marketing: body.consent_marketing,
      },
      ip,
    })
  } catch (e) {
    console.error("bookings/sign audit_log", e)
  }

  return NextResponse.json({ ok: true })
}
