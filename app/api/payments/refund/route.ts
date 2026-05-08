import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { requireAdmin } from "@/lib/admin/auth"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { createYooKassaRefund } from "@/lib/yookassa-client"

type Body = {
  payment_id?: string
}

function clientIp(request: Request) {
  const xff = request.headers.get("x-forwarded-for")
  if (xff) return xff.split(",")[0]?.trim() ?? null
  return null
}

export async function POST(request: Request) {
  const admin = await requireAdmin()
  if ("error" in admin) return admin.error

  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.payment_id || typeof body.payment_id !== "string") {
    return NextResponse.json({ error: "Expected { payment_id: uuid }" }, { status: 400 })
  }

  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secretKey) {
    return NextResponse.json({ error: "YooKassa is not configured" }, { status: 503 })
  }

  const { data: row, error: selErr } = await admin.supabase
    .from("payments")
    .select("id, amount, status, yookassa_payment_id, user_id, booking_id")
    .eq("id", body.payment_id)
    .maybeSingle()

  if (selErr || !row) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 })
  }

  if (row.status !== "succeeded") {
    return NextResponse.json({ error: "Only succeeded payments can be refunded" }, { status: 400 })
  }

  if (!row.yookassa_payment_id) {
    return NextResponse.json({ error: "Missing YooKassa payment id" }, { status: 400 })
  }

  try {
    const refund = await createYooKassaRefund({
      shopId,
      secretKey,
      idempotenceKey: randomUUID(),
      yookassaPaymentId: row.yookassa_payment_id,
      amountRubles: row.amount,
    })

    if (refund.status && refund.status !== "succeeded" && refund.status !== "pending") {
      return NextResponse.json(
        { error: `Unexpected refund status: ${refund.status}` },
        { status: 502 },
      )
    }

    const { error: upErr } = await admin.supabase
      .from("payments")
      .update({ status: "refunded" })
      .eq("id", row.id)

    if (upErr) {
      console.error("refund: failed to update payment row", upErr)
      return NextResponse.json({ error: "Refund processed but DB update failed" }, { status: 500 })
    }

    try {
      const svc = createServiceRoleClient()
      const ip = clientIp(request)
      await svc.from("audit_log").insert({
        user_id: admin.userId,
        action: "payment.refund",
        entity: "payment",
        entity_id: row.id,
        metadata: {
          yookassa_payment_id: row.yookassa_payment_id,
          refund_id: refund.id,
          booking_id: row.booking_id,
        },
        ip,
      })
    } catch (e) {
      console.error("refund: audit_log", e)
    }

    return NextResponse.json({ ok: true, refund_id: refund.id, status: refund.status })
  } catch (e) {
    console.error("refund", e)
    const message = e instanceof Error ? e.message : "Refund failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
