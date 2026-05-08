import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

  const { error: updateError } = await supabase
    .from("bookings")
    .update({ status: "cancelled" })
    .eq("id", body.booking_id)

  if (updateError) {
    console.error("cancel booking", updateError)
    return NextResponse.json({ error: "Не удалось отменить" }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
