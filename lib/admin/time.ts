/** Даты «сегодня» для сравнения с полями DATE — по календарю Europe/Moscow. */
export const ADMIN_TIME_ZONE = "Europe/Moscow"

export function todayDateStringMoscow(d = new Date()): string {
  return d.toLocaleDateString("en-CA", { timeZone: ADMIN_TIME_ZONE })
}

/** Границы календарного месяца по UTC (KPI по `created_at`). */
export function utcMonthRange(year: number, monthIndex0: number) {
  const start = new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(year, monthIndex0 + 1, 1, 0, 0, 0, 0))
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

export function currentUtcMonthRange(now = new Date()) {
  return utcMonthRange(now.getUTCFullYear(), now.getUTCMonth())
}

export function previousUtcMonthRange(now = new Date()) {
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth()
  const prev = m === 0 ? { year: y - 1, month: 11 } : { year: y, month: m - 1 }
  return utcMonthRange(prev.year, prev.month)
}

/** Последний день месяца YYYY-MM-DD (календарь UTC), для снимка занятости. */
export function lastDayOfUtcMonth(year: number, monthIndex0: number): string {
  return new Date(Date.UTC(year, monthIndex0 + 1, 0)).toISOString().slice(0, 10)
}

/** Последние `count` календарных месяцев включая текущий: `{ label, lastDay }` по UTC. */
export function recentUtcMonths(count: number, now = new Date()) {
  const items: { label: string; lastDay: string }[] = []
  let y = now.getUTCFullYear()
  let m = now.getUTCMonth()
  for (let i = 0; i < count; i++) {
    const label = `${y}-${String(m + 1).padStart(2, "0")}`
    items.push({ label, lastDay: lastDayOfUtcMonth(y, m) })
    m -= 1
    if (m < 0) {
      m = 11
      y -= 1
    }
  }
  return items.reverse()
}
