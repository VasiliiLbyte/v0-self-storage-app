import { createClient } from "@/lib/supabase/server"
import { oneRelation } from "@/lib/supabase-relations"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminPaymentsFilters } from "@/components/admin-payments-filters"
import { AdminPaymentRefundButton } from "@/components/admin-payment-refund-button"
import { Suspense } from "react"

type Search = {
  status?: string
  from?: string
  to?: string
}

async function PaymentsTable({ search }: { search: Search }) {
  const supabase = await createClient()

  let q = supabase
    .from("payments")
    .select(
      `
      id,
      created_at,
      amount,
      status,
      yookassa_payment_id,
      user_id,
      booking_id,
      profiles ( full_name, email ),
      bookings (
        boxes ( type, number )
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(300)

  if (search.status && search.status !== "all") q = q.eq("status", search.status)
  if (search.from) q = q.gte("created_at", `${search.from}T00:00:00.000Z`)
  if (search.to) q = q.lt("created_at", `${search.to}T23:59:59.999Z`)

  const { data: rows, error } = await q

  if (error) {
    return <p className="text-destructive text-sm">{error.message}</p>
  }

  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Дата</TableHead>
            <TableHead>Клиент</TableHead>
            <TableHead>Ячейка</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="font-mono text-xs">YooKassa</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rows ?? []).map((p) => {
            const profile = oneRelation(p.profiles) as {
              full_name: string | null
              email: string | null
            } | null
            const booking = oneRelation(p.bookings) as {
              boxes:
                | { type: string; number: number }
                | { type: string; number: number }[]
                | null
            } | null
            const box = booking ? oneRelation(booking.boxes) : null
            const client = [profile?.full_name, profile?.email].filter(Boolean).join(" · ") || "—"
            return (
              <TableRow key={p.id}>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {new Date(p.created_at).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" })}
                </TableCell>
                <TableCell className="max-w-[180px] truncate">{client}</TableCell>
                <TableCell>{box ? `${box.type} №${box.number}` : "—"}</TableCell>
                <TableCell className="text-right">{p.amount.toLocaleString("ru-RU")} ₽</TableCell>
                <TableCell>{p.status}</TableCell>
                <TableCell className="max-w-[140px] truncate font-mono text-xs">
                  {p.yookassa_payment_id ?? "—"}
                </TableCell>
                <TableCell>
                  <AdminPaymentRefundButton
                    paymentId={p.id}
                    amount={p.amount}
                    status={p.status}
                  />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const sp = await searchParams

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Платежи</h1>
        <p className="text-sm text-muted-foreground">
          Последние 300 записей. Возврат — полная сумма успешного платежа (только admin).
        </p>
      </div>
      <Suspense fallback={<div className="h-16 animate-pulse rounded-lg bg-muted" />}>
        <AdminPaymentsFilters />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <PaymentsTable search={sp} />
      </Suspense>
    </div>
  )
}
