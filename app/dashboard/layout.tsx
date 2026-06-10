import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = {
  title: "Личный кабинет",
}
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
      <main className="min-h-[calc(100vh-5rem)] bg-muted/30 pt-20">
        <DashboardShell>{children}</DashboardShell>
      </main>
      <Footer />
    </>
  )
}
