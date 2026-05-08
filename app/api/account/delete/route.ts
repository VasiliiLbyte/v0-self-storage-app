import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/admin"

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const admin = createServiceRoleClient()
    const { error } = await admin.auth.admin.deleteUser(user.id)
    if (error) {
      console.error("delete user", error)
      return NextResponse.json({ error: "Не удалось удалить аккаунт" }, { status: 500 })
    }
  } catch (e) {
    console.error("account delete", e)
    return NextResponse.json(
      { error: "Сервер не настроен для удаления аккаунта (SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 503 },
    )
  }

  return NextResponse.json({ ok: true })
}
