import type { createServiceRoleClient } from "@/lib/supabase/admin"
import { todayMoscowIso } from "@/lib/booking-pricing"

type ServiceClient = ReturnType<typeof createServiceRoleClient>

/** Неоплаченная бронь держит ячейку столько минут после создания. */
export const PENDING_HOLD_MINUTES = 30

type BookingHoldRow = {
  box_id: string
  user_id: string
  status: string
  created_at: string | null
}

function holdsBox(row: BookingHoldRow, nowMs: number): boolean {
  if (row.status === "active") return true
  if (row.status !== "pending" || !row.created_at) return false
  return nowMs - new Date(row.created_at).getTime() < PENDING_HOLD_MINUTES * 60_000
}

/**
 * Занята ли ячейка на период [startDate, endDate).
 * Своя неоплаченная бронь пользователя не мешает: он может вернуться с оплаты и повторить.
 */
export async function findBoxConflict(
  svc: ServiceClient,
  params: { boxId: string; userId: string; startDate: string; endDate: string },
): Promise<{ conflict: boolean; error: string | null }> {
  const { data, error } = await svc
    .from("bookings")
    .select("box_id, user_id, status, created_at")
    .eq("box_id", params.boxId)
    .in("status", ["active", "pending"])
    .lt("start_date", params.endDate)
    .gt("end_date", params.startDate)

  if (error) return { conflict: false, error: error.message }

  const nowMs = Date.now()
  const conflict = (data as BookingHoldRow[]).some(
    (row) =>
      holdsBox(row, nowMs) && !(row.status === "pending" && row.user_id === params.userId),
  )
  return { conflict, error: null }
}

/** id ячеек, занятых сейчас или в будущем (активная аренда или свежая неоплаченная бронь). */
export async function listOccupiedBoxIds(
  svc: ServiceClient,
): Promise<{ boxIds: string[]; error: string | null }> {
  const { data, error } = await svc
    .from("bookings")
    .select("box_id, user_id, status, created_at")
    .in("status", ["active", "pending"])
    .gt("end_date", todayMoscowIso())

  if (error) return { boxIds: [], error: error.message }

  const nowMs = Date.now()
  const ids = new Set<string>()
  for (const row of data as BookingHoldRow[]) {
    if (holdsBox(row, nowMs)) ids.add(row.box_id)
  }
  return { boxIds: [...ids], error: null }
}
