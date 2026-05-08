import { Suspense } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { AdminBookingsFilters } from "@/components/admin-bookings-filters"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { oneRelation } from "@/lib/supabase-relations"

type Search = {
  status?: string
  type?: string
  q?: string
  from?: string
  to?: string
}

async function BookingsTable({ search }: { search: Search }) {
  const supabase = await createClient()

  let userIds: string[] | null = null
  if (search.q?.trim()) {
    const raw = search.q.trim().replace(/%/g, "").replace(/,/g, "")
    const term = `%${raw}%`
    const [{ data: byName }, { data: byEmail }] = await Promise.all([
      supabase.from("profiles").select("id").ilike("full_name", term),
      supabase.from("profiles").select("id").ilike("email", term),
    ])
    const set = new Set<string>()
    for (const p of byName ?? []) set.add(p.id)
    for (const p of byEmail ?? []) set.add(p.id)
    userIds = [...set]
    if (userIds.length === 0) {
      return <p className="text-sm text-muted-foreground">Ничего не найдено.</p>
    }
  }

  let boxIdsByType: string[] | null = null
  if (search.type && search.type !== "all") {
    const { data: boxRows } = await supabase.from("boxes").select("id").eq("type", search.type)
    boxIdsByType = (boxRows ?? []).map((r) => r.id)
    if (boxIdsByType.length === 0) {
      return <p className="text-sm text-muted-foreground">Нет ячеек выбранного типа.</p>
    }
  }

  let q = supabase
    .from("bookings")
    .select(
      `
      id,
      created_at,
      start_date,
      end_date,
      status,
      final_price,
      access_code,
      profiles ( id, full_name, email ),
      boxes ( id, type, number, name )
    `,
    )
    .order("created_at", { ascending: false })

  if (userIds) q = q.in("user_id", userIds)
  if (search.status && search.status !== "all") q = q.eq("status", search.status)
  if (boxIdsByType) q = q.in("box_id", boxIdsByType)
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
            <TableHead>Создано</TableHead>
            <TableHead>Клиент</TableHead>
            <TableHead>Ячейка</TableHead>
            <TableHead>Период</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead className="text-right">Сумма</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {(rows ?? []).length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="py-16 text-center text-sm text-muted-foreground"
              >
                Нет данных для отображения
              </TableCell>
            </TableRow>
          )}
          {(rows ?? []).map((b) => {
            const profile = oneRelation(b.profiles) as {
              full_name: string | null
              email: string | null
            } | null
            const box = oneRelation(b.boxes) as {
              type: string
              number: number
              name: string
            } | null
            const client = [profile?.full_name, profile?.email].filter(Boolean).join(" · ") || "—"
            return (
              <TableRow key={b.id}>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {new Date(b.created_at).toLocaleString("ru-RU", { dateStyle: "short" })}
                </TableCell>
                <TableCell className="max-w-[200px] truncate">{client}</TableCell>
                <TableCell>
                  {box ? `${box.type} №${box.number}` : "—"}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {b.start_date} — {b.end_date}
                </TableCell>
                <TableCell>{b.status}</TableCell>
                <TableCell className="text-right">
                  {b.final_price?.toLocaleString("ru-RU")} ₽
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/bookings/${b.id}`}
                    className="text-primary text-sm underline-offset-2 hover:underline"
                  >
                    Открыть
                  </Link>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Search>
}) {
  const sp = await searchParams

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Бронирования</h1>
          <p className="text-sm text-muted-foreground">
            Фильтры по статусу, типу ячейки и дате создания. Поиск по имени/email в профиле.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/booking">Новое бронирование</Link>
        </Button>
      </div>
      <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
        <AdminBookingsFilters />
      </Suspense>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-muted" />}>
        <BookingsTable search={sp} />
      </Suspense>
    </div>
  )
}
