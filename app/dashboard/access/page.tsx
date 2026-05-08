import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { oneRelation } from "@/lib/supabase-relations"
import { KeyRound } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { DashboardEmptyState } from "@/components/dashboard-empty-state"

export default async function DashboardAccessPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `
      id,
      access_code,
      end_date,
      status,
      boxes (name, type, number, zone, floor)
    `,
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("end_date", { ascending: true })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-headline text-2xl md:text-3xl">Коды доступа</h1>
        <p className="mt-1 text-muted-foreground">
          Используйте код на терминале или у охраны при заезде на склад.
        </p>
      </div>

      {!bookings?.length ? (
        <DashboardEmptyState
          icon={KeyRound}
          title="Коды доступа появятся после первой аренды"
          description="Оформите бронирование — код для терминала и охраны появится здесь после активации аренды."
          action={{ label: "Забронировать", href: "/booking" }}
        />
      ) : (
        <div className="space-y-8">
          {bookings.map((b) => {
            const box = oneRelation(b.boxes) as {
              name: string
              type: string
              number: number
              zone: string
              floor: number
            } | null
            return (
              <Card key={b.id} className="overflow-hidden">
                <div className="border-b border-border bg-muted/40 px-6 py-4">
                  <div className="font-semibold">{box?.name ?? "Ячейка"}</div>
                  <div className="text-sm text-muted-foreground">
                    {box?.type} №{box?.number} · этаж {box?.floor} · зона {box?.zone}
                  </div>
                </div>
                <div className="px-6 py-10 text-center">
                  <p className="mb-3 text-sm font-medium uppercase tracking-wider text-muted-foreground">
                    Код доступа
                  </p>
                  <p className="font-mono text-5xl font-black tracking-[0.25em] text-foreground md:text-6xl">
                    {b.access_code}
                  </p>
                  <p className="mt-4 text-sm text-muted-foreground">
                    Аренда до{" "}
                    {new Date(b.end_date).toLocaleDateString("ru-RU", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </Card>
            )
          })}

          <Card className="p-6">
            <h2 className="mb-3 text-lg font-semibold">Как войти на объект</h2>
            <ol className="list-decimal space-y-3 pl-5 text-sm text-muted-foreground">
              <li>
                Подъезжайте по адресу склада в часы работы (уточняйте у менеджера после бронирования).
              </li>
              <li>
                На КПП или терминале введите код доступа из этого раздела (или назовите охране номер
                ячейки и код).
              </li>
              <li>
                Используйте тот же код для электронного замка на коридоре вашей зоны, если он
                установлен.
              </li>
              <li>
                При проблемах с кодом звоните на линию поддержки, указанную в договоре или в письме
                после оплаты.
              </li>
            </ol>
            <Button variant="outline" className="mt-6" asChild>
              <Link href="/dashboard/bookings">К списку аренд</Link>
            </Button>
          </Card>
        </div>
      )}
    </div>
  )
}
