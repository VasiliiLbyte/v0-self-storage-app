"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"

type Box = {
  id: string
  name: string
  size_sqm: number
  price_monthly: number
  description: string
}

const BOX_ICONS = {
  S: (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <rect x="12" y="20" width="40" height="32" rx="4" className="fill-current opacity-20" />
      <rect x="16" y="24" width="32" height="24" rx="2" className="fill-current opacity-40" />
      <path d="M24 36h16M32 30v12" className="stroke-current" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  M: (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <rect x="8" y="16" width="48" height="36" rx="4" className="fill-current opacity-20" />
      <rect x="12" y="20" width="40" height="28" rx="2" className="fill-current opacity-40" />
      <rect x="20" y="28" width="10" height="12" rx="1" className="fill-current opacity-60" />
      <rect x="34" y="28" width="10" height="12" rx="1" className="fill-current opacity-60" />
    </svg>
  ),
  L: (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <rect x="4" y="12" width="56" height="44" rx="4" className="fill-current opacity-20" />
      <rect x="8" y="16" width="48" height="36" rx="2" className="fill-current opacity-40" />
      <rect x="12" y="24" width="16" height="20" rx="1" className="fill-current opacity-60" />
      <rect x="32" y="24" width="20" height="10" rx="1" className="fill-current opacity-60" />
      <rect x="32" y="38" width="20" height="6" rx="1" className="fill-current opacity-60" />
    </svg>
  ),
  XL: (
    <svg viewBox="0 0 64 64" className="h-full w-full">
      <rect x="2" y="8" width="60" height="48" rx="4" className="fill-current opacity-20" />
      <rect x="6" y="12" width="52" height="40" rx="2" className="fill-current opacity-40" />
      <rect x="10" y="18" width="18" height="14" rx="1" className="fill-current opacity-60" />
      <rect x="10" y="36" width="18" height="12" rx="1" className="fill-current opacity-60" />
      <rect x="32" y="18" width="22" height="30" rx="1" className="fill-current opacity-60" />
      <circle cx="43" cy="33" r="6" className="fill-current opacity-30" />
    </svg>
  ),
}

const ITEM_EXAMPLES: Record<string, string[]> = {
  S: ["Сезонная одежда", "Документы", "Спортинвентарь"],
  M: ["Мебель из комнаты", "Велосипеды", "Бытовая техника"],
  L: ["Вещи из квартиры", "Оборудование", "Товарные запасы"],
  XL: ["Переезд целиком", "Автозапчасти", "Крупный бизнес"],
}

export function Calculator() {
  const [boxes, setBoxes] = useState<Box[]>([])
  const [selectedBox, setSelectedBox] = useState<Box | null>(null)
  const [months, setMonths] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchBoxes = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("boxes")
        .select("*")
        .order("size_sqm", { ascending: true })
      
      if (data && data.length > 0) {
        setBoxes(data)
        setSelectedBox(data[1]) // Default to M size
      }
      setLoading(false)
    }
    fetchBoxes()
  }, [])

  const totalPrice = selectedBox ? selectedBox.price_monthly * months : 0
  const discount = months >= 6 ? 0.1 : months >= 3 ? 0.05 : 0
  const finalPrice = Math.round(totalPrice * (1 - discount))

  if (loading) {
    return (
      <section id="calculator" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="h-96 animate-pulse rounded-3xl bg-muted" />
        </div>
      </section>
    )
  }

  return (
    <section id="calculator" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 text-center">
          <h2 className="text-headline mb-4 text-3xl md:text-4xl">
            Подберите идеальный бокс
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Выберите размер и срок аренды. Скидка 5% при аренде от 3 месяцев, 10% — от 6 месяцев.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Box selection */}
          <div className="lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              {boxes.map((box) => (
                <Card
                  key={box.id}
                  onClick={() => setSelectedBox(box)}
                  className={`group cursor-pointer p-6 transition-all ${
                    selectedBox?.id === box.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className={`h-16 w-16 ${selectedBox?.id === box.id ? "text-primary" : "text-muted-foreground"}`}>
                      {BOX_ICONS[box.name as keyof typeof BOX_ICONS]}
                    </div>
                    <div className="text-right">
                      <div className="text-headline text-2xl">{box.name}</div>
                      <div className="text-sm text-muted-foreground">{box.size_sqm} м²</div>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <span className="text-headline text-xl">{box.price_monthly.toLocaleString("ru-RU")} ₽</span>
                    <span className="text-muted-foreground"> / месяц</span>
                  </div>

                  <p className="mb-4 text-sm text-muted-foreground">{box.description}</p>

                  <div className="flex flex-wrap gap-2">
                    {ITEM_EXAMPLES[box.name]?.map((item) => (
                      <span
                        key={item}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Price calculation */}
          <div>
            <Card className="sticky top-24 p-6">
              <h3 className="text-headline mb-6 text-xl">Расчёт стоимости</h3>

              {selectedBox && (
                <>
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">
                      Срок аренды
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMonths(m)}
                          className={`rounded-lg border py-2 text-sm font-medium transition-colors ${
                            months === m
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {m} мес
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Бокс {selectedBox.name} × {months} мес</span>
                      <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Скидка {discount * 100}%</span>
                        <span>−{(totalPrice - finalPrice).toLocaleString("ru-RU")} ₽</span>
                      </div>
                    )}
                    <div className="flex items-end justify-between border-t border-border pt-3">
                      <span className="font-medium">Итого</span>
                      <span className="text-headline text-2xl">{finalPrice.toLocaleString("ru-RU")} ₽</span>
                    </div>
                  </div>

                  <Button asChild className="mt-6 w-full" size="lg">
                    <Link href={`/booking?box=${selectedBox.id}&months=${months}`}>
                      Забронировать
                    </Link>
                  </Button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Оплата при заезде. Отмена бесплатно.
                  </p>
                </>
              )}
            </Card>
          </div>
        </div>
      </div>
    </section>
  )
}
