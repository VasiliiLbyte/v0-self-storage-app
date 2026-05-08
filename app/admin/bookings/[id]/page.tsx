import Link from "next/link"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminBookingDetail } from "@/components/admin-booking-detail"
import { oneRelation } from "@/lib/supabase-relations"

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: booking }, { data: payments }, { data: boxOptions }] = await Promise.all([
    supabase
      .from("bookings")
      .select(
        `
        id,
        user_id,
        box_id,
        start_date,
        end_date,
        months,
        base_price,
        discount_percent,
        final_price,
        status,
        access_code,
        auto_renewal,
        contract_url,
        created_at,
        updated_at,
        profiles ( full_name, email ),
        boxes ( id, type, number, name )
      `,
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("payments")
      .select("id, created_at, amount, status, yookassa_payment_id")
      .eq("booking_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("boxes")
      .select("id, number, type, in_maintenance")
      .order("number", { ascending: true }),
  ])

  if (!booking) notFound()

  const profile = oneRelation(booking.profiles) as {
    full_name: string | null
    email: string | null
  } | null
  const box = oneRelation(booking.boxes) as {
    id: string
    type: string
    number: number
    name: string
  } | null

  const clientLabel =
    [profile?.full_name, profile?.email].filter(Boolean).join(" · ") || booking.user_id
  const boxLabel = box ? `${box.type} №${box.number} (${box.name})` : booking.box_id

  return (
    <div className="space-y-6">
      <Link
        href="/admin/bookings"
        className="text-sm text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
      >
        ← Все бронирования
      </Link>
      <h1 className="text-2xl font-semibold tracking-tight">Бронирование</h1>
      <AdminBookingDetail
        booking={{
          id: booking.id,
          user_id: booking.user_id,
          box_id: booking.box_id,
          start_date: booking.start_date,
          end_date: booking.end_date,
          months: booking.months,
          base_price: booking.base_price,
          discount_percent: booking.discount_percent,
          final_price: booking.final_price,
          status: booking.status,
          access_code: booking.access_code,
          auto_renewal: booking.auto_renewal,
          contract_url: booking.contract_url,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
        }}
        clientLabel={clientLabel}
        boxLabel={boxLabel}
        payments={payments ?? []}
        boxOptions={boxOptions ?? []}
      />
    </div>
  )
}
