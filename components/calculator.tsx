"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

type Box = {
  id: string
  name: string
  type: string
  number: number
  size_m2: number
  price_month: number
  description: string
  in_maintenance?: boolean
}

const ITEM_EXAMPLES: Record<string, string[]> = {
  XS: ["Документы", "Ручная кладь", "Мелкая техника"],
  S: ["Сезонная одежда", "Документы", "Спортинвентарь"],
  M: ["Мебель из комнаты", "Велосипеды", "Бытовая техника"],
  L: ["Вещи из квартиры", "Оборудование", "Товарные запасы"],
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
        .eq("in_maintenance", false)
        .order("number", { ascending: true })
      
      if (data && data.length > 0) {
        setBoxes(data)
        const defaultBox =
          data.find((b) => b.type === "S") ?? data[Math.floor(data.length / 2)] ?? data[0]
        setSelectedBox(defaultBox)
      }
      setLoading(false)
    }
    fetchBoxes()
  }, [])

  const totalPrice = selectedBox ? selectedBox.price_month * months : 0
  const discount = months >= 6 ? 0.1 : months >= 3 ? 0.05 : 0
  const finalPrice = Math.round(totalPrice * (1 - discount))

  if (loading) {
    return (
      <section id="calculator" className="py-24 md:py-32 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4">
          <div className="h-96 animate-pulse rounded-3xl bg-muted" />
        </div>
      </section>
    )
  }

  return (
    <section id="calculator" className="relative py-24 md:py-32 bg-secondary/30 overflow-hidden">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-20"
        >
          <span className="text-sm font-medium uppercase tracking-widest text-primary mb-4 block">
            Калькулятор
          </span>
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <h2 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl max-w-xl">
              Подберите <span className="text-primary">идеальный</span> бокс
            </h2>
            <p className="max-w-md text-lg text-muted-foreground">
              Скидка 5% при аренде от 3 месяцев, 10% — от 6 месяцев
            </p>
          </div>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Box selection - takes 2 columns */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {boxes.map((box, index) => (
                <motion.div
                  key={box.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  onClick={() => setSelectedBox(box)}
                  className={`group relative cursor-pointer rounded-2xl p-6 transition-all duration-300 ${
                    selectedBox?.id === box.id
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/30"
                      : "bg-card border border-border hover:border-primary/50 hover:shadow-lg"
                  }`}
                >
                  {/* Size badge */}
                  <div className={`absolute top-6 right-6 text-5xl font-black leading-none ${
                    selectedBox?.id === box.id ? "text-primary-foreground/20" : "text-foreground/5"
                  }`}>
                    {box.name}
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-black">{box.size_m2}</span>
                      <span className={`text-sm ${
                        selectedBox?.id === box.id ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>м²</span>
                    </div>
                    
                    <div className="mb-4">
                      <span className="text-2xl font-bold">{box.price_month.toLocaleString("ru-RU")}</span>
                      <span className={`text-sm ml-1 ${
                        selectedBox?.id === box.id ? "text-primary-foreground/70" : "text-muted-foreground"
                      }`}>₽/мес</span>
                    </div>

                    <p className={`text-sm mb-4 ${
                      selectedBox?.id === box.id ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}>
                      {box.description}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {ITEM_EXAMPLES[box.type]?.map((item) => (
                        <span
                          key={item}
                          className={`rounded-full px-3 py-1 text-xs font-medium ${
                            selectedBox?.id === box.id
                              ? "bg-primary-foreground/20 text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Selection indicator */}
                  {selectedBox?.id === box.id && (
                    <motion.div
                      layoutId="box-indicator"
                      className="absolute top-4 left-4 w-3 h-3 rounded-full bg-primary-foreground"
                    />
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Price calculation */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <div className="sticky top-28 rounded-3xl bg-card border border-border p-8 shadow-xl">
              <h3 className="text-2xl font-bold mb-8">Итого</h3>

              {selectedBox && (
                <>
                  {/* Duration selector */}
                  <div className="mb-8">
                    <label className="mb-3 block text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Срок аренды
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMonths(m)}
                          className={`relative rounded-xl py-3 text-sm font-semibold transition-all ${
                            months === m
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary hover:bg-secondary/80"
                          }`}
                        >
                          {m}
                          {m >= 3 && (
                            <span className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                              m >= 6 ? "bg-green-500" : "bg-yellow-500"
                            }`} />
                          )}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground text-center">
                      {months === 1 && "Без скидки"}
                      {months === 3 && "Скидка 5%"}
                      {months === 6 && "Скидка 10%"}
                      {months === 12 && "Скидка 10%"}
                    </div>
                  </div>

                  {/* Price breakdown */}
                  <div className="space-y-4 border-t border-border pt-6">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Бокс {selectedBox.name}</span>
                      <span className="font-medium">{selectedBox.price_month.toLocaleString("ru-RU")} ₽/мес</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Срок</span>
                      <span className="font-medium">{months} мес</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Скидка {discount * 100}%</span>
                        <span>−{(totalPrice - finalPrice).toLocaleString("ru-RU")} ₽</span>
                      </div>
                    )}
                    <div className="flex items-end justify-between border-t border-border pt-4">
                      <span className="text-lg font-semibold">Итого</span>
                      <div className="text-right">
                        <span className="text-4xl font-black">{finalPrice.toLocaleString("ru-RU")}</span>
                        <span className="text-lg ml-1">₽</span>
                      </div>
                    </div>
                  </div>

                  <Button asChild className="mt-8 w-full h-14 text-lg font-semibold rounded-full" size="lg">
                    <Link href={`/booking?box=${selectedBox.id}&months=${months}`}>
                      Забронировать
                      <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </Button>

                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    Оплата при заезде. Отмена бесплатно.
                  </p>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
