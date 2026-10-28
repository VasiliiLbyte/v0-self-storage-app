/** Допустимые сроки аренды в месяцах (совпадают с вариантами на шаге «Срок»). */
export const ALLOWED_MONTHS = [1, 3, 6, 12] as const
export type AllowedMonths = (typeof ALLOWED_MONTHS)[number]

export function isAllowedMonths(v: unknown): v is AllowedMonths {
  return typeof v === "number" && (ALLOWED_MONTHS as readonly number[]).includes(v)
}

/** Скидка за срок: от 3 мес. — 5 %, от 6 мес. — 10 %. */
export function discountPercentFor(months: number): number {
  if (months >= 6) return 10
  if (months >= 3) return 5
  return 0
}

export type BookingPrice = {
  base_price: number
  discount_percent: number
  final_price: number
}

export function computeBookingPrice(priceMonth: number, months: number): BookingPrice {
  const total = priceMonth * months
  const discount_percent = discountPercentFor(months)
  return {
    base_price: Math.round(total),
    discount_percent,
    final_price: Math.round(total * ((100 - discount_percent) / 100)),
  }
}

/** Конец периода = start + N календарных месяцев (UTC, как продление в webhook). */
export function computeRentalEndDateIso(startDate: string, months: number): string {
  const end = new Date(`${startDate}T00:00:00.000Z`)
  end.setUTCMonth(end.getUTCMonth() + months)
  return end.toISOString().slice(0, 10)
}

/** Сегодняшняя дата в Москве в формате YYYY-MM-DD. */
export function todayMoscowIso(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
}

export function addDaysIso(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00.000Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}
