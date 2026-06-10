import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Платежи",
}
import { oneRelation } from "@/lib/supabase-relations"
import { CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DashboardEmptyState } from "@/components/dashboard-empty-state"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const PAYMENT_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "В обработке", className: "bg-yellow-500/15 text-yellow-800 dark:text-yellow-300" },
  succeeded: { label: "Успешно", className: "bg-green-500/15 text-green-800 dark:text-green-300" },
  cancelled: { label: "Отменён", className: "bg-muted text-muted-foreground" },
  refunded: { label: "Возврат", className: "bg-orange-500/15 text-orange-800 dark:text-orange-300" },
}

export default async function DashboardPaymentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: rows } = await supabase
    .from("payments")
    .select(
      `
      id,
      amount,
      currency,
      status,
      created_at,
      yookassa_confirmation_url,
      bookings (
        boxes (name, type, number)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-headline text-2xl md:text-3xl">Платежи</h1>
        <p className="mt-1 text-muted-foreground">История оплат и ссылки на чеки</p>
      </div>

      {!rows?.length ? (
        <DashboardEmptyState icon={CreditCard} title="История платежей пуста" />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Ячейка</TableHead>
                <TableHead className="text-right">Чек</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const booking = oneRelation(row.bookings) as {
                  boxes: { name: string; type: string; number: number } | { name: string; type: string; number: number }[] | null
                } | null
                const box = oneRelation(booking?.boxes ?? null)
                const cellLabel = box ? `${box.name} (${box.type} №${box.number})` : "—"
                const st = PAYMENT_STATUS[row.status] ?? {
                  label: row.status,
                  className: "bg-muted text-muted-foreground",
                }
                const date = new Date(row.created_at).toLocaleString("ru-RU", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
                const receiptHref =
                  row.status === "succeeded"
                    ? "https://yookassa.ru/my"
                    : row.yookassa_confirmation_url || null

                return (
                  <TableRow key={row.id}>
                    <TableCell className="whitespace-nowrap">{date}</TableCell>
                    <TableCell className="font-medium">
                      {row.amount.toLocaleString("ru-RU")} {row.currency === "RUB" ? "₽" : row.currency}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${st.className}`}
                      >
                        {st.label}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{cellLabel}</TableCell>
                    <TableCell className="text-right">
                      {receiptHref ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={receiptHref} target="_blank" rel="noopener noreferrer">
                            Скачать чек
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Для оплаченных платежей квитанции доступны в личном кабинете ЮKassa; для незавершённых — по ссылке
        оплаты.
      </p>
    </div>
  )
}
