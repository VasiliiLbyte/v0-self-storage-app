import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DashboardBookings } from "@/components/dashboard-bookings"
import { DashboardProfile } from "@/components/dashboard-profile"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Fetch user bookings with box info
  const { data: bookings } = await supabase
    .from("bookings")
    .select(`
      *,
      boxes (name, size_sqm, price_monthly)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  const activeBookings = bookings?.filter(b => b.status === "active" || b.status === "pending") || []
  const pastBookings = bookings?.filter(b => b.status === "completed" || b.status === "cancelled") || []

  return (
    <>
      <Header />
      <main className="min-h-screen py-8 md:py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-headline text-2xl md:text-3xl">
                Личный кабинет
              </h1>
              <p className="mt-1 text-muted-foreground">
                Управляйте бронированиями и настройками
              </p>
            </div>
            <Button asChild>
              <Link href="/booking">
                <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Новое бронирование
              </Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                  </svg>
                </div>
                <div>
                  <div className="text-headline text-2xl">{activeBookings.length}</div>
                  <div className="text-sm text-muted-foreground">Активных боксов</div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10 text-green-600">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-headline text-2xl">{pastBookings.length}</div>
                  <div className="text-sm text-muted-foreground">Завершённых</div>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent-foreground">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <div>
                  <div className="text-headline text-2xl">
                    {activeBookings.reduce((acc, b) => acc + (b.total_price || 0), 0).toLocaleString("ru-RU")} ₽
                  </div>
                  <div className="text-sm text-muted-foreground">Текущие расходы</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Bookings */}
            <div className="lg:col-span-2">
              <DashboardBookings 
                activeBookings={activeBookings} 
                pastBookings={pastBookings} 
              />
            </div>

            {/* Profile */}
            <div>
              <DashboardProfile 
                user={user} 
                profile={profile} 
              />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
