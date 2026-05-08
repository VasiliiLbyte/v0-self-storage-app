"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const TYPES = [
  {
    type: "XS",
    range: "1.0 – 1.3 м²",
    basePrice: 1490,
    hint: "Документы, чемодан, мелкая техника",
  },
  {
    type: "S",
    range: "1.8 – 2.2 м²",
    basePrice: 2490,
    hint: "Одежда, инвентарь, шины",
  },
  {
    type: "M",
    range: "3.0 – 3.5 м²",
    basePrice: 3990,
    hint: "Мебель, велосипед, бытовая техника",
  },
  {
    type: "L",
    range: "4.0 – 5.0 м²",
    basePrice: 5990,
    hint: "Вещи из квартиры, товарные запасы",
  },
] as const

const MONTHS = [
  { value: 1, label: "1 мес", discount: 0 },
  { value: 3, label: "3 мес", discount: 0.05 },
  { value: 6, label: "6 мес", discount: 0.1 },
  { value: 12, label: "12 мес", discount: 0.1 },
] as const

type StorageType = (typeof TYPES)[number]["type"]

export function Calculator() {
  const [selectedType, setSelectedType] = useState<StorageType>("S")
  const [selectedMonths, setSelectedMonths] = useState<number>(1)

  const selected = useMemo(
    () => TYPES.find((t) => t.type === selectedType) ?? TYPES[1],
    [selectedType],
  )
  const monthOption = useMemo(
    () => MONTHS.find((m) => m.value === selectedMonths) ?? MONTHS[0],
    [selectedMonths],
  )

  const subtotal = selected.basePrice * selectedMonths
  const discount = monthOption.discount
  const total = Math.round(subtotal * (1 - discount))
  const discountAmount = subtotal - total

  return (
    <section id="calculator" className="bg-secondary/30 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="space-y-10"
        >
          <div>
            <span className="mb-3 block text-sm font-medium uppercase tracking-widest text-primary">
              Калькулятор
            </span>
            <h2 className="max-w-2xl text-3xl font-black tracking-tight md:text-4xl">
              Подберите размер и срок — цена без запросов к серверу
            </h2>
            <p className="mt-3 max-w-xl text-muted-foreground">
              Скидка 5% от 3 месяцев, 10% от 6 и 12 месяцев. Точная ячейка — на шаге бронирования.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            <div className="space-y-10">
              <div>
                <h3 className="mb-4 text-lg font-semibold">1 — Выберите размер</h3>
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  {TYPES.map((t) => {
                    const active = t.type === selectedType
                    return (
                      <button
                        key={t.type}
                        type="button"
                        onClick={() => setSelectedType(t.type)}
                        className={cn(
                          "relative rounded-2xl p-4 text-left transition-colors",
                          active
                            ? "border-2 border-primary bg-card shadow-sm"
                            : "border border-border bg-card hover:border-primary/40",
                        )}
                      >
                        {active ? (
                          <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                            {t.basePrice.toLocaleString("ru-RU")} ₽/мес
                          </span>
                        ) : null}
                        <div className="pr-16">
                          <div className="text-2xl font-bold">{t.type}</div>
                          <div className="mt-1 text-sm text-muted-foreground">{t.range}</div>
                          <p className="mt-2 text-xs text-muted-foreground">{t.hint}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-semibold">2 — Срок аренды</h3>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
                  {MONTHS.map((m) => {
                    const active = m.value === selectedMonths
                    return (
                      <button
                        key={m.value}
                        type="button"
                        onClick={() => setSelectedMonths(m.value)}
                        className={cn(
                          "flex min-h-[3.75rem] flex-col items-center justify-center rounded-xl border px-2 py-3 text-center text-sm font-semibold transition-colors",
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-card hover:border-primary/40",
                        )}
                      >
                        <span>{m.label}</span>
                        {m.discount > 0 ? (
                          <span
                            className={cn(
                              "mt-0.5 text-[10px] font-medium leading-tight",
                              active ? "text-primary-foreground/90" : "text-muted-foreground",
                            )}
                          >
                            −{Math.round(m.discount * 100)}%
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="mb-6 text-lg font-semibold">Итого</h3>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Тип</dt>
                    <dd className="font-medium">{selected.type}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Срок</dt>
                    <dd className="font-medium">{selectedMonths} мес.</dd>
                  </div>
                  {discount > 0 ? (
                    <div className="flex justify-between gap-2 text-green-600 dark:text-green-500">
                      <dt>Скидка {Math.round(discount * 100)}%</dt>
                      <dd>−{discountAmount.toLocaleString("ru-RU")} ₽</dd>
                    </div>
                  ) : null}
                  <div className="flex items-end justify-between gap-2 border-t border-border pt-4">
                    <dt className="text-base font-semibold">К оплате</dt>
                    <dd className="text-2xl font-black tabular-nums">
                      {total.toLocaleString("ru-RU")} ₽
                    </dd>
                  </div>
                </dl>

                <Button asChild className="mt-6 w-full" size="lg">
                  <Link href={`/booking?type=${selectedType}&months=${selectedMonths}`}>
                    Выбрать ячейку →
                  </Link>
                </Button>
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Конкретная ячейка — на следующем шаге
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
