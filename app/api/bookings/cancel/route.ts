import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { booking_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.booking_id) {
    return NextResponse.json({ error: "booking_id required" }, { status: 400 })
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

  if (booking.status !== "pending" && booking.status !== "active") {
    return NextResponse.json({ error: "Нельзя отменить эту аренду" }, { status: 400 })
  }

  let svc: ReturnType<typeof createServiceRoleClient>
  try {
    svc = createServiceRoleClient()
  } catch (e) {
    console.error("cancel booking service role", e)
    return NextResponse.json({ error: "Отмена временно недоступна" }, { status: 503 })
  }

  const { error: updateError } = await svc
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", body.booking_id)
    .eq("user_id", user.id)
    .in("status", ["pending", "active"])

  if (updateError) {
    console.error("cancel booking", updateError)
    return NextResponse.json({ error: "Не удалось отменить" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
