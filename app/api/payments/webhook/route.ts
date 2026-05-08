import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { getNotificationClientIp, isYooKassaNotificationIp } from "@/lib/yookassa-ip"

type NotificationPayload = {
  type?: string
  event?: string
  object?: {
    id?: string
    status?: string
    metadata?: Record<string, string>
  }
}

export async function POST(request: Request) {
  const ip = getNotificationClientIp(request)
  if (!ip || !isYooKassaNotificationIp(ip)) {
    return new NextResponse(null, { status: 403 })
  }

  let payload: NotificationPayload
  try {
    payload = await request.json()
  } catch {
    return new NextResponse(null, { status: 400 })
  }

  if (payload.type !== "notification" || !payload.event || !payload.object?.id) {
    return NextResponse.json({}, { status: 200 })
  }

  let admin: ReturnType<typeof createServiceRoleClient>
  try {
    admin = createServiceRoleClient()
  } catch (e) {
    console.error("webhook: service role client", e)
    return NextResponse.json({}, { status: 200 })
  }

  const ykPaymentId = payload.object.id
  const metadata = payload.object.metadata

  try {
    if (payload.event === "payment.succeeded") {
      const { data: payment } = await admin
        .from("payments")
        .select("id, booking_id, user_id, status, amount")
        .eq("yookassa_payment_id", ykPaymentId)
        .maybeSingle()

      if (!payment || payment.status === "succeeded") {
        return NextResponse.json({}, { status: 200 })
      }

      await admin.from("payments").update({ status: "succeeded" }).eq("id", payment.id)

      if (metadata?.kind === "extension") {
        const { data: booking } = await admin
          .from("bookings")
          .select("end_date, months, final_price")
          .eq("id", payment.booking_id)
          .single()

        if (booking) {
          const end = new Date(`${booking.end_date}T12:00:00.000Z`)
          end.setUTCMonth(end.getUTCMonth() + 1)
          const endDate = end.toISOString().slice(0, 10)
          await admin
            .from("bookings")
            .update({
              end_date: endDate,
              months: (booking.months ?? 0) + 1,
              final_price: (booking.final_price ?? 0) + payment.amount,
            })
            .eq("id", payment.booking_id)
        }
      } else {
        await admin
          .from("bookings")
          .update({ status: "active" })
          .eq("id", payment.booking_id)
      }

      await admin.from("audit_log").insert({
        user_id: payment.user_id,
        action: "payment.succeeded",
        entity: "payment",
        entity_id: payment.id,
        metadata: {
          yookassa_payment_id: ykPaymentId,
          booking_id: payment.booking_id,
          kind: metadata?.kind ?? "booking",
        },
        ip,
      })
    } else if (
      payload.event === "payment.canceled" ||
      payload.event === "payment.cancelled"
    ) {
      const { data: payment } = await admin
        .from("payments")
        .select("id, status")
        .eq("yookassa_payment_id", ykPaymentId)
        .maybeSingle()

      if (payment && payment.status === "pending") {
        await admin.from("payments").update({ status: "cancelled" }).eq("id", payment.id)
      }
    }
  } catch (e) {
    console.error("webhook handler", e)
  }

  return NextResponse.json({}, { status: 200 })
}
