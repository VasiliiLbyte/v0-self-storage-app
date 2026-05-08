import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { oneRelation } from "@/lib/supabase-relations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

const TYPE_LABEL: Record<string, string> = {
  contract: "Договор",
  act: "Акт",
  receipt: "Чек",
}

export default async function DashboardDocumentsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: docs } = await supabase
    .from("documents")
    .select(
      `
      id,
      type,
      url,
      created_at,
      bookings (
        boxes (name, type, number)
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-headline text-2xl md:text-3xl">Документы</h1>
        <p className="mt-1 text-muted-foreground">
          Договоры и акты хранятся в защищённом хранилище. Ссылки действуют для вашего аккаунта.
        </p>
      </div>

      {!docs?.length ? (
        <Card className="p-10 text-center text-muted-foreground">
          Документов пока нет. После оформления аренды они появятся здесь (PDF в Supabase Storage,
          путь <code className="text-xs">documents/{`{user_id}`}/…</code>).
        </Card>
      ) : (
        <div className="space-y-3">
          {docs.map((d) => {
            const booking = oneRelation(d.bookings) as {
              boxes: { name: string; type: string; number: number } | { name: string; type: string; number: number }[] | null
            } | null
            const box = oneRelation(booking?.boxes ?? null)
            const title = `${TYPE_LABEL[d.type] ?? d.type}${box ? ` · ${box.name}` : ""}`
            const created = new Date(d.created_at).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })

            return (
              <Card key={d.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-semibold">{title}</div>
                  <div className="text-sm text-muted-foreground">
                    {created}
                    {box && (
                      <>
                        {" "}
                        · {box.type} №{box.number}
                      </>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href={d.url} target="_blank" rel="noopener noreferrer">
                    Скачать
                  </a>
                </Button>
              </Card>
            )
          })}
        </div>
      )}

      <p className="mt-6 text-sm text-muted-foreground">
        Нужен загрузчик для менеджеров? Добавьте файлы в бакет <strong>documents</strong> и строки в таблицу{" "}
        <code className="text-xs">documents</code> с публичным или подписанным URL.{" "}
        <Link href="/dashboard" className="text-primary underline">
          На обзор
        </Link>
      </p>
    </div>
  )
}
