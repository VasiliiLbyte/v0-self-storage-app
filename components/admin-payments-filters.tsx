"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function AdminPaymentsFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const status = searchParams.get("status") ?? "all"
  const from = searchParams.get("from") ?? ""
  const to = searchParams.get("to") ?? ""

  const push = (next: Record<string, string>) => {
    const p = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === "all") p.delete(k)
      else p.set(k, v)
    }
    startTransition(() => router.push(`/admin/payments?${p.toString()}`))
  }

  return (
    <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">Статус</label>
        <Select value={status} onValueChange={(v) => push({ status: v })} disabled={pending}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все</SelectItem>
            <SelectItem value="pending">pending</SelectItem>
            <SelectItem value="succeeded">succeeded</SelectItem>
            <SelectItem value="cancelled">cancelled</SelectItem>
            <SelectItem value="refunded">refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">От</label>
        <Input type="date" className="w-[160px]" value={from} onChange={(e) => push({ from: e.target.value, to })} />
      </div>
      <div className="grid gap-1">
        <label className="text-xs text-muted-foreground">До</label>
        <Input type="date" className="w-[160px]" value={to} onChange={(e) => push({ from, to: e.target.value })} />
      </div>
      <Button type="button" variant="secondary" size="sm" onClick={() => router.push("/admin/payments")}>
        Сбросить
      </Button>
    </div>
  )
}
