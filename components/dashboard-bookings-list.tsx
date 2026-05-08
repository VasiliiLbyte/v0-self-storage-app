"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type DashboardBookingRow = {
  id: string
  start_date: string
  end_date: string
  final_price: number
  status: string
  boxes: {
    name: string
    type: string
    number: number
    size_m2: number
  } | null
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

export function DashboardBookingsList({
  activeBookings,
  pastBookings,
  payByBooking,
}: {
  activeBookings: DashboardBookingRow[]
  pastBookings: DashboardBookingRow[]
  payByBooking: Record<
    string,
    { status: string; yookassa_confirmation_url: string | null }
  >
}) {
  const router = useRouter()
  const [showPast, setShowPast] = useState(true)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [loading, setLoading] = useState<string | null>(null)

  const handleCancel = async (bookingId: string) => {
    setLoading(bookingId)
    const res = await fetch("/api/bookings/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ booking_id: bookingId }),
    })
    setLoading(null)
    setCancelId(null)
    if (res.ok) router.refresh()
    else {
      const j = (await res.json()) as { error?: string }
      alert(j.error ?? "Не удалось отменить")
    }
  }

  const handleExtend = async (bookingId: string) => {
    setLoading(bookingId)
    const res = await fetch("/api/bookings/extend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ booking_id: bookingId }),
    })
    const j = (await res.json()) as { confirmation_url?: string; error?: string }
    setLoading(null)
    if (res.ok && j.confirmation_url) {
      window.location.href = j.confirmation_url
    } else {
      alert(j.error ?? "Не удалось создать оплату продления")
    }
  }

  const renderCard = (booking: DashboardBookingRow) => {
    const box = booking.boxes
    const status = STATUS_LABELS[booking.status] || STATUS_LABELS.pending
    const daysLeft = Math.ceil(
      (new Date(booking.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    )
    const pay = payByBooking[booking.id]

    return (
      <Card key={booking.id} className="p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <span className="text-sm font-bold leading-tight">{box?.name ?? "—"}</span>
            </div>
            <div>
              <div className="font-semibold">
                {box ? `${box.type} №${box.number} · ${box.size_m2} м²` : "Ячейка"}
              </div>
              <div className="text-sm text-muted-foreground">
                {formatDate(booking.start_date)} — {formatDate(booking.end_date)}
              </div>
              {(booking.status === "active" || booking.status === "pending") && daysLeft > 0 && (
                <div className="mt-1 text-sm font-medium text-foreground">
                  Осталось дней: {daysLeft}
                </div>
              )}
            </div>
          </div>
          <span className={`self-start rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}>
            {status.label}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div>
            <div className="text-xs text-muted-foreground">Стоимость брони</div>
            <div className="font-semibold">{booking.final_price.toLocaleString("ru-RU")} ₽</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {booking.status === "pending" && pay?.status === "pending" && pay.yookassa_confirmation_url && (
              <Button size="sm" asChild>
                <a href={pay.yookassa_confirmation_url}>Оплатить</a>
              </Button>
            )}
            {booking.status === "active" && (
              <Button
                size="sm"
                variant="default"
                disabled={loading === booking.id}
                onClick={() => handleExtend(booking.id)}
              >
                {loading === booking.id ? "…" : "Продлить"}
              </Button>
            )}
            {(booking.status === "pending" || booking.status === "active") && (
              <Button size="sm" variant="outline" onClick={() => setCancelId(booking.id)}>
                Отменить
              </Button>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-headline text-2xl md:text-3xl">Мои аренды</h1>
          <p className="mt-1 text-muted-foreground">Активные, ожидающие оплаты и история</p>
        </div>
        <Button asChild>
          <Link href="/booking">Новое бронирование</Link>
        </Button>
      </div>

      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Активные и ожидающие
      </h2>
      {activeBookings.length === 0 ? (
        <Card className="mb-8 p-8 text-center text-muted-foreground">
          Нет активных аренд.{" "}
          <Link href="/booking" className="text-primary underline">
            Забронировать
          </Link>
        </Card>
      ) : (
        <div className="mb-8 space-y-4">{activeBookings.map(renderCard)}</div>
      )}

      <button
        type="button"
        onClick={() => setShowPast(!showPast)}
        className="mb-4 flex w-full items-center justify-between rounded-lg border border-border bg-card p-4 text-left text-sm font-medium transition-colors hover:bg-muted/50"
      >
        <span>История ({pastBookings.length})</span>
        <span className="text-muted-foreground">{showPast ? "Свернуть" : "Развернуть"}</span>
      </button>

      {showPast && pastBookings.length > 0 && (
        <div className="space-y-4">{pastBookings.map(renderCard)}</div>
      )}

      <AlertDialog open={!!cancelId} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Отменить аренду?</AlertDialogTitle>
            <AlertDialogDescription>
              Бронирование будет помечено как отменённое. Для активных оплаченных аренд уточните условия
              возврата у поддержки.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Нет</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={!!loading}
              onClick={() => cancelId && handleCancel(cancelId)}
            >
              Да, отменить
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
