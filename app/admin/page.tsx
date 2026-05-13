import { Package, TrendingUp } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AdminDashboardCharts } from "@/components/admin-dashboard-charts"
import { cn } from "@/lib/utils"
import {
  revenueMonthOverMonth,
  occupancyByTypeReserved,
  occupancySeriesLastMonths,
  revenueByMonthSeries,
  type BookingOverlapRow,
  type BoxRow,
  type PaymentRow,
} from "@/lib/admin/metrics"
import { currentUtcMonthRange, recentUtcMonths, todayDateStringMoscow } from "@/lib/admin/time"

export default async function AdminDashboardPage() {
  const supabase = await createClient()

  const [
    { data: boxesRaw },
    { count: activeRentalsCount },
    { data: occupyingRows },
    { data: overlapBookings },
    { data: reservedBookings },
    { data: paymentsRaw },
    { count: newClientsCount },
    { data: overdueRows },
  ] = await Promise.all([
    supabase.from("boxes").select("id, type, number, in_maintenance").order("number"),
    supabase
      .from("bookings")
      .select("*", { head: true, count: "exact" })
      .eq("status", "active"),
    supabase.from("bookings").select("box_id").in("status", ["active", "pending"]),
    (() => {
      const months = recentUtcMonths(6, new Date())
      const minLast = months[0].lastDay
      const maxLast = months[months.length - 1].lastDay
      return supabase
        .from("bookings")
        .select("box_id, start_date, end_date, status")
        .lte("start_date", maxLast)
        .gte("end_date", minLast)
    })(),
    supabase
      .from("bookings")
      .select("box_id, start_date, end_date, status")
      .in("status", ["active", "pending"]),
    supabase.from("payments").select("amount, status, created_at, user_id"),
    (() => {
      const { startIso, endIso } = currentUtcMonthRange()
      return supabase
        .from("profiles")
        .select("*", { head: true, count: "exact" })
        .gte("created_at", startIso)
        .lt("created_at", endIso)
    })(),
    supabase
      .from("bookings")
      .select("id, end_date, status")
      .eq("status", "active")
      .lt("end_date", todayDateStringMoscow()),
  ])

  const boxes = (boxesRaw ?? []) as BoxRow[]
  const payments = (paymentsRaw ?? []) as PaymentRow[]
  const overlapRows = (overlapBookings ?? []) as BookingOverlapRow[]

  const { current: revenueCurrent, previous: revenuePrev, changePct } =
    revenueMonthOverMonth(payments)
  const occupancySeries = occupancySeriesLastMonths(boxes, overlapRows, 6)
  const revenueSeries = revenueByMonthSeries(payments, 6)
  const reservedRows = (reservedBookings ?? []) as BookingOverlapRow[]
  const byType = occupancyByTypeReserved(boxes, reservedRows)

  const occupyingIds = new Set(
    (occupyingRows ?? []).map((r: { box_id: string }) => r.box_id),
  )
  const maintenanceCount = boxes.filter((b) => b.in_maintenance).length
  const usableCount = boxes.length - maintenanceCount
  const occupiedCount = [...occupyingIds].filter((id) => {
    const box = boxes.find((x) => x.id === id)
    return box && !box.in_maintenance
  }).length
  const freeCount = Math.max(0, usableCount - occupiedCount)

  const overdueCount = (overdueRows ?? []).length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Дашборд</h1>
        <p className="text-sm text-muted-foreground">Сводка показателей</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Выручка (текущий / прошлый месяц, UTC)
            </CardTitle>
            <TrendingUp
              className={cn(
                "h-5 w-5 shrink-0",
                changePct >= 0 ? "text-green-600" : "text-red-600",
              )}
              aria-hidden
            />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {revenueCurrent.toLocaleString("ru-RU")} ₽
            </p>
            <p className="text-xs text-muted-foreground">
              прошлый: {revenuePrev.toLocaleString("ru-RU")} ₽ · динамика{" "}
              {changePct > 0 ? "+" : ""}
              {changePct}%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Активные аренды
            </CardTitle>
            <Package className="h-5 w-5 shrink-0 text-primary" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{activeRentalsCount ?? 0}</p>
            <p className="text-xs text-muted-foreground">статус active</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ячейки</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{boxes.length}</p>
            <p className="text-xs text-muted-foreground">
              свободно: {freeCount} · занято: {occupiedCount} · обслуживание: {maintenanceCount}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Новые клиенты (месяц, UTC)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{newClientsCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card
          className={cn(
            overdueCount > 0 && "border-destructive/30 bg-destructive/10",
          )}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Просроченные active
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold text-destructive">{overdueCount}</p>
            <p className="text-xs text-muted-foreground">end_date &lt; сегодня (МСК)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Занято по типу
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {(["XS", "S", "M", "L"] as const).map((t) => (
                <li key={t} className="flex justify-between gap-2">
                  <span>{t}</span>
                  <span className="text-muted-foreground">
                    {byType[t].occupied}/{byType[t].total} ({byType[t].pct}%)
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <AdminDashboardCharts occupancy={occupancySeries} revenue={revenueSeries} />
    </div>
  )
}
