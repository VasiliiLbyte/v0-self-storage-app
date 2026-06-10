import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Аренды",
}
import { oneRelation } from "@/lib/supabase-relations"
import { DashboardBookingsList } from "@/components/dashboard-bookings-list"
import type { DashboardBookingRow } from "@/components/dashboard-bookings-list"

export default async function DashboardBookingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `
      id,
      start_date,
      end_date,
      final_price,
      status,
      boxes (name, type, number, size_m2)
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const list = (bookings ?? []).map((b) => ({
    ...b,
    boxes: oneRelation(b.boxes),
  })) as DashboardBookingRow[]

  const activeBookings = list.filter((b) => b.status === "active" || b.status === "pending")
  const pastBookings = list.filter((b) => b.status === "completed" || b.status === "cancelled")

  const ids = list.map((b) => b.id)
  const payByBooking: Record<
    string,
    { status: string; yookassa_confirmation_url: string | null }
  > = {}

  if (ids.length > 0) {
    const { data: payments } = await supabase
      .from("payments")
      .select("booking_id, status, yookassa_confirmation_url, created_at")
      .in("booking_id", ids)
      .order("created_at", { ascending: false })

    for (const p of payments ?? []) {
      if (!payByBooking[p.booking_id]) {
        payByBooking[p.booking_id] = {
          status: p.status,
          yookassa_confirmation_url: p.yookassa_confirmation_url,
        }
      }
    }
  }

  return (
    <DashboardBookingsList
      activeBookings={activeBookings}
      pastBookings={pastBookings}
      payByBooking={payByBooking}
    />
  )
}
