"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type StorageUnitRow = {
  id: string
  name: string
  type: string
  number: number
  size_m2: number
  height_m: number
  price_month: number
  is_available: boolean | null
}

const TYPE_FILTERS = ["all", "XS", "S", "M", "L"] as const
type TypeFilter = (typeof TYPE_FILTERS)[number]

const FILTER_LABEL: Record<TypeFilter, string> = {
  all: "Все",
  XS: "XS",
  S: "S",
  M: "M",
  L: "L",
}

export function StorageUnitsCatalog({ boxes }: { boxes: StorageUnitRow[] }) {
  const [filter, setFilter] = useState<TypeFilter>("all")

  const filtered = useMemo(() => {
    if (filter === "all") return boxes
    return boxes.filter((b) => b.type === filter)
  }, [boxes, filter])

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:py-14">
      <div className="mb-8 md:mb-10">
        <h1 className="text-headline text-3xl font-black tracking-tight md:text-4xl">
          Каталог ячеек
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Все размеры в одном месте. Выберите категорию и забронируйте подходящий бокс
          онлайн.
        </p>
      </div>

      <div
        className="mb-8 flex w-full flex-wrap gap-1 rounded-lg bg-muted p-1 md:w-fit"
        role="tablist"
        aria-label="Фильтр по типу ячейки"
      >
        {TYPE_FILTERS.map((key) => {
          const selected = filter === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setFilter(key)}
              className={cn(
                "rounded-md px-4 py-2 text-sm font-medium transition-colors",
                selected
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {FILTER_LABEL[key]}
            </button>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground">
          В этой категории нет ячеек.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((box) => {
            const available = box.is_available !== false
            const bookingHref = `/booking?type=${encodeURIComponent(box.type)}&box=${encodeURIComponent(box.id)}`
            return (
              <li key={box.id}>
                <Card className="flex h-full flex-col p-5">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Ячейка №{box.number}
                      </p>
                      <p className="text-lg font-bold">{box.name}</p>
                      <p className="text-sm text-muted-foreground">Тип {box.type}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold",
                        available
                          ? "bg-green-500/15 text-green-800 dark:text-green-300"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {available ? "Свободна" : "Занята"}
                    </span>
                  </div>
                  <dl className="mb-4 space-y-1 text-sm text-muted-foreground">
                    <div className="flex justify-between gap-2">
                      <dt>Площадь</dt>
                      <dd className="font-medium text-foreground">
                        {Number(box.size_m2).toLocaleString("ru-RU", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{" "}
                        м²
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Высота</dt>
                      <dd className="font-medium text-foreground">
                        {Number(box.height_m).toLocaleString("ru-RU", {
                          minimumFractionDigits: 0,
                          maximumFractionDigits: 2,
                        })}{" "}
                        м
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Аренда</dt>
                      <dd className="font-semibold text-foreground">
                        {box.price_month.toLocaleString("ru-RU")} ₽/мес
                      </dd>
                    </div>
                  </dl>
                  <Button asChild className="mt-auto w-full">
                    <Link href={bookingHref}>Забронировать</Link>
                  </Button>
                </Card>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
