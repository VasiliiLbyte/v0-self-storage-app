"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

type Payment = {
  id: string
  created_at: string
  amount: number
  status: string
  yookassa_payment_id: string | null
}

type BoxOpt = { id: string; number: number; type: string; in_maintenance: boolean }

type Booking = {
  id: string
  user_id: string
  box_id: string
  start_date: string
  end_date: string
  months: number
  base_price: number
  discount_percent: number | null
  final_price: number
  status: string
  access_code: string
  auto_renewal: boolean | null
  contract_url: string | null
  created_at: string
  updated_at: string
}

export function AdminBookingDetail({
  booking,
  clientLabel,
  boxLabel,
  payments,
  boxOptions,
}: {
  booking: Booking
  clientLabel: string
  boxLabel: string
  payments: Payment[]
  boxOptions: BoxOpt[]
}) {
  const router = useRouter()
  const [status, setStatus] = useState(booking.status)
  const [boxId, setBoxId] = useState(booking.box_id)
  const [loading, setLoading] = useState<string | null>(null)

  useEffect(() => {
    setStatus(booking.status)
    setBoxId(booking.box_id)
  }, [booking.id, booking.status, booking.box_id])

  const call = async (body: object, okMsg: string) => {
    setLoading(JSON.stringify(body))
    try {
      const res = await fetch(`/api/admin/bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? res.statusText)
      toast.success(okMsg)
      router.refresh()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setLoading(null)
    }
  }

  const selectableBoxes = boxOptions.filter((b) => !b.in_maintenance || b.id === booking.box_id)

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">Бронирование</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="truncate font-mono text-xs">{booking.id}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Клиент</dt>
              <dd>{clientLabel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Ячейка</dt>
              <dd>{boxLabel}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Период</dt>
              <dd>
                {booking.start_date} — {booking.end_date}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Месяцев</dt>
              <dd>{booking.months}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Цены</dt>
              <dd>
                база {booking.base_price} · скидка {booking.discount_percent ?? 0}% · итого{" "}
                {booking.final_price} ₽
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Код доступа</dt>
              <dd className="font-mono">{booking.access_code}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Автопродление</dt>
              <dd>{booking.auto_renewal ? "да" : "нет"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Договор</dt>
              <dd className="truncate">{booking.contract_url ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Создано</dt>
              <dd>{new Date(booking.created_at).toLocaleString("ru-RU")}</dd>
            </div>
          </dl>
        </div>

        <div className="space-y-4 rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold">Действия</h2>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Статус</span>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">pending</SelectItem>
                  <SelectItem value="active">active</SelectItem>
                  <SelectItem value="completed">completed</SelectItem>
                  <SelectItem value="cancelled">cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              disabled={loading !== null || status === booking.status}
              onClick={() => call({ action: "set_status", status }, "Статус обновлён")}
            >
              Сохранить статус
            </Button>
          </div>
          <Button
            variant="secondary"
            size="sm"
            disabled={loading !== null}
            onClick={() => call({ action: "extend_month" }, "Аренда продлена на 1 месяц")}
          >
            Продлить на 1 месяц (+ цена месяца ячейки)
          </Button>
          <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1">
              <span className="text-xs text-muted-foreground">Другая ячейка</span>
              <Select value={boxId} onValueChange={setBoxId}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {selectableBoxes.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.type} №{b.number}
                      {b.in_maintenance ? " (обсл.)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={loading !== null || boxId === booking.box_id}
              onClick={() => call({ action: "reassign_box", box_id: boxId }, "Ячейка назначена")}
            >
              Назначить ячейку
            </Button>
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">Платежи по бронированию</h2>
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>YooKassa ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-muted-foreground">
                    Нет платежей
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {new Date(p.created_at).toLocaleString("ru-RU", { dateStyle: "short" })}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.amount.toLocaleString("ru-RU")} ₽
                    </TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.yookassa_payment_id ?? "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
