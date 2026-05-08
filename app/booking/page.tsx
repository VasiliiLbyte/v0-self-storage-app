"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

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

const STEPS = [
  { id: 1, name: "Размер", description: "Выберите бокс" },
  { id: 2, name: "Срок", description: "Период аренды" },
  { id: 3, name: "Данные", description: "Контактная информация" },
  { id: 4, name: "Оплата", description: "Подтверждение" },
]

function BookingContent() {
  const searchParams = useSearchParams()
  
  const [step, setStep] = useState(1)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [selectedBox, setSelectedBox] = useState<Box | null>(null)
  const [months, setMonths] = useState(1)
  const [startDate, setStartDate] = useState("")
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    const supabase = createClient()
    
    // Fetch boxes
    supabase
      .from("boxes")
      .select("*")
      .eq("in_maintenance", false)
      .order("number", { ascending: true })
      .then(({ data }) => {
      if (data) {
        setBoxes(data)
        const boxId = searchParams.get("box")
        const preselected = data.find(b => b.id === boxId)
        if (preselected) {
          setSelectedBox(preselected)
          setStep(2)
        }
      }
    })

    // Check auth
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      if (user) {
        setFormData(prev => ({
          ...prev,
          email: user.email || "",
          name: user.user_metadata?.full_name || "",
        }))
      }
      setLoading(false)
    })

    // Pre-fill months from URL
    const urlMonths = searchParams.get("months")
    if (urlMonths) {
      setMonths(parseInt(urlMonths) || 1)
    }

    // Set default start date to tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    setStartDate(tomorrow.toISOString().split("T")[0])
  }, [searchParams])

  const totalPrice = selectedBox ? selectedBox.price_month * months : 0
  const discount = months >= 6 ? 0.1 : months >= 3 ? 0.05 : 0
  const discountPercent = months >= 6 ? 10 : months >= 3 ? 5 : 0
  const finalPrice = Math.round(totalPrice * (1 - discount))

  const handleSubmit = async () => {
    if (!selectedBox) return
    
    setSubmitting(true)
    const supabase = createClient()

    let bookingUserId = user?.id ?? null

    // If not logged in, create account first
    if (!user) {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12) + "A1!", // Generate temp password
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
            `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.name,
            phone: formData.phone,
          },
        },
      })

      if (authError) {
        alert("Ошибка при создании аккаунта: " + authError.message)
        setSubmitting(false)
        return
      }

      bookingUserId =
        authData.user?.id ??
        authData.session?.user?.id ??
        (await supabase.auth.getSession()).data.session?.user?.id ??
        null

      if (!bookingUserId) {
        alert("Не удалось получить пользователя после регистрации. Подтвердите email или войдите вручную.")
        setSubmitting(false)
        return
      }
    }

    // Create booking
    const endDate = new Date(startDate)
    endDate.setMonth(endDate.getMonth() + months)

    const basePrice = Math.round(totalPrice)
    const accessCode = String(Math.floor(100000 + Math.random() * 900000))

    const { data: createdBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: bookingUserId,
        box_id: selectedBox.id,
        start_date: startDate,
        end_date: endDate.toISOString().split("T")[0],
        months,
        base_price: basePrice,
        discount_percent: discountPercent,
        final_price: finalPrice,
        access_code: accessCode,
        status: "pending",
      })
      .select("id")
      .single()

    if (bookingError || !createdBooking) {
      alert("Ошибка при создании бронирования: " + (bookingError?.message ?? ""))
      setSubmitting(false)
      return
    }

    const description = `Аренда ${selectedBox.name} (${months} мес.)`
    const payRes = await fetch("/api/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        booking_id: createdBooking.id,
        amount: finalPrice,
        description,
      }),
    })

    const payJson = (await payRes.json()) as { confirmation_url?: string; error?: string }
    if (!payRes.ok || !payJson.confirmation_url) {
      alert(payJson.error ?? "Не удалось создать платёж. Попробуйте позже или обратитесь в поддержку.")
      setSubmitting(false)
      return
    }

    window.location.href = payJson.confirmation_url
  }

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedBox
      case 2:
        return months > 0 && !!startDate
      case 3:
        return formData.name && formData.email && formData.phone
      default:
        return true
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-8 md:py-12">
        <div className="mx-auto max-w-4xl px-4">
          {/* Progress */}
          <div className="mb-8 md:mb-12">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                        step > s.id
                          ? "bg-primary text-primary-foreground"
                          : step === s.id
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {step > s.id ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        s.id
                      )}
                    </div>
                    <div className="mt-2 hidden text-center sm:block">
                      <div className="text-sm font-medium">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.description}</div>
                    </div>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 transition-colors ${
                        step > s.id ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Main content */}
            <div className="lg:col-span-2">
              {/* Step 1: Box Selection */}
              {step === 1 && (
                <div>
                  <h1 className="text-headline mb-2 text-2xl md:text-3xl">Выберите размер бокса</h1>
                  <p className="mb-6 text-muted-foreground">
                    Подберите подходящий размер для ваших вещей
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {boxes.map((box) => (
                      <Card
                        key={box.id}
                        onClick={() => setSelectedBox(box)}
                        className={`cursor-pointer p-5 transition-all ${
                          selectedBox?.id === box.id
                            ? "border-primary ring-2 ring-primary"
                            : "hover:border-primary/50"
                        }`}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-headline text-2xl">{box.name}</span>
                          <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                            {box.size_m2} м²
                          </span>
                        </div>
                        <p className="mb-1 text-xs text-muted-foreground">
                          {box.type} · №{box.number}
                        </p>
                        <p className="mb-3 text-sm text-muted-foreground">{box.description}</p>
                        <div className="text-lg font-semibold">
                          {box.price_month.toLocaleString("ru-RU")} ₽
                          <span className="text-sm font-normal text-muted-foreground"> / мес</span>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Duration */}
              {step === 2 && (
                <div>
                  <h1 className="text-headline mb-2 text-2xl md:text-3xl">Срок аренды</h1>
                  <p className="mb-6 text-muted-foreground">
                    Скидка 5% от 3 месяцев, 10% от 6 месяцев
                  </p>
                  
                  <div className="mb-6">
                    <label className="mb-2 block text-sm font-medium">Количество месяцев</label>
                    <div className="grid grid-cols-4 gap-3">
                      {[1, 3, 6, 12].map((m) => (
                        <button
                          key={m}
                          onClick={() => setMonths(m)}
                          className={`rounded-lg border py-3 text-center font-medium transition-colors ${
                            months === m
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {m} мес
                          {m >= 3 && (
                            <span className="block text-xs opacity-80">
                              −{m >= 6 ? "10" : "5"}%
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Дата начала аренды</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                      className="max-w-xs"
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Contact Info */}
              {step === 3 && (
                <div>
                  <h1 className="text-headline mb-2 text-2xl md:text-3xl">Контактные данные</h1>
                  <p className="mb-6 text-muted-foreground">
                    {user ? "Проверьте ваши данные" : "Введите данные для создания аккаунта"}
                  </p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Имя</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Иван Иванов"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Email</label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="ivan@example.com"
                        disabled={!!user}
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">Телефон</label>
                      <Input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+7 (999) 123-45-67"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Confirmation */}
              {step === 4 && (
                <div>
                  <h1 className="text-headline mb-2 text-2xl md:text-3xl">Подтверждение</h1>
                  <p className="mb-6 text-muted-foreground">
                    Проверьте детали бронирования
                  </p>

                  <Card className="divide-y divide-border">
                    <div className="flex items-center justify-between p-4">
                      <span className="text-muted-foreground">Бокс</span>
                      <span className="font-medium">{selectedBox?.name} ({selectedBox?.size_m2} м²)</span>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <span className="text-muted-foreground">Срок аренды</span>
                      <span className="font-medium">{months} мес.</span>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <span className="text-muted-foreground">Дата начала</span>
                      <span className="font-medium">
                        {new Date(startDate).toLocaleDateString("ru-RU", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <span className="text-muted-foreground">Контакт</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                  </Card>

                  <p className="mt-4 text-sm text-muted-foreground">
                    Нажимая &quot;Перейти к оплате&quot;, вы соглашаетесь с условиями аренды и переходите к
                    безопасной оплате через ЮKassa.
                  </p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <Card className="sticky top-24 p-5">
                <h3 className="mb-4 font-semibold">Ваш заказ</h3>
                
                {selectedBox ? (
                  <>
                    <div className="mb-4 flex items-center gap-3 rounded-lg bg-secondary p-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="text-lg font-bold">{selectedBox.name}</span>
                      </div>
                      <div>
                        <div className="font-medium">{selectedBox.size_m2} м²</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedBox.price_month.toLocaleString("ru-RU")} ₽/мес
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 border-t border-border pt-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Бокс × {months} мес</span>
                        <span>{totalPrice.toLocaleString("ru-RU")} ₽</span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Скидка {discount * 100}%</span>
                          <span>−{(totalPrice - finalPrice).toLocaleString("ru-RU")} ₽</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-end justify-between border-t border-border pt-4">
                      <span className="font-medium">Итого</span>
                      <span className="text-headline text-2xl">
                        {finalPrice.toLocaleString("ru-RU")} ₽
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Выберите бокс для расчёта</p>
                )}

                <div className="mt-6 flex gap-2">
                  {step > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="flex-1"
                    >
                      Назад
                    </Button>
                  )}
                  {step < 4 ? (
                    <Button
                      onClick={() => setStep(step + 1)}
                      disabled={!canProceed()}
                      className="flex-1"
                    >
                      Далее
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="flex-1"
                    >
                      {submitting ? "Переход к оплате..." : "Перейти к оплате"}
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function BookingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    }>
      <BookingContent />
    </Suspense>
  )
}
