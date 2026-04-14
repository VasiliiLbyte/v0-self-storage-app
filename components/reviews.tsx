"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
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
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`h-4 w-4 ${i < rating ? "text-primary" : "text-muted"}`}
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
    year: "numeric",
    month: "long",
  })
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

  // Fallback reviews if database is empty
  const displayReviews = reviews.length > 0 ? reviews : [
    {
      id: "1",
      author_name: "Алексей Петров",
      rating: 5,
      text: "Отличный склад! Храню вещи уже год, всё в идеальном состоянии. Особенно радует круглосуточный доступ.",
      created_at: "2024-01-15",
    },
    {
      id: "2",
      author_name: "Мария Иванова",
      rating: 5,
      text: "Очень удобно во время ремонта. Мебель сохранилась отлично, климат-контроль работает. Рекомендую!",
      created_at: "2024-02-20",
    },
    {
      id: "3",
      author_name: "Дмитрий Козлов",
      rating: 5,
      text: "Использую для хранения сезонных товаров. Цены адекватные, персонал вежливый, всё чисто.",
      created_at: "2024-03-10",
    },
  ]

  const averageRating = displayReviews.length > 0
    ? (displayReviews.reduce((acc, r) => acc + r.rating, 0) / displayReviews.length).toFixed(1)
    : "5.0"

  if (loading) {
    return (
      <section id="reviews" className="py-20 md:py-28">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="reviews" className="py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-12 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h2 className="text-headline mb-2 text-3xl md:text-4xl">
              Отзывы клиентов
            </h2>
            <p className="text-muted-foreground">
              Более 500 довольных клиентов доверили нам свои вещи
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-border bg-card px-5 py-3">
            <span className="text-headline text-2xl">{averageRating}</span>
            <StarRating rating={Math.round(Number(averageRating))} />
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {displayReviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                    {getInitials(review.author_name)}
                  </div>
                  <div>
                    <div className="font-medium">{review.author_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </div>
                <StarRating rating={review.rating} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {review.text}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
