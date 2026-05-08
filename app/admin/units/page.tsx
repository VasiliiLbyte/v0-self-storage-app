import { createClient } from "@/lib/supabase/server"
import { AdminUnitsTable, type AdminUnitRow } from "@/components/admin-units-table"
import { oneRelation } from "@/lib/supabase-relations"

export default async function AdminUnitsPage() {
  const supabase = await createClient()

  const [{ data: boxes }, { data: bookings }] = await Promise.all([
    supabase
      .from("boxes")
      .select("id, number, type, size_m2, price_month, in_maintenance")
      .order("number", { ascending: true }),
    supabase
      .from("bookings")
      .select(
        `
        box_id,
        status,
        profiles ( full_name, email )
      `,
      )
      .in("status", ["active", "pending"]),
  ])

  const tenantByBox = new Map<string, string>()
  for (const b of bookings ?? []) {
    const boxId = b.box_id as string
    if (tenantByBox.has(boxId)) continue
    const prof = oneRelation(b.profiles as never) as {
      full_name: string | null
      email: string | null
    } | null
    const label =
      [prof?.full_name, prof?.email].filter(Boolean).join(" · ") || "Клиент"
    tenantByBox.set(boxId, label)
  }

  const rows: AdminUnitRow[] = (boxes ?? []).map((box) => {
    const in_maintenance = Boolean(box.in_maintenance)
    const tenant = tenantByBox.get(box.id) ?? null
    const occupied = !!tenant && !in_maintenance
    const status: AdminUnitRow["status"] = in_maintenance
      ? "maintenance"
      : occupied
        ? "occupied"
        : "free"
    return {
      id: box.id,
      number: box.number,
      type: box.type,
      size_m2: Number(box.size_m2),
      price_month: box.price_month,
      in_maintenance,
      status,
      tenant: in_maintenance ? null : tenant,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ячейки</h1>
        <p className="text-sm text-muted-foreground">
          Цена — клик по сумме для редактирования. Обслуживание недоступно при активной аренде.
        </p>
      </div>
      <AdminUnitsTable rows={rows} />
    </div>
  )
}
