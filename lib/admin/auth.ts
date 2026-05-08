import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export type AdminContext = {
  supabase: Awaited<ReturnType<typeof createClient>>
  userId: string
}

export async function requireAdmin(): Promise<
  AdminContext | { error: NextResponse }
> {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabase, userId: user.id }
}
