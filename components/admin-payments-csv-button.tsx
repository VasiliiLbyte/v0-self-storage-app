"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"

export type AdminPaymentCsvRow = {
  created_at: string
  client_name: string
  client_email: string
  box_label: string
  amount: number
  status: string
  yookassa_payment_id: string
}

function escapeCsvCell(value: string | number | null | undefined): string {
  const s = value == null ? "" : String(value)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export function AdminPaymentsCsvButton({
  rows,
  disabled,
}: {
  rows: AdminPaymentCsvRow[]
  disabled?: boolean
}) {
  const download = useCallback(() => {
    const header = [
      "Дата",
      "Клиент",
      "Email",
      "Ячейка",
      "Сумма",
      "Статус",
      "YooKassa ID",
    ]
    const lines = [
      header.map(escapeCsvCell).join(","),
      ...rows.map((p) =>
        [
          p.created_at,
          p.client_name,
          p.client_email,
          p.box_label,
          p.amount,
          p.status,
          p.yookassa_payment_id,
        ]
          .map(escapeCsvCell)
          .join(","),
      ),
    ]
    const csv = lines.join("\n")
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [rows])

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="shrink-0"
      disabled={disabled || rows.length === 0}
      onClick={download}
    >
      Скачать CSV
    </Button>
  )
}
