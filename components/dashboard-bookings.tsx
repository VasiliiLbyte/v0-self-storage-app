"use client"

import { useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

type Booking = {
  id: string
  start_date: string
  end_date: string
  total_price: number
  status: string
  boxes: {
    name: string
    size_sqm: number
    price_monthly: number
  }
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  pending: { label: "Ожидает оплаты", className: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400" },
  active: { label: "Активен", className: "bg-green-500/10 text-green-700 dark:text-green-400" },
  completed: { label: "Завершён", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Отменён", className: "bg-destructive/10 text-destructive" },
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

function BookingCard({ booking }: { booking: Booking }) {
  const status = STATUS_LABELS[booking.status] || STATUS_LABELS.pending
  const daysLeft = Math.ceil(
    (new Date(booking.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <span className="text-lg font-bold">{booking.boxes.name}</span>
          </div>
          <div>
            <div className="font-semibold">{booking.boxes.size_sqm} м²</div>
            <div className="text-sm text-muted-foreground">
              {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
            </div>
          </div>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
          {status.label}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <div>
          <div className="text-sm text-muted-foreground">Стоимость</div>
          <div className="font-semibold">{booking.total_price.toLocaleString("ru-RU")} ₽</div>
        </div>
        {booking.status === "active" && daysLeft > 0 && (
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Осталось</div>
            <div className="font-semibold">{daysLeft} дн.</div>
          </div>
        )}
      </div>

      {booking.status === "pending" && (
        <div className="mt-4 flex gap-2">
          <Button size="sm" className="flex-1">
            Оплатить
          </Button>
          <Button size="sm" variant="outline">
            Отменить
          </Button>
        </div>
      )}

      {booking.status === "active" && (
        <div className="mt-4">
          <Button size="sm" variant="outline" className="w-full">
            Продлить аренду
          </Button>
        </div>
      )}
    </Card>
  )
}

export function DashboardBookings({
  activeBookings,
  pastBookings,
}: {
  activeBookings: Booking[]
  pastBookings: Booking[]
}) {
  const [showPast, setShowPast] = useState(false)

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Мои бронирования</h2>

      {activeBookings.length === 0 && pastBookings.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <svg className="h-8 w-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          </div>
          <h3 className="mb-2 font-semibold">Нет бронирований</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            У вас пока нет активных бронирований. Забронируйте бокс прямо сейчас!
          </p>
          <Button asChild>
            <Link href="/booking">Забронировать бокс</Link>
          </Button>
        </Card>
      ) : (
        <>
          {/* Active bookings */}
          {activeBookings.length > 0 && (
            <div className="mb-6 space-y-4">
              {activeBookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          )}

          {activeBookings.length === 0 && (
            <Card className="mb-6 p-5 text-center">
              <p className="text-sm text-muted-foreground">Нет активных бронирований</p>
              <Button asChild size="sm" className="mt-3">
                <Link href="/booking">Забронировать</Link>
              </Button>
            </Card>
          )}

          {/* Past bookings toggle */}
          {pastBookings.length > 0 && (
            <div>
              <button
                onClick={() => setShowPast(!showPast)}
                className="flex w-full items-center justify-between rounded-lg border border-border p-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                <span>История ({pastBookings.length})</span>
                <svg
                  className={`h-4 w-4 transition-transform ${showPast ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {showPast && (
                <div className="mt-4 space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
