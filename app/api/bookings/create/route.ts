import { NextResponse } from "next/server"
import { randomInt } from "crypto"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { findBoxConflict } from "@/lib/booking-availability"
import {
  addDaysIso,
  computeBookingPrice,
  computeRentalEndDateIso,
  isAllowedMonths,
  todayMoscowIso,
} from "@/lib/booking-pricing"

const MAX_START_AHEAD_DAYS = 365

const bodySchema = z.object({
  box_id: z.string().uuid(),
  months: z.number().int().refine(isAllowedMonths, "months must be 1, 3, 6 or 12"),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "start_date must be YYYY-MM-DD"),
})

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
    return NextResponse.json(
      { error: "Войдите в аккаунт или подтвердите email, чтобы оформить бронь" },
      { status: 401 },
    )
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const { box_id, months, start_date } = parsed.data

  const today = todayMoscowIso()
  if (
    Number.isNaN(Date.parse(`${start_date}T00:00:00.000Z`)) ||
    start_date < today ||
    start_date > addDaysIso(today, MAX_START_AHEAD_DAYS)
  ) {
    return NextResponse.json(
      { error: "Дата начала должна быть не раньше сегодняшней и не позже чем через год" },
      { status: 400 },
    )
  }

  const { data: box, error: boxError } = await supabase
    .from("boxes")
    .select("id, price_month, in_maintenance")
    .eq("id", box_id)
    .maybeSingle()

  if (boxError) {
    console.error("bookings/create box", boxError)
    return NextResponse.json({ error: "Не удалось загрузить ячейку" }, { status: 500 })
  }
  if (!box) {
    return NextResponse.json({ error: "Ячейка не найдена" }, { status: 404 })
  }
  if (box.in_maintenance) {
    return NextResponse.json({ error: "Эта ячейка на обслуживании" }, { status: 400 })
  }

  let svc: ReturnType<typeof createServiceRoleClient>
  try {
    svc = createServiceRoleClient()
  } catch (e) {
    console.error("bookings/create service role", e)
    return NextResponse.json(
      { error: "Бронирование временно недоступно, попробуйте позже" },
      { status: 503 },
    )
  }

  const end_date = computeRentalEndDateIso(start_date, months)

  const { conflict, error: conflictError } = await findBoxConflict(svc, {
    boxId: box.id,
    userId: user.id,
    startDate: start_date,
    endDate: end_date,
  })
  if (conflictError) {
    console.error("bookings/create availability", conflictError)
    return NextResponse.json({ error: "Не удалось проверить занятость ячейки" }, { status: 500 })
  }
  if (conflict) {
    return NextResponse.json(
      { error: "Ячейка уже занята на эти даты, выберите другую" },
      { status: 409 },
    )
  }

  const price = computeBookingPrice(box.price_month, months)

  const { data: created, error: insertError } = await svc
    .from("bookings")
    .insert({
      user_id: user.id,
      box_id: box.id,
      start_date,
      end_date,
      months,
      ...price,
      access_code: String(randomInt(100000, 1000000)),
      status: "pending",
    })
    .select("id, final_price")
    .single()

  if (insertError || !created) {
    console.error("bookings/create insert", insertError)
    return NextResponse.json({ error: "Не удалось создать бронь" }, { status: 500 })
  }

  try {
    await svc.from("audit_log").insert({
      user_id: user.id,
      action: "booking.created",
      entity: "booking",
      entity_id: created.id,
      metadata: { box_id: box.id, months, start_date, ...price },
      ip: clientIp(request),
    })
  } catch (e) {
    console.error("bookings/create audit_log", e)
  }

  return NextResponse.json({ booking_id: created.id, final_price: created.final_price })
}
