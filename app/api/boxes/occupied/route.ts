import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/admin"
import { listOccupiedBoxIds } from "@/lib/booking-availability"

export const dynamic = "force-dynamic"

/** Только id занятых ячеек: ни дат, ни данных клиентов. */
export async function GET() {
  let svc: ReturnType<typeof createServiceRoleClient>
  try {
    svc = createServiceRoleClient()
  } catch (e) {
    console.error("boxes/occupied service role", e)
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  const { boxIds, error } = await listOccupiedBoxIds(svc)
  if (error) {
    console.error("boxes/occupied", error)
    return NextResponse.json({ error: "Failed to load occupancy" }, { status: 500 })
  }

  return NextResponse.json(
    { box_ids: boxIds },
    { headers: { "Cache-Control": "no-store" } },
  )
}
