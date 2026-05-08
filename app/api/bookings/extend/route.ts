import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"
import { createYooKassaPayment, formatRublesForYooKassa } from "@/lib/yookassa-client"
import { oneRelation } from "@/lib/supabase-relations"

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

    let body: { booking_id?: string }
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
    }

    if (!body.booking_id) {
      return NextResponse.json({ error: "booking_id required" }, { status: 400 })
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        id,
        user_id,
        status,
        end_date,
        boxes ( price_month, name, type, number )
      `,
      )
      .eq("id", body.booking_id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (booking.status !== "active") {
      return NextResponse.json(
        { error: "Продление доступно только для активной аренды" },
        { status: 400 },
      )
    }

    const box = oneRelation(booking.boxes) as {
      price_month: number
      name: string
      type: string
      number: number
    } | null

    if (!box?.price_month) {
      return NextResponse.json({ error: "Не удалось определить тариф" }, { status: 400 })
    }

    const amount = box.price_month
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
          value: formatRublesForYooKassa(amount),
          currency: "RUB",
        },
        confirmation: { type: "redirect", return_url },
        capture: true,
        description: `Продление аренды: ${box.name} (+1 мес.)`,
        metadata: {
          booking_id: body.booking_id,
          user_id: user.id,
          kind: "extension",
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
      amount,
      currency: "RUB",
      status: "pending",
      yookassa_payment_id: yk.id,
      yookassa_confirmation_url: confirmation_url,
    })

    if (insertError) {
      console.error("extend payment insert", insertError)
      return NextResponse.json({ error: "Failed to save payment" }, { status: 500 })
    }

    return NextResponse.json({ confirmation_url })
  } catch (e) {
    console.error("bookings/extend", e)
    const message = e instanceof Error ? e.message : "Internal error"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
