"use client"

import { motion } from "framer-motion"
import { ChevronDown, ChevronRight } from "lucide-react"

const STEPS = [
  "Выберите размер бокса онлайн",
  "Оплатите картой через ЮKassa",
  "Получите персональный код доступа",
  "Приезжайте в любое время 24/7",
]

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative border-y border-border/60 bg-secondary/20 py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-10 text-center md:mb-14"
        >
          <span className="mb-3 block text-sm font-medium uppercase tracking-widest text-primary">
            Процесс
          </span>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
            Как это работает
          </h2>
        </motion.div>

        {/* Mobile: vertical */}
        <ol className="mx-auto flex max-w-md flex-col gap-2 md:hidden">
          {STEPS.map((text, i) => (
            <li key={i}>
              <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm font-medium leading-snug">{text}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="flex justify-center py-1">
                  <ChevronDown className="h-5 w-5 text-muted-foreground" aria-hidden />
                </div>
              )}
            </li>
          ))}
        </ol>

        {/* Desktop: horizontal */}
        <div className="hidden md:block">
          <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3">
            {STEPS.map((text, i) => (
              <div key={i} className="flex items-center gap-2 lg:gap-3">
                <div className="flex max-w-[200px] flex-col items-center gap-2 rounded-xl border border-border bg-card px-4 py-4 text-center lg:max-w-[220px] lg:px-5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <p className="text-sm font-medium leading-snug">{text}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight
                    className="h-5 w-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
