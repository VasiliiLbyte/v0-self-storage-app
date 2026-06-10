import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Профиль",
}
import { DashboardProfileForm } from "@/components/dashboard-profile-form"

export default async function DashboardProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, phone, email, avatar_url")
    .eq("id", user.id)
    .maybeSingle()

  return <DashboardProfileForm user={user} profile={profile} />
}
