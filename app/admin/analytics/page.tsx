import { createClient } from "@/lib/supabase/server"
import { AdminAnalyticsCharts } from "@/components/admin-analytics-charts"
import {
  aggregatePaymentsByPeriod,
  avgRentalDaysByBoxType,
  newClientsByPeriod,
  occupancySeriesSyntheticWeeks,
  occupancySeriesLastMonths,
  paymentsTopUsers,
  type BookingOverlapRow,
  type BoxRow,
  type PaymentRow,
  type ProfileRow,
} from "@/lib/admin/metrics"
import { recentUtcMonths } from "@/lib/admin/time"
import { oneRelation } from "@/lib/supabase-relations"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  const [{ data: paymentsRaw }, { data: profilesRaw }, { data: boxesRaw }, { data: bookingsRaw }] =
    await Promise.all([
      supabase.from("payments").select("amount, status, created_at, user_id"),
      supabase.from("profiles").select("created_at"),
      supabase.from("boxes").select("id, type, number, in_maintenance"),
      supabase.from("bookings").select("start_date, end_date, status, boxes ( type )"),
    ])

  const payments = (paymentsRaw ?? []) as PaymentRow[]
  const profiles = (profilesRaw ?? []) as ProfileRow[]
  const boxes = (boxesRaw ?? []) as BoxRow[]

  const months = recentUtcMonths(12, new Date())
  const minLast = months[0].lastDay
  const maxLast = months[months.length - 1].lastDay

  const { data: overlapBookings } = await supabase
    .from("bookings")
    .select("box_id, start_date, end_date, status")
    .lte("start_date", maxLast)
    .gte("end_date", minLast)

  const overlapRows = (overlapBookings ?? []) as BookingOverlapRow[]

  const revenueWeek = aggregatePaymentsByPeriod(payments, "week", new Date(), 12)
  const revenueMonth = aggregatePaymentsByPeriod(payments, "month", new Date(), 12)
  const occWeekSeries = occupancySeriesSyntheticWeeks(boxes, overlapRows, new Date(), 12)
  const occMonthData = occupancySeriesLastMonths(boxes, overlapRows, 12)
  const occMonthSeries = {
    labels: occMonthData.map((o) => o.month),
    totals: occMonthData.map((o) => o.occupancyPct),
  }
  const newClientsWeek = newClientsByPeriod(profiles, "week", new Date(), 12)
  const newClientsMonth = newClientsByPeriod(profiles, "month", new Date(), 12)

  const brRows =
    (bookingsRaw ?? []).map((b) => {
      const bx = oneRelation(b.boxes as { type: string } | { type: string }[] | null)
      return {
        start_date: b.start_date as string,
        end_date: b.end_date as string,
        status: b.status as string,
        type: bx?.type ?? "XS",
      }
    }) ?? []

  const avgDaysByType = avgRentalDaysByBoxType(brRows)

  const top = paymentsTopUsers(payments, 5)
  const ids = top.map((t) => t.userId)
  let topClients: { name: string; total: number }[] = []
  if (ids.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", ids)
    const nameById = new Map<string, string>()
    for (const p of profs ?? []) {
      nameById.set(p.id, [p.full_name, p.email].filter(Boolean).join(" · ") || p.id)
    }
    topClients = top.map((t) => ({
      name: nameById.get(t.userId) ?? t.userId,
      total: t.total,
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Аналитика</h1>
        <p className="text-sm text-muted-foreground">
          Недели и месяцы в UTC, кроме подписей занятости (снимок на дату).
        </p>
      </div>
      <AdminAnalyticsCharts
        revenueWeek={revenueWeek}
        revenueMonth={revenueMonth}
        occupancyWeek={occWeekSeries}
        occupancyMonth={occMonthSeries}
        newClientsWeek={newClientsWeek}
        newClientsMonth={newClientsMonth}
        topClients={topClients}
        avgDaysByType={avgDaysByType}
      />
    </div>
  )
}
