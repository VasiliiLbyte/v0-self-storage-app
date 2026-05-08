"use client"

import { motion } from "framer-motion"

const BENEFITS = [
  {
    number: "01",
    title: "Доступ 24/7",
    description: "Приезжайте когда удобно. Персональный код и круглосуточная охрана.",
    highlight: true,
  },
  {
    number: "02",
    title: "Климат +18°C",
    description: "Постоянная температура и влажность 50%. Идеально для любых вещей.",
    highlight: false,
  },
  {
    number: "03",
    title: "120+ камер",
    description: "Видеонаблюдение по всему складу. Запись хранится 30 дней.",
    highlight: false,
  },
  {
    number: "04",
    title: "Страховка",
    description: "Все вещи застрахованы на сумму до 500 000 ₽ без доплат.",
    highlight: true,
  },
  {
    number: "05",
    title: "Чистота",
    description: "Ежедневная уборка, дезинфекция, защита от грызунов.",
    highlight: false,
  },
  {
    number: "06",
    title: "Гибко",
    description: "Меняйте размер бокса, продлевайте онлайн. Без скрытых платежей.",
    highlight: false,
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  },
}

export function Benefits() {
  return (
    <section id="benefits" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background decoration */}
      <div className="pointer-events-none absolute top-0 right-0 w-1/2 h-full bg-[radial-gradient(ellipse_at_top_right,var(--primary)_0%,transparent_50%)] opacity-5" />
      
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-24"
        >
          <div className="flex items-end justify-between gap-8">
            <div>
              <span className="text-sm font-medium uppercase tracking-widest text-primary mb-4 block">
                Преимущества
              </span>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl max-w-2xl">
                Почему выбирают <span className="text-primary">нас</span>
              </h2>
            </div>
            <p className="hidden lg:block max-w-sm text-lg text-muted-foreground">
              Современный склад с европейскими стандартами. Всё для вашего спокойствия.
            </p>
          </div>
        </motion.div>

        {/* Benefits grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {BENEFITS.map((benefit) => (
            <motion.div
              key={benefit.number}
              variants={itemVariants}
              className={`group relative rounded-2xl p-8 transition-all duration-300 ${
                benefit.highlight
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card hover:border-primary/50"
              }`}
            >
              {/* Number */}
              <span className={`absolute top-8 right-8 text-6xl font-black leading-none ${
                benefit.highlight ? "text-primary-foreground/20" : "text-foreground/5"
              }`}>
                {benefit.number}
              </span>

              {/* Content */}
              <div className="relative z-10 pt-16">
                <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                <p className={`leading-relaxed ${
                  benefit.highlight ? "text-primary-foreground/80" : "text-muted-foreground"
                }`}>
                  {benefit.description}
                </p>
              </div>

              {/* Hover effect for non-highlight */}
              {!benefit.highlight && (
                <div className="absolute inset-0 rounded-2xl bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-16 md:mt-24 flex flex-wrap items-center justify-center gap-8 md:gap-16"
        >
          <div className="text-center">
            <div className="text-5xl font-black tracking-tight md:text-6xl">3+</div>
            <div className="mt-2 text-sm text-muted-foreground">года на рынке</div>
          </div>
          <div className="h-12 w-px bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-5xl font-black tracking-tight text-primary md:text-6xl">1500</div>
            <div className="mt-2 text-sm text-muted-foreground">м² площадь</div>
          </div>
          <div className="h-12 w-px bg-border hidden md:block" />
          <div className="text-center">
            <div className="text-5xl font-black tracking-tight md:text-6xl">0</div>
            <div className="mt-2 text-sm text-muted-foreground">инцидентов</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
