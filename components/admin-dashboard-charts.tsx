"use client"

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

type Props = {
  occupancy: { month: string; occupancyPct: number }[]
  revenue: { month: string; revenue: number }[]
}

export function AdminDashboardCharts({ occupancy, revenue }: Props) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-1 text-sm font-medium">Занятость на конец месяца (%)</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Доля ячеек не в обслуживании с арендой на последний день месяца (UTC).
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={occupancy}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} width={36} />
              <Tooltip
                formatter={(v: number) => [`${v}%`, "Занятость"]}
                labelFormatter={(l) => `Месяц ${l}`}
              />
              <Line
                type="monotone"
                dataKey="occupancyPct"
                stroke="#FF6B00"
                strokeWidth={2}
                dot={{ fill: "#FF6B00", stroke: "#FF6B00", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="mb-1 text-sm font-medium">Выручка по месяцам (₽)</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Успешные платежи по дате создания (UTC).
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} width={48} />
              <Tooltip
                formatter={(v: number) => [`${v.toLocaleString("ru-RU")} ₽`, "Выручка"]}
                labelFormatter={(l) => `Месяц ${l}`}
              />
              <Bar dataKey="revenue" fill="#FF6B00" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
