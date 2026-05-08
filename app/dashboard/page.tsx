import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  LayoutDashboard,
  Package,
  CreditCard,
  User,
  KeyRound,
  ChevronRight,
} from "lucide-react"

const SECTIONS = [
  { href: "/dashboard/bookings", label: "Аренды", desc: "Активные и история", icon: Package },
  { href: "/dashboard/payments", label: "Платежи", desc: "История оплат", icon: CreditCard },
  { href: "/dashboard/access", label: "Доступ", desc: "Коды к ячейкам", icon: KeyRound },
  { href: "/dashboard/profile", label: "Профиль", desc: "Данные и безопасность", icon: User },
] as const

function utcMonthBounds(d = new Date()) {
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0))
  const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0))
  return { startIso: start.toISOString(), endIso: end.toISOString() }
}

export default async function DashboardOverviewPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { startIso, endIso } = utcMonthBounds()

  const [{ data: profile }, { data: bookings }, { data: monthPayments }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).single(),
    supabase.from("bookings").select("status").eq("user_id", user.id),
    supabase
      .from("payments")
      .select("amount")
      .eq("user_id", user.id)
      .eq("status", "succeeded")
      .gte("created_at", startIso)
      .lt("created_at", endIso),
  ])

  const rows = bookings ?? []
  const activeCount = rows.filter((b) => b.status === "active" || b.status === "pending").length
  const completedCount = rows.filter((b) => b.status === "completed").length

  const currentMonthSpend = (monthPayments ?? []).reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm text-muted-foreground">
            <LayoutDashboard className="h-4 w-4" />
            Обзор
          </div>
          <h1 className="text-headline text-2xl md:text-3xl">Личный кабинет</h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.full_name || user.email} — управление арендой и оплатами
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/booking">Новое бронирование</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Активных боксов</div>
          <div className="text-headline mt-1 text-3xl tabular-nums">{activeCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">
            Аренды со статусом «активна» или «ожидает оплаты»
          </p>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Завершённых</div>
          <div className="text-headline mt-1 text-3xl tabular-nums">{completedCount}</div>
          <p className="mt-2 text-xs text-muted-foreground">Аренды со статусом «завершена»</p>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-muted-foreground">Текущие расходы</div>
          <div className="text-headline mt-1 text-3xl tabular-nums">
            {currentMonthSpend.toLocaleString("ru-RU")} ₽
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Успешные платежи за текущий календарный месяц (UTC)
          </p>
        </Card>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Разделы</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SECTIONS.map(({ href, label, desc, icon: Icon }) => (
            <Link key={href} href={href}>
              <Card className="flex h-full items-center gap-4 p-4 transition-colors hover:bg-muted/50">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{label}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
