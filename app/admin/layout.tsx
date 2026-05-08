import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminShell } from "@/components/admin-shell"
import { todayDateStringMoscow } from "@/lib/admin/time"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    redirect("/")
  }

  const { count: overdueCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .lt("end_date", todayDateStringMoscow())

  return (
    <AdminShell overdueCount={overdueCount ?? 0}>{children}</AdminShell>
  )
}
