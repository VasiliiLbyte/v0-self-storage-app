import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAdmin } from "@/lib/admin/auth"

const patchSchema = z.object({
  price_month: z.number().int().positive().max(10_000_000).optional(),
  in_maintenance: z.boolean().optional(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdmin()
  if ("error" in admin) return admin.error

  const { id } = await context.params
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (parsed.data.price_month !== undefined) updates.price_month = parsed.data.price_month
  if (parsed.data.in_maintenance !== undefined) {
    if (parsed.data.in_maintenance) {
      const { data: occ } = await admin.supabase
        .from("bookings")
        .select("id")
        .eq("box_id", id)
        .in("status", ["active", "pending"])
        .limit(1)
        .maybeSingle()
      if (occ) {
        return NextResponse.json(
          { error: "Нельзя включить обслуживание: есть активная или ожидающая оплаты аренда" },
          { status: 400 },
        )
      }
    }
    updates.in_maintenance = parsed.data.in_maintenance
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 })
  }

  const { data, error } = await admin.supabase
    .from("boxes")
    .update(updates)
    .eq("id", id)
    .select("id, price_month, in_maintenance")
    .single()

  if (error) {
    console.error("admin box patch", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
