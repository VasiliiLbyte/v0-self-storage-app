"use client"

import { useState } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Series = { labels: string[]; totals: number[] }

function toChartData(s: Series) {
  return s.labels.map((name, i) => ({ name, value: s.totals[i] ?? 0 }))
}

export function AdminAnalyticsCharts({
  revenueWeek,
  revenueMonth,
  occupancyWeek,
  occupancyMonth,
  newClientsWeek,
  newClientsMonth,
  topClients,
  avgDaysByType,
}: {
  revenueWeek: Series
  revenueMonth: Series
  occupancyWeek: Series
  occupancyMonth: Series
  newClientsWeek: Series
  newClientsMonth: Series
  topClients: { name: string; total: number }[]
  avgDaysByType: Record<string, number | null>
}) {
  const [gran, setGran] = useState<"week" | "month">("month")

  const revenue = gran === "week" ? revenueWeek : revenueMonth
  const occ = gran === "week" ? occupancyWeek : occupancyMonth
  const clients = gran === "week" ? newClientsWeek : newClientsMonth

  return (
    <div className="space-y-8">
      <Tabs value={gran} onValueChange={(v) => setGran(v as "week" | "month")}>
        <TabsList>
          <TabsTrigger value="week">По неделям</TabsTrigger>
          <TabsTrigger value="month">По месяцам</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="mt-4 space-y-8">
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard title="Выручка (succeeded, ₽)" subtitle={gran === "week" ? "12 недель" : "12 месяцев"}>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={toChartData(revenue)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} width={44} />
                <Tooltip formatter={(v: number) => [`${v.toLocaleString("ru-RU")} ₽`, ""]} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Занятость (%)" subtitle="Снимок на конец периода (ячейки не в обслуживании)">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={toChartData(occ)}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} width={36} />
                <Tooltip formatter={(v: number) => [`${v}%`, ""]} />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
        <ChartCard title="Новые клиенты" subtitle="По дате регистрации профиля (UTC)">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={toChartData(clients)}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={36} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold">Средняя длительность аренды (дни)</h3>
          <p className="mb-2 text-xs text-muted-foreground">
            По бронированиям со статусом active или completed.
          </p>
          <ul className="space-y-1 text-sm">
            {(["XS", "S", "M", "L"] as const).map((t) => (
              <li key={t} className="flex justify-between">
                <span>{t}</span>
                <span className="text-muted-foreground">
                  {avgDaysByType[t] == null ? "—" : `${avgDaysByType[t]} дн.`}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-border p-4">
          <h3 className="mb-3 text-sm font-semibold">Топ-5 клиентов по выручке</h3>
          <p className="mb-2 text-xs text-muted-foreground">Сумма успешных платежей.</p>
          <ul className="space-y-2 text-sm">
            {topClients.map((c, i) => (
              <li key={c.name + i} className="flex justify-between gap-2">
                <span className="truncate">{i + 1}. {c.name}</span>
                <span className="shrink-0 text-muted-foreground">
                  {c.total.toLocaleString("ru-RU")} ₽
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="text-sm font-medium">{title}</h3>
      <p className="mb-3 text-xs text-muted-foreground">{subtitle}</p>
      {children}
    </div>
  )
}
