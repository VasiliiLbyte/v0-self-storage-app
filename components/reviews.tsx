"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"

type Review = {
  id: string
  author_name: string
  rating: number
  text: string
  created_at: string
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`h-5 w-5 ${i < rating ? "text-primary" : "text-muted/30"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ru-RU", {
    month: "short",
    year: "numeric",
  })
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
  },
}

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchReviews = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6)

      if (data) {
        setReviews(data)
      }
      setLoading(false)
    }
    fetchReviews()
  }, [])

  const displayReviews = reviews.length > 0 ? reviews : [
    {
      id: "1",
      author_name: "Алексей Петров",
      rating: 5,
      text: "Отличный склад! Храню вещи уже год, всё в идеальном состоянии. Особенно радует круглосуточный доступ — приезжаю когда удобно.",
      created_at: "2024-01-15",
    },
    {
      id: "2",
      author_name: "Мария Иванова",
      rating: 5,
      text: "Очень удобно во время ремонта. Мебель сохранилась отлично, климат-контроль работает безупречно. Рекомендую всем!",
      created_at: "2024-02-20",
    },
    {
      id: "3",
      author_name: "Дмитрий Козлов",
      rating: 5,
      text: "Использую для хранения сезонных товаров. Цены адекватные, персонал вежливый, везде чисто и приятно.",
      created_at: "2024-03-10",
    },
  ]

  const averageRating = displayReviews.length > 0
    ? (displayReviews.reduce((acc, r) => acc + r.rating, 0) / displayReviews.length).toFixed(1)
    : "5.0"

  if (loading) {
    return (
      <section id="reviews" className="py-24 md:py-32">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="reviews" className="relative py-24 md:py-32 overflow-hidden">
      {/* Background elements */}
      <div className="pointer-events-none absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

      <div className="relative z-10 mx-auto max-w-7xl px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-16 md:mb-20"
        >
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div>
              <span className="text-sm font-medium uppercase tracking-widest text-primary mb-4 block">
                Отзывы
              </span>
              <h2 className="text-4xl font-black tracking-tight md:text-5xl lg:text-6xl max-w-xl">
                Нам <span className="text-primary">доверяют</span>
              </h2>
            </div>

            {/* Rating badge */}
            <div className="flex items-center gap-6 rounded-2xl border border-border bg-card p-6">
              <div className="text-center">
                <div className="text-5xl font-black text-primary">{averageRating}</div>
                <div className="text-sm text-muted-foreground mt-1">из 5</div>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <StarRating rating={Math.round(Number(averageRating))} />
                <div className="text-sm text-muted-foreground mt-2">
                  {displayReviews.length}+ отзывов
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Reviews grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          {displayReviews.map((review, index) => (
            <motion.div
              key={review.id}
              variants={itemVariants}
              className={`group relative rounded-2xl p-8 transition-all duration-300 ${
                index === 0
                  ? "bg-primary text-primary-foreground md:col-span-2 lg:col-span-1"
                  : "border border-border bg-card hover:border-primary/30 hover:shadow-lg"
              }`}
            >
              {/* Quote mark */}
              <div className={`absolute top-6 right-6 text-6xl leading-none font-serif ${
                index === 0 ? "text-primary-foreground/10" : "text-foreground/5"
              }`}>
                &ldquo;
              </div>

              {/* Content */}
              <div className="relative z-10">
                <p className={`text-lg leading-relaxed mb-8 ${
                  index === 0 ? "text-primary-foreground/90" : "text-foreground/80"
                }`}>
                  {review.text}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-full font-bold text-lg ${
                      index === 0
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-primary/10 text-primary"
                    }`}>
                      {getInitials(review.author_name)}
                    </div>
                    <div>
                      <div className="font-semibold">{review.author_name}</div>
                      <div className={`text-sm ${
                        index === 0 ? "text-primary-foreground/60" : "text-muted-foreground"
                      }`}>
                        {formatDate(review.created_at)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={index === 0 ? "opacity-80" : ""}>
                    <StarRating rating={review.rating} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground">
            Присоединяйтесь к 500+ довольным клиентам
          </p>
        </motion.div>
      </div>
    </section>
  )
}
