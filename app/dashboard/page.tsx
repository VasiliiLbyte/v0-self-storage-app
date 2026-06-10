import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Обзор",
}
import { Button } from "@/components/ui/button"
import {
  Package,
  CreditCard,
  User,
  KeyRound,
  ChevronRight,
  CheckCircle,
  Wallet,
  MapPin,
  Clock,
  Mail,
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

function greetingPhrase() {
  const h = new Date().getHours()
  if (h < 12) return "Доброе утро"
  if (h < 18) return "Добрый день"
  return "Добрый вечер"
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

  const metaFull =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name.trim() : ""
  const greetingName =
    profile?.full_name?.trim().split(/\s+/)[0] ||
    metaFull.split(/\s+/).filter(Boolean)[0] ||
    user.email?.split("@")[0] ||
    "друг"

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-headline text-2xl font-bold tracking-tight md:text-3xl">
            {greetingPhrase()}, {greetingName}! 👋
          </h1>
          <p className="mt-2 text-muted-foreground">
            Ваши мини-склады ПЕЛИКАН · Петроградская сторона
          </p>
        </div>
        <Button asChild className="hidden shrink-0 sm:inline-flex">
          <Link href="/booking">Новое бронирование</Link>
        </Button>
      </div>

      <Button asChild className="w-full sm:hidden">
        <Link href="/booking">Новое бронирование</Link>
      </Button>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-primary/20 to-primary/5 p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Package className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="text-headline text-4xl tabular-nums leading-none">{activeCount}</div>
          <p className="mt-2 text-sm font-medium text-foreground">Активных боксов</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Аренды со статусом «активна» или «ожидает оплаты»
          </p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-blue-500/20 to-blue-500/5 p-6 shadow-sm">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
            <CheckCircle className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="text-headline text-4xl tabular-nums leading-none">{completedCount}</div>
          <p className="mt-2 text-sm font-medium text-foreground">Завершённых</p>
          <p className="mt-1 text-xs text-muted-foreground">Аренды со статусом «завершена»</p>
        </div>
        <div className="rounded-2xl border border-border/60 bg-gradient-to-br from-green-500/20 to-green-500/5 p-6 shadow-sm sm:col-span-1">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/15 text-green-600 dark:text-green-400">
            <Wallet className="h-8 w-8" strokeWidth={1.75} aria-hidden />
          </div>
          <div className="text-headline text-4xl tabular-nums leading-none">
            {currentMonthSpend.toLocaleString("ru-RU")} ₽
          </div>
          <p className="mt-2 text-sm font-medium text-foreground">Текущие расходы</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Успешные платежи за текущий календарный месяц (UTC)
          </p>
        </div>
      </div>

      {activeCount === 0 ? (
        <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-orange-500 p-6 text-primary-foreground shadow-lg md:p-8">
          <div className="max-w-xl space-y-3">
            <h2 className="text-xl font-bold md:text-2xl">53 ячейки — найдите свою за пару минут</h2>
            <p className="text-sm text-primary-foreground/90 md:text-base">
              Выберите размер, даты и оформите бронирование онлайн. Доступ к складу круглосуточно.
            </p>
            <Button asChild variant="secondary" className="mt-2 font-semibold">
              <Link href="/booking">Забронировать ячейку</Link>
            </Button>
          </div>
        </div>
      ) : null}

      <div>
        <h2 className="mb-4 text-lg font-semibold">Быстрые действия</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map(({ href, label, desc, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <Icon className="h-6 w-6" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-foreground">{label}</div>
                <div className="text-sm text-muted-foreground">{desc}</div>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Полезная информация</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <MapPin className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h3 className="font-semibold">Адрес склада</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Мытнинская наб., 5/7
              <br />
              м. Горьковская / Петроградская
              <br />
              Доступ 24/7
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
              <Clock className="h-5 w-5 text-primary" aria-hidden />
            </div>
            <h3 className="font-semibold">Поддержка</h3>
            <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>Пн–Вс, ответ в течение дня</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">hello@pelikan-storage.ru</p>
            <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
              <a href="mailto:hello@pelikan-storage.ru">Написать</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
