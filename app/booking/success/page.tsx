import Link from "next/link"
import { redirect } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

type PageProps = {
  searchParams: Promise<{ payment_id?: string }>
}

export default async function BookingSuccessPage({ searchParams }: PageProps) {
  const { payment_id } = await searchParams

  if (!payment_id) {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
          <div className="mx-auto max-w-md px-4 text-center">
            <h1 className="text-headline mb-3 text-2xl">Спасибо!</h1>
            <p className="mb-8 text-muted-foreground">
              Если вы оплатили заказ, статус обновится в личном кабинете.
            </p>
            <Button asChild>
              <Link href="/dashboard">Личный кабинет</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const next = encodeURIComponent(`/booking/success?payment_id=${payment_id}`)
    redirect(`/auth/login?next=${next}`)
  }

  const { data: payment, error } = await supabase
    .from("payments")
    .select(
      `
      id,
      status,
      amount,
      bookings (
        access_code,
        status
      )
    `,
    )
    .eq("id", payment_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (error || !payment) {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
          <div className="mx-auto max-w-md px-4 text-center">
            <h1 className="text-headline mb-3 text-2xl">Платёж не найден</h1>
            <p className="mb-8 text-muted-foreground">
              Проверьте ссылку или откройте бронирование в личном кабинете.
            </p>
            <Button asChild>
              <Link href="/dashboard">Личный кабинет</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const rawBooking = payment.bookings as
    | { access_code: string; status: string }
    | { access_code: string; status: string }[]
    | null
  const booking = Array.isArray(rawBooking) ? rawBooking[0] : rawBooking

  const paid = payment.status === "succeeded"
  const waiting = payment.status === "pending"
  const cancelled = payment.status === "cancelled"

  return (
    <>
      <Header />
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-12">
        <div className="mx-auto max-w-md px-4 text-center">
          <div
            className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full ${
              cancelled ? "bg-muted" : "bg-green-500/10"
            }`}
          >
            {cancelled ? (
              <span className="text-3xl text-muted-foreground" aria-hidden>
                —
              </span>
            ) : (
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </div>

          <h1 className="text-headline mb-3 text-2xl md:text-3xl">
            {paid ? "Оплата прошла успешно" : waiting ? "Ожидаем подтверждение оплаты" : "Платёж отменён"}
          </h1>

          {paid && booking?.access_code && (
            <Card className="mb-8 p-6 text-left">
              <p className="mb-2 text-sm text-muted-foreground">Код доступа к ячейке</p>
              <p className="font-mono text-3xl font-bold tracking-widest">{booking.access_code}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                Сохраните код — он понадобится при заезде на склад.
              </p>
            </Card>
          )}

          {waiting && (
            <p className="mb-8 text-muted-foreground">
              Банк обрабатывает платёж. Код доступа появится здесь сразу после подтверждения. Обновите
              страницу через минуту или откройте раздел «Бронирования» в кабинете.
            </p>
          )}

          {cancelled && (
            <p className="mb-8 text-muted-foreground">
              Платёж не был завершён. Вы можете оформить бронирование заново.
            </p>
          )}

          {paid && (
            <p className="mb-8 text-muted-foreground">
              Сумма: {payment.amount?.toLocaleString("ru-RU")} ₽
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href="/dashboard">Личный кабинет</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/">На главную</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
