import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { oneRelation } from "@/lib/supabase-relations"
import { createYooKassaPayment, formatRublesForYooKassa } from "@/lib/yookassa-client"

type CreateBody = {
  booking_id?: string
  amount?: number
  description?: string
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let body: CreateBody
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    if (
      !body.booking_id ||
      typeof body.amount !== "number" ||
      !body.description ||
      typeof body.description !== "string"
    ) {
      return NextResponse.json(
        { error: "Expected { booking_id, amount, description }" },
        { status: 400 },
      )
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        user_id,
        final_price,
        status,
        boxes ( in_maintenance )
      `,
      )
      .eq("id", body.booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const boxRow = oneRelation(
      booking.boxes as { in_maintenance?: boolean } | { in_maintenance?: boolean }[] | null,
    )
    const inMaint = boxRow?.in_maintenance
    if (inMaint) {
      return NextResponse.json(
        { error: "Эта ячейка на обслуживании, оплата недоступна" },
        { status: 400 },
      )
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (booking.status !== "pending") {
      return NextResponse.json({ error: "Booking is not payable" }, { status: 400 })
    }

    if (booking.final_price !== body.amount) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 })
    }

    const shopId = process.env.YOOKASSA_SHOP_ID
    const secretKey = process.env.YOOKASSA_SECRET_KEY
    const appUrl = process.env.NEXT_PUBLIC_APP_URL

    if (!shopId || !secretKey || !appUrl) {
      return NextResponse.json(
        { error: "Payment provider is not configured" },
        { status: 503 },
      )
    }

    const paymentId = randomUUID()
    const baseUrl = appUrl.replace(/\/$/, "")
    const return_url = `${baseUrl}/booking/success?payment_id=${paymentId}`

    const yk = await createYooKassaPayment({
      shopId,
      secretKey,
      idempotenceKey: randomUUID(),
      body: {
        amount: {
          value: formatRublesForYooKassa(body.amount),
          currency: "RUB",
        },
        confirmation: { type: "redirect", return_url },
        capture: true,
        description: body.description,
        metadata: {
          booking_id: body.booking_id,
          user_id: user.id,
        },
      },
    })

    const confirmation_url = yk.confirmation?.confirmation_url
    if (!confirmation_url) {
      return NextResponse.json(
        { error: "No confirmation URL from payment provider" },
        { status: 502 },
      )
    }

    const { error: insertError } = await supabase.from("payments").insert({
      id: paymentId,
      booking_id: body.booking_id,
      user_id: user.id,
      amount: body.amount,
      currency: "RUB",
      status: "pending",
      yookassa_payment_id: yk.id,
      yookassa_confirmation_url: confirmation_url,
    })

    if (insertError) {
      console.error("payments insert", insertError)
      return NextResponse.json({ error: "Failed to save payment" }, { status: 500 })
    }

    return NextResponse.json({ confirmation_url })
  } catch (e) {
    console.error("payments/create", e)
    const message = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
