import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminClientNotesForm } from "@/components/admin-client-notes-form"
import { oneRelation } from "@/lib/supabase-relations"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, email, phone, passport_series, passport_number, role, verified, notes, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle()

  if (error || !profile) notFound()

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `
      id,
      start_date,
      end_date,
      status,
      final_price,
      created_at,
      boxes ( type, number, name )
    `,
    )
    .eq("user_id", id)
    .order("created_at", { ascending: false })

  return (
    <div className="space-y-8">
      <Link
        href="/admin/clients"
        className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Клиенты
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Клиент</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold">Профиль</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">ID</dt>
              <dd className="truncate font-mono text-xs">{profile.id}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Имя</dt>
              <dd>{profile.full_name ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Email</dt>
              <dd>{profile.email ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Телефон</dt>
              <dd>{profile.phone ?? "—"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Паспорт</dt>
              <dd>
                {profile.passport_series ?? "—"} {profile.passport_number ?? ""}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Роль</dt>
              <dd>{profile.role}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Верифицирован</dt>
              <dd>{profile.verified ? "да" : "нет"}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-muted-foreground">Создан</dt>
              <dd>{new Date(profile.created_at).toLocaleString("ru-RU")}</dd>
            </div>
          </dl>
        </div>
        <AdminClientNotesForm profileId={profile.id} initialNotes={profile.notes} />
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold">История аренд</h2>
        <div className="rounded-xl border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Период</TableHead>
                <TableHead>Ячейка</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead className="text-right">Сумма</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(bookings ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Нет бронирований
                  </TableCell>
                </TableRow>
              ) : (
                (bookings ?? []).map((b) => {
                  const box = oneRelation(b.boxes) as {
                    type: string
                    number: number
                    name: string
                  } | null
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="whitespace-nowrap">
                        {b.start_date} — {b.end_date}
                      </TableCell>
                      <TableCell>{box ? `${box.type} №${box.number}` : "—"}</TableCell>
                      <TableCell>{b.status}</TableCell>
                      <TableCell className="text-right">
                        {b.final_price?.toLocaleString("ru-RU")} ₽
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/admin/bookings/${b.id}`}
                          className="text-primary text-sm underline-offset-2 hover:underline"
                        >
                          Бронь
                        </Link>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
