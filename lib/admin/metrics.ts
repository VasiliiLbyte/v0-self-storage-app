import {
  currentUtcMonthRange,
  previousUtcMonthRange,
  recentUtcMonths,
  todayDateStringMoscow,
} from "@/lib/admin/time"

export type BoxRow = {
  id: string
  type: string
  number: number
  in_maintenance?: boolean | null
}

export type BookingOverlapRow = {
  box_id: string
  start_date: string
  end_date: string
  status: string
}

export type PaymentRow = {
  amount: number
  status: string
  created_at: string
  user_id?: string
}

export type ProfileRow = {
  created_at: string
}

export function sumSucceededPaymentsInRange(
  payments: PaymentRow[],
  startIso: string,
  endIso: string,
) {
  return payments
    .filter(
      (p) =>
        p.status === "succeeded" &&
        p.created_at >= startIso &&
        p.created_at < endIso,
    )
    .reduce((s, p) => s + p.amount, 0)
}

export function revenueMonthOverMonth(payments: PaymentRow[], now = new Date()) {
  const cur = currentUtcMonthRange(now)
  const prev = previousUtcMonthRange(now)
  const current = sumSucceededPaymentsInRange(payments, cur.startIso, cur.endIso)
  const previous = sumSucceededPaymentsInRange(payments, prev.startIso, prev.endIso)
  const changePct =
    previous === 0 ? (current > 0 ? 100 : 0) : Math.round(((current - previous) / previous) * 1000) / 10
  return { current, previous, changePct }
}

export function countNewProfilesThisUtcMonth(profiles: ProfileRow[], now = new Date()) {
  const { startIso, endIso } = currentUtcMonthRange(now)
  return profiles.filter((p) => p.created_at >= startIso && p.created_at < endIso).length
}

const OCCUPYING = new Set(["pending", "active", "completed"])

export function isBoxOccupiedOnDay(
  boxId: string,
  day: string,
  bookings: BookingOverlapRow[],
): boolean {
  return bookings.some(
    (b) =>
      b.box_id === boxId &&
      OCCUPYING.has(b.status) &&
      b.start_date <= day &&
      b.end_date >= day,
  )
}

export function occupancyRateOnDay(
  boxes: BoxRow[],
  bookings: BookingOverlapRow[],
  lastDay: string,
) {
  const usable = boxes.filter((b) => !b.in_maintenance)
  const denom = usable.length || 1
  let occ = 0
  for (const box of usable) {
    if (isBoxOccupiedOnDay(box.id, lastDay, bookings)) occ += 1
  }
  return Math.round((occ / denom) * 1000) / 10
}

export function occupancyByType(boxes: BoxRow[], bookings: BookingOverlapRow[], day: string) {
  const types = ["XS", "S", "M", "L"] as const
  const out: Record<string, { occupied: number; total: number; pct: number }> = {}
  for (const t of types) {
    const ofType = boxes.filter((b) => b.type === t && !b.in_maintenance)
    const total = ofType.length || 1
    let occupied = 0
    for (const box of ofType) {
      if (isBoxOccupiedOnDay(box.id, day, bookings)) occupied += 1
    }
    out[t] = {
      occupied,
      total: ofType.length,
      pct: ofType.length === 0 ? 0 : Math.round((occupied / total) * 1000) / 10,
    }
  }
  return out
}

/**
 * Занятые ячейки по типу так же, как карточка «Ячейки → занято»:
 * любая бронь со статусом active или pending (включая будущий start_date).
 */
export function occupancyByTypeReserved(boxes: BoxRow[], bookings: BookingOverlapRow[]) {
  const types = ["XS", "S", "M", "L"] as const
  const out: Record<string, { occupied: number; total: number; pct: number }> = {}
  for (const t of types) {
    const ofType = boxes.filter((b) => b.type === t && !b.in_maintenance)
    const total = ofType.length || 1
    let occupied = 0
    for (const box of ofType) {
      const reserved = bookings.some(
        (b) => b.box_id === box.id && (b.status === "active" || b.status === "pending"),
      )
      if (reserved) occupied += 1
    }
    out[t] = {
      occupied,
      total: ofType.length,
      pct: ofType.length === 0 ? 0 : Math.round((occupied / total) * 1000) / 10,
    }
  }
  return out
}

export function occupancySeriesLastMonths(
  boxes: BoxRow[],
  bookings: BookingOverlapRow[],
  monthCount: number,
  now = new Date(),
) {
  const months = recentUtcMonths(monthCount, now)
  return months.map(({ label, lastDay }) => ({
    month: label,
    occupancyPct: occupancyRateOnDay(boxes, bookings, lastDay),
  }))
}

export function revenueByMonthSeries(
  payments: PaymentRow[],
  monthCount: number,
  now = new Date(),
) {
  const months = recentUtcMonths(monthCount, now)
  return months.map(({ label }) => {
    const [y, m] = label.split("-").map(Number)
    const startIso = new Date(Date.UTC(y, m - 1, 1)).toISOString()
    const endIso = new Date(Date.UTC(y, m, 1)).toISOString()
    const revenue = sumSucceededPaymentsInRange(payments, startIso, endIso)
    return { month: label, revenue }
  })
}

export function overdueActiveBookings<T extends { end_date: string; status: string }>(
  rows: T[],
) {
  const today = todayDateStringMoscow()
  return rows.filter((b) => b.status === "active" && b.end_date < today)
}

export function paymentsTopUsers(
  payments: PaymentRow[],
  limit: number,
): { userId: string; total: number }[] {
  const map = new Map<string, number>()
  for (const p of payments) {
    if (p.status !== "succeeded" || !p.user_id) continue
    map.set(p.user_id, (map.get(p.user_id) ?? 0) + p.amount)
  }
  return [...map.entries()]
    .map(([userId, total]) => ({ userId, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
}

export function avgRentalDaysByBoxType(
  rows: { type: string; start_date: string; end_date: string; status: string }[],
) {
  const types = ["XS", "S", "M", "L"] as const
  const out: Record<string, number | null> = {}
  for (const t of types) {
    const subset = rows.filter(
      (r) => r.type === t && (r.status === "completed" || r.status === "active"),
    )
    if (subset.length === 0) {
      out[t] = null
      continue
    }
    let sum = 0
    for (const r of subset) {
      const a = new Date(r.start_date).getTime()
      const b = new Date(r.end_date).getTime()
      sum += Math.max(0, Math.round((b - a) / (86400 * 1000)))
    }
    out[t] = Math.round((sum / subset.length) * 10) / 10
  }
  return out
}

export function aggregatePaymentsByPeriod(
  payments: PaymentRow[],
  granularity: "week" | "month",
  now = new Date(),
  count = 12,
) {
  const succeeded = payments.filter((p) => p.status === "succeeded")
  const labels: string[] = []
  const totals: number[] = []

  if (granularity === "month") {
    const months = recentUtcMonths(count, now)
    for (const { label } of months) {
      const [y, m] = label.split("-").map(Number)
      const startIso = new Date(Date.UTC(y, m - 1, 1)).toISOString()
      const endIso = new Date(Date.UTC(y, m, 1)).toISOString()
      labels.push(label)
      totals.push(sumSucceededPaymentsInRange(succeeded, startIso, endIso))
    }
    return { labels, totals }
  }

  // week: last `count` weeks, ISO week label simplified as period end date
  for (let i = count - 1; i >= 0; i--) {
    const end = new Date(now)
    end.setUTCDate(end.getUTCDate() - i * 7)
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    const startIso = start.toISOString().slice(0, 10) + "T00:00:00.000Z"
    const endNext = new Date(end)
    endNext.setUTCDate(endNext.getUTCDate() + 1)
    const endIso = endNext.toISOString().slice(0, 10) + "T00:00:00.000Z"
    labels.push(end.toISOString().slice(0, 10))
    totals.push(sumSucceededPaymentsInRange(succeeded, startIso, endIso))
  }
  return { labels, totals }
}

export function newClientsByPeriod(
  profiles: ProfileRow[],
  granularity: "week" | "month",
  now = new Date(),
  count = 12,
) {
  const labels: string[] = []
  const totals: number[] = []

  if (granularity === "month") {
    const months = recentUtcMonths(count, now)
    for (const { label } of months) {
      const [y, m] = label.split("-").map(Number)
      const startIso = new Date(Date.UTC(y, m - 1, 1)).toISOString()
      const endIso = new Date(Date.UTC(y, m, 1)).toISOString()
      labels.push(label)
      totals.push(profiles.filter((p) => p.created_at >= startIso && p.created_at < endIso).length)
    }
    return { labels, totals }
  }

  for (let i = count - 1; i >= 0; i--) {
    const end = new Date(now)
    end.setUTCDate(end.getUTCDate() - i * 7)
    const start = new Date(end)
    start.setUTCDate(start.getUTCDate() - 6)
    const startIso = start.toISOString()
    const endNext = new Date(end)
    endNext.setUTCDate(endNext.getUTCDate() + 1)
    const endIso = endNext.toISOString()
    labels.push(end.toISOString().slice(0, 10))
    totals.push(profiles.filter((p) => p.created_at >= startIso && p.created_at < endIso).length)
  }
  return { labels, totals }
}

export function occupancySeriesSyntheticWeeks(
  boxes: BoxRow[],
  bookings: BookingOverlapRow[],
  now = new Date(),
  count = 12,
) {
  const labels: string[] = []
  const totals: number[] = []
  for (let i = count - 1; i >= 0; i--) {
    const end = new Date(now)
    end.setUTCDate(end.getUTCDate() - i * 7)
    const day = end.toISOString().slice(0, 10)
    labels.push(day)
    totals.push(occupancyRateOnDay(boxes, bookings, day))
  }
  return { labels, totals }
}
