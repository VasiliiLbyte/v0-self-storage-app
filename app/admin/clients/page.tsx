import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

function searchTerm(raw: string) {
  const clean = raw.trim().replace(/%/g, "").replace(/,/g, "")
  if (!clean) return null
  return `%${clean}%`
}

type ProfileListRow = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  created_at: string
}

export default async function AdminClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = await createClient()
  const term = q ? searchTerm(q) : null

  let profiles: ProfileListRow[] = []
  let error: { message: string } | null = null

  if (term) {
    const [{ data: byName }, { data: byEmail }, { data: byPhone }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone, created_at").ilike("full_name", term),
      supabase.from("profiles").select("id, full_name, email, phone, created_at").ilike("email", term),
      supabase.from("profiles").select("id, full_name, email, phone, created_at").ilike("phone", term),
    ])
    const map = new Map<string, ProfileListRow>()
    for (const row of [...(byName ?? []), ...(byEmail ?? []), ...(byPhone ?? [])]) {
      map.set(row.id, row as ProfileListRow)
    }
    profiles = [...map.values()]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 200)
  } else {
    const res = await supabase
      .from("profiles")
      .select("id, full_name, email, phone, created_at")
      .order("created_at", { ascending: false })
      .limit(200)
    profiles = (res.data ?? []) as ProfileListRow[]
    error = res.error
  }

  if (error) {
    return <p className="text-destructive text-sm">{error.message}</p>
  }

  const ids = profiles.map((p) => p.id)
  const bookingCount = new Map<string, number>()
  const paymentSum = new Map<string, number>()

  if (ids.length > 0) {
    const [{ data: bookings }, { data: payments }] = await Promise.all([
      supabase.from("bookings").select("user_id").in("user_id", ids),
      supabase
        .from("payments")
        .select("user_id, amount")
        .eq("status", "succeeded")
        .in("user_id", ids),
    ])
    for (const b of bookings ?? []) {
      bookingCount.set(b.user_id, (bookingCount.get(b.user_id) ?? 0) + 1)
    }
    for (const p of payments ?? []) {
      paymentSum.set(p.user_id, (paymentSum.get(p.user_id) ?? 0) + p.amount)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Клиенты</h1>
        <p className="text-sm text-muted-foreground">
          До 200 записей. «Сумма всего» — успешные платежи (YooKassa succeeded).
        </p>
      </div>
      <form className="flex max-w-md flex-wrap items-end gap-2" action="/admin/clients" method="get">
        <div className="grid flex-1 gap-1">
          <label className="text-xs text-muted-foreground">Поиск</label>
          <Input name="q" placeholder="Имя, email, телефон" defaultValue={q ?? ""} />
        </div>
        <Button type="submit" variant="secondary">
          Найти
        </Button>
      </form>
      <div className="rounded-xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Имя</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Телефон</TableHead>
              <TableHead>Регистрация</TableHead>
              <TableHead className="text-right">Аренд</TableHead>
              <TableHead className="text-right">Сумма платежей</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.full_name ?? "—"}</TableCell>
                <TableCell className="max-w-[180px] truncate">{p.email ?? "—"}</TableCell>
                <TableCell>{p.phone ?? "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground text-sm">
                  {new Date(p.created_at).toLocaleDateString("ru-RU")}
                </TableCell>
                <TableCell className="text-right">{bookingCount.get(p.id) ?? 0}</TableCell>
                <TableCell className="text-right">
                  {(paymentSum.get(p.id) ?? 0).toLocaleString("ru-RU")} ₽
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/clients/${p.id}`}
                    className="text-primary text-sm underline-offset-2 hover:underline"
                  >
                    Карточка
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
