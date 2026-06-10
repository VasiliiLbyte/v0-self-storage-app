import { NextResponse } from "next/server"
import { buildContractData } from "@/lib/contract/build-contract-data"
import { CONTRACT_VERSION } from "@/lib/contract/contract-content"
import { generateContractPdf } from "@/lib/contract/generate-contract"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { oneRelation } from "@/lib/supabase-relations"
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

        try {
          const { data: existingDoc } = await admin
            .from("documents")
            .select("id")
            .eq("booking_id", payment.booking_id)
            .eq("type", "contract")
            .maybeSingle()

          if (!existingDoc) {
            const { data: booking } = await admin
              .from("bookings")
              .select(
                `
                id,
                user_id,
                start_date,
                end_date,
                months,
                final_price,
                access_code,
                signed_at,
                sign_ip,
                sign_user_agent,
                contract_version,
                consent_crossborder,
                consent_marketing,
                profiles ( full_name, phone, email ),
                boxes ( name, number, size_m2 )
              `,
              )
              .eq("id", payment.booking_id)
              .single()

            if (booking) {
              const profile = oneRelation(
                booking.profiles as
                  | { full_name: string | null; phone: string | null; email: string | null }
                  | { full_name: string | null; phone: string | null; email: string | null }[]
                  | null,
              )
              const box = oneRelation(
                booking.boxes as
                  | { name: string; number: number; size_m2: number }
                  | { name: string; number: number; size_m2: number }[]
                  | null,
              )
              const data = buildContractData({
                id: booking.id,
                start_date: booking.start_date,
                end_date: booking.end_date,
                months: booking.months,
                final_price: booking.final_price,
                access_code: booking.access_code,
                signed_at: booking.signed_at,
                sign_ip: booking.sign_ip,
                sign_user_agent: booking.sign_user_agent,
                consent_crossborder: booking.consent_crossborder,
                consent_marketing: booking.consent_marketing,
                profiles: profile,
                boxes: box,
              })
              const { buffer, sha256 } = await generateContractPdf(data)

              const storagePath = `${payment.user_id}/${payment.booking_id}/contract.pdf`
              const { error: uploadErr } = await admin.storage
                .from("documents")
                .upload(storagePath, buffer, {
                  contentType: "application/pdf",
                  upsert: true,
                })

              if (!uploadErr) {
                await admin.from("documents").insert({
                  booking_id: payment.booking_id,
                  user_id: payment.user_id,
                  type: "contract",
                  url: storagePath,
                  sha256,
                })
                await admin
                  .from("bookings")
                  .update({ contract_url: storagePath })
                  .eq("id", payment.booking_id)

                await admin.from("audit_log").insert({
                  user_id: payment.user_id,
                  action: "contract.generated",
                  entity: "booking",
                  entity_id: payment.booking_id,
                  metadata: {
                    sha256,
                    contract_version: booking.contract_version ?? CONTRACT_VERSION,
                  },
                  ip,
                })
              } else {
                console.error("webhook: contract upload", uploadErr)
              }
            }
          }
        } catch (e) {
          console.error("webhook: contract generation", e)
        }
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
