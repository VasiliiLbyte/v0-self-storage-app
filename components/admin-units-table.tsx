"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"

export type AdminUnitRow = {
  id: string
  number: number
  type: string
  size_m2: number
  price_month: number
  in_maintenance: boolean
  status: "free" | "occupied" | "maintenance"
  tenant: string | null
}

async function patchBox(id: string, body: Record<string, unknown>) {
  const res = await fetch(`/api/admin/boxes/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as { error?: string }
  if (!res.ok) throw new Error(json.error ?? res.statusText)
  return json
}

export function AdminUnitsTable({ rows: initialRows }: { rows: AdminUnitRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState("")
  const [saving, setSaving] = useState<string | null>(null)

  const startEdit = (r: AdminUnitRow) => {
    setEditingId(r.id)
    setEditValue(String(r.price_month))
  }

  const savePrice = async (id: string) => {
    const n = parseInt(editValue, 10)
    if (Number.isNaN(n) || n <= 0) {
      toast.error("Введите положительную целую сумму")
      return
    }
    setSaving(id)
    try {
      await patchBox(id, { price_month: n })
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, price_month: n } : r)),
      )
      setEditingId(null)
      toast.success("Цена обновлена")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка сохранения")
    } finally {
      setSaving(null)
    }
  }

  const toggleMaintenance = async (r: AdminUnitRow, value: boolean) => {
    if (r.status === "occupied" && value) {
      toast.error("Сначала завершите или отмените аренду")
      return
    }
    setSaving(r.id)
    try {
      await patchBox(r.id, { in_maintenance: value })
      setRows((prev) =>
        prev.map((row) => {
          if (row.id !== r.id) return row
          const in_maintenance = value
          const status: AdminUnitRow["status"] = in_maintenance
            ? "maintenance"
            : row.tenant
              ? "occupied"
              : "free"
          return { ...row, in_maintenance, status }
        }),
      )
      toast.success(value ? "На обслуживании" : "Снова доступна")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка")
    } finally {
      setSaving(null)
    }
  }

  const statusLabel: Record<AdminUnitRow["status"], string> = {
    free: "Свободна",
    occupied: "Занята",
    maintenance: "Обслуживание",
  }

  return (
    <div className="rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">№</TableHead>
            <TableHead>Тип</TableHead>
            <TableHead className="text-right">м²</TableHead>
            <TableHead className="text-right">Цена / мес</TableHead>
            <TableHead>Статус</TableHead>
            <TableHead>Арендатор</TableHead>
            <TableHead className="text-center">Обслуживание</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.number}</TableCell>
              <TableCell>{r.type}</TableCell>
              <TableCell className="text-right">{Number(r.size_m2)}</TableCell>
              <TableCell className="text-right">
                {editingId === r.id ? (
                  <div className="flex items-center justify-end gap-1">
                    <Input
                      className="h-8 w-24 text-right"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      inputMode="numeric"
                    />
                    <Button
                      size="sm"
                      className="h-8"
                      disabled={saving === r.id}
                      onClick={() => savePrice(r.id)}
                    >
                      OK
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8"
                      onClick={() => setEditingId(null)}
                    >
                      ×
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="text-primary underline-offset-2 hover:underline"
                    onClick={() => startEdit(r)}
                  >
                    {r.price_month.toLocaleString("ru-RU")} ₽
                  </button>
                )}
              </TableCell>
              <TableCell>{statusLabel[r.status]}</TableCell>
              <TableCell className="max-w-[200px] truncate text-muted-foreground">
                {r.tenant ?? "—"}
              </TableCell>
              <TableCell className="text-center">
                <Switch
                  checked={r.in_maintenance}
                  disabled={saving === r.id || (r.status === "occupied" && !r.in_maintenance)}
                  onCheckedChange={(v) => toggleMaintenance(r, v)}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
