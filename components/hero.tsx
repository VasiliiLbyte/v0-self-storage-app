"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Massive background text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
          className="text-[25vw] font-black text-foreground/[0.03] dark:text-foreground/[0.04] leading-none tracking-tighter whitespace-nowrap"
        >
          СКЛАД
        </motion.div>
      </div>

      {/* Grid pattern overlay */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:120px_100%] opacity-30" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,transparent_49%,var(--border)_50%,transparent_51%,transparent_100%)] bg-[length:100%_120px] opacity-30" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        {/* Top row with status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-8 flex items-center gap-4"
        >
          <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            <span className="text-sm font-medium">24/7 доступ</span>
          </div>
          <span className="hidden text-sm text-muted-foreground md:inline">
            Петроградская сторона, СПб
          </span>
        </motion.div>

        {/* Main headline */}
        <div className="mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className="text-5xl font-black tracking-tight md:text-7xl lg:text-[6rem] xl:text-[7rem]"
          >
            <span className="block text-foreground">Храним вещи.</span>
            <span className="block mt-2">
              <span className="text-primary">Освобождаем</span>
              <span className="text-foreground/40"> пространство.</span>
            </span>
          </motion.h1>
        </div>

        {/* Two column layout */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          {/* Left: Description and CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <p className="mb-8 max-w-lg text-xl leading-relaxed text-muted-foreground md:text-2xl">
              Современный склад индивидуального хранения. 
              Климат-контроль, охрана, чистота. Бронирование — за 2 минуты.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="h-14 px-10 text-lg font-semibold rounded-full">
                <Link href="/booking">
                  Забронировать
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-10 text-lg font-semibold rounded-full">
                <Link href="/#calculator">Рассчитать</Link>
              </Button>
            </div>
          </motion.div>

          {/* Right: Stats grid */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="grid grid-cols-2 gap-6"
          >
            <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="text-4xl font-black tracking-tight md:text-5xl">500+</div>
              <div className="mt-2 text-muted-foreground">клиентов</div>
            </div>
            <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="text-4xl font-black tracking-tight text-primary md:text-5xl">4.9</div>
              <div className="mt-2 text-muted-foreground">рейтинг</div>
            </div>
            <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="text-4xl font-black tracking-tight md:text-5xl">2 м²</div>
              <div className="mt-2 text-muted-foreground">от размера</div>
            </div>
            <div className="group rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg">
              <div className="text-4xl font-black tracking-tight md:text-5xl">1 490<span className="text-2xl">₽</span></div>
              <div className="mt-2 text-muted-foreground">от / мес</div>
            </div>
          </motion.div>
        </div>

        {/* Bottom decorative boxes */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="mt-20 flex items-end gap-3"
        >
          <div className="h-16 w-16 rounded-lg bg-primary md:h-24 md:w-24" />
          <div className="h-12 w-12 rounded-lg border-2 border-accent md:h-20 md:w-20" />
          <div className="h-20 w-20 rounded-lg bg-accent/20 md:h-28 md:w-28" />
          <div className="hidden h-10 w-10 rounded-lg border-2 border-primary/50 sm:block md:h-16 md:w-16" />
          <div className="hidden h-14 w-14 rounded-lg bg-muted sm:block md:h-20 md:w-20" />
          <div className="ml-auto hidden text-right lg:block">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">Скролл</div>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="mt-2"
            >
              <svg className="h-6 w-6 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
