import { createClient } from "@/lib/supabase/server"
import { DashboardShellClient } from "@/components/dashboard-shell-client"

function getInitials(displayName: string, email: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    const a = parts[0]?.[0]
    const b = parts[parts.length - 1]?.[0]
    if (a && b) return (a + b).toUpperCase()
  }
  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const local = email.split("@")[0] ?? ""
  if (local.length >= 2) return local.slice(0, 2).toUpperCase()
  if (local.length === 1) return (local + "?").toUpperCase()
  return "?"
}

export async function DashboardShell({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <>{children}</>
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single()

  const displayName =
    profile?.full_name?.trim() ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "") ||
    user.email?.split("@")[0] ||
    "Пользователь"

  const email = user.email ?? ""
  const initials = getInitials(displayName, email)

  return (
    <DashboardShellClient
      displayName={displayName}
      email={email}
      initials={initials}
    >
      {children}
    </DashboardShellClient>
  )
}
