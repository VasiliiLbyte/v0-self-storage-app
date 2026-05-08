"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AdminBookingsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const q = searchParams.get("q") ?? ""
  const status = searchParams.get("status") ?? "all"
  const type = searchParams.get("type") ?? "all"
  const from = searchParams.get("from") ?? ""
  const to = searchParams.get("to") ?? ""

  const push = useCallback(
    (next: Record<string, string>) => {
      const p = new URLSearchParams(searchParams.toString())
      for (const [k, v] of Object.entries(next)) {
        if (!v || v === "all") p.delete(k)
        else p.set(k, v)
      }
      startTransition(() => {
        router.push(`/admin/bookings?${p.toString()}`)
      })
    },
    [router, searchParams],
  )

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      <div className="grid w-full gap-1 md:max-w-xs">
        <label className="text-xs text-muted-foreground">Поиск</label>
        <Input
          placeholder="Имя или email"
          defaultValue={q}
          name="q"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              push({ q: (e.target as HTMLInputElement).value })
            }
          }}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">Статус</label>
        <Select
          value={status}
          onValueChange={(v) => push({ status: v })}
          disabled={pending}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="pending">Ожидает оплаты</SelectItem>
            <SelectItem value="active">Активна</SelectItem>
            <SelectItem value="completed">Завершена</SelectItem>
            <SelectItem value="cancelled">Отменена</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">Тип ячейки</label>
        <Select value={type} onValueChange={(v) => push({ type: v })} disabled={pending}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Тип" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="XS">XS</SelectItem>
            <SelectItem value="S">S</SelectItem>
            <SelectItem value="M">M</SelectItem>
            <SelectItem value="L">L</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">Создано от</label>
        <Input
          type="date"
          className="w-[160px]"
          value={from}
          onChange={(e) => push({ from: e.target.value, to })}
        />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">до</label>
        <Input
          type="date"
          className="w-[160px]"
          value={to}
          onChange={(e) => push({ from, to: e.target.value })}
        />
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin/bookings")}>
        Сбросить
      </Button>
    </div>
  )
}
