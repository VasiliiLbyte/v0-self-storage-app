import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { DashboardShell } from "@/components/dashboard-shell"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?next=/dashboard")
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-4rem)] bg-muted/30">
        <DashboardShell>{children}</DashboardShell>
      </main>
      <Footer />
    </>
  )
}
