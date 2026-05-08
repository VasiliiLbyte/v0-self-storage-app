import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin/auth"

const patchSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("set_status"),
    status: z.enum(["pending", "active", "completed", "cancelled"]),
  }),
  z.object({
    action: z.literal("extend_month"),
  }),
  z.object({
    action: z.literal("reassign_box"),
    box_id: z.string().uuid(),
  }),
])

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if ("error" in admin) return admin.error

  const { id: bookingId } = await context.params
  if (!z.string().uuid().safeParse(bookingId).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: booking, error: bErr } = await admin.supabase
    .from("bookings")
    .select("id, start_date, end_date, months, final_price, box_id, status")
    .eq("id", bookingId)
    .single()

  if (bErr || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  if (parsed.data.action === "set_status") {
    const { error } = await admin.supabase
      .from("bookings")
      .update({ status: parsed.data.status })
      .eq("id", bookingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  }

  if (parsed.data.action === "extend_month") {
    const end = new Date(`${booking.end_date}T12:00:00.000Z`)
    end.setUTCMonth(end.getUTCMonth() + 1)
    const endDate = end.toISOString().slice(0, 10)

    const { data: box } = await admin.supabase
      .from("boxes")
      .select("price_month")
      .eq("id", booking.box_id)
      .single()

    const add = box?.price_month ?? 0
    const { error } = await admin.supabase
      .from("bookings")
      .update({
        end_date: endDate,
        months: (booking.months ?? 0) + 1,
        final_price: (booking.final_price ?? 0) + add,
      })
      .eq("id", bookingId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, end_date: endDate })
  }

  const newBoxId = parsed.data.box_id
  if (newBoxId === booking.box_id) {
    return NextResponse.json({ error: "Уже эта ячейка" }, { status: 400 })
  }

  const { data: newBox } = await admin.supabase
    .from("boxes")
    .select("id, in_maintenance")
    .eq("id", newBoxId)
    .single()

  if (!newBox) return NextResponse.json({ error: "Ячейка не найдена" }, { status: 404 })
  if (newBox.in_maintenance) {
    return NextResponse.json({ error: "Ячейка на обслуживании" }, { status: 400 })
  }

  const { data: conflicts } = await admin.supabase
    .from("bookings")
    .select("id")
    .eq("box_id", newBoxId)
    .neq("id", bookingId)
    .in("status", ["pending", "active"])
    .lte("start_date", booking.end_date)
    .gte("end_date", booking.start_date)

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json(
      { error: "На выбранной ячейке уже есть пересекающаяся аренда" },
      { status: 400 },
    )
  }

  const { error } = await admin.supabase.from("bookings").update({ box_id: newBoxId }).eq("id", bookingId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, box_id: newBoxId })
}
