"use client"

import { useState, useEffect, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { CROSSBORDER_TRANSFER } from "@/lib/contract/contract-content"
import { cn } from "@/lib/utils"
import type { User } from "@supabase/supabase-js"

/** Семантика как при insert в bookings: конец периода = start + N календарных месяцев. */
function computeRentalEndDateIso(startDate: string, months: number): string {
  const end = new Date(startDate)
  end.setMonth(end.getMonth() + months)
  return end.toISOString().split("T")[0]
}

function formatDateRuLong(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

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

const SIZE_ORDER = ["XS", "S", "M", "L"] as const
type SizeType = (typeof SIZE_ORDER)[number]

function isSizeType(v: string): v is SizeType {
  return (SIZE_ORDER as readonly string[]).includes(v)
}

const SIZE_META: Record<SizeType, { title: string; hint: string }> = {
  XS: {
    title: "XS",
    hint: "Документы, ручная кладь, мелкая техника",
  },
  S: {
    title: "S",
    hint: "Сезонная одежда, документы, спортинвентарь",
  },
  M: {
    title: "M",
    hint: "Мебель из комнаты, велосипеды, бытовая техника",
  },
  L: {
    title: "L",
    hint: "Вещи из квартиры, оборудование, запасы",
  },
}

const STEPS = [
  { id: 1, name: "Размер", description: "Категория и бокс" },
  { id: 2, name: "Срок", description: "Период аренды" },
  { id: 3, name: "Данные", description: "Контактная информация" },
  { id: 4, name: "Оплата", description: "Подтверждение" },
]

function BookingContent() {
  const searchParams = useSearchParams()
  
  const [step, setStep] = useState(1)
  const [boxes, setBoxes] = useState<Box[]>([])
  const [selectedBox, setSelectedBox] = useState<Box | null>(null)
  const [sizePickPhase, setSizePickPhase] = useState<"category" | "unit">("category")
  const [selectedSize, setSelectedSize] = useState<SizeType | null>(null)
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
  const [phoneError, setPhoneError] = useState("")
  const [consentDocs, setConsentDocs] = useState(false)
  const [consentCrossborder, setConsentCrossborder] = useState(false)
  const [consentMarketing, setConsentMarketing] = useState(false)

  const requiredConsentsMet =
    consentDocs && (!CROSSBORDER_TRANSFER || consentCrossborder)

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
        const preselected = data.find((b) => b.id === boxId)
        if (preselected) {
          setSelectedBox(preselected)
          if (isSizeType(preselected.type)) {
            setSelectedSize(preselected.type)
            setSizePickPhase("unit")
          }
          setStep(2)
        } else {
          const rawType = searchParams.get("type")
          const urlType = rawType?.trim().toUpperCase()
          if (urlType && isSizeType(urlType)) {
            setSelectedSize(urlType)
            setSizePickPhase("unit")
          }
        }
      }
    })

    // Auth + profile phone (wait before hiding loader)
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const user = session?.user ?? null
      setUser(user)
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone")
          .eq("id", user.id)
          .maybeSingle()
        setFormData((prev) => ({
          ...prev,
          email: user.email || "",
          name: user.user_metadata?.full_name || "",
          ...(profile?.phone ? { phone: profile.phone } : {}),
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
  const rentalEndIso =
    startDate && months > 0 ? computeRentalEndDateIso(startDate, months) : null

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
    const endDateIso = computeRentalEndDateIso(startDate, months)

    const basePrice = Math.round(totalPrice)
    const accessCode = String(Math.floor(100000 + Math.random() * 900000))

    const { data: createdBooking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: bookingUserId,
        box_id: selectedBox.id,
        start_date: startDate,
        end_date: endDateIso,
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

    const signRes = await fetch("/api/bookings/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        booking_id: createdBooking.id,
        consent_marketing: consentMarketing,
        user_agent: navigator.userAgent,
      }),
    })
    const signJson = (await signRes.json()) as { error?: string }
    if (!signRes.ok) {
      alert(signJson.error ?? "Не удалось зафиксировать подпись договора.")
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

  const goBackStep = () => {
    if (step === 2) {
      setStep(1)
      if (selectedBox && isSizeType(selectedBox.type)) {
        setSelectedSize(selectedBox.type)
        setSizePickPhase("unit")
      }
      return
    }
    if (step === 3 || step === 4) {
      setPhoneError("")
    }
    setStep((s) => s - 1)
  }

  const backToCategories = () => {
    setSelectedBox(null)
    setSelectedSize(null)
    setSizePickPhase("category")
  }

  const boxesInCategory =
    selectedSize === null ? [] : boxes.filter((b) => b.type === selectedSize)

  const canProceed = () => {
    switch (step) {
      case 1:
        return !!selectedBox
      case 2:
        return months > 0 && !!startDate
      case 3:
        return !!(formData.name && formData.email)
      default:
        return true
    }
  }

  const goNext = () => {
    if (step === 3) {
      if (!formData.phone.trim()) {
        setPhoneError("Укажите номер телефона")
        return
      }
      setPhoneError("")
    }
    setStep((s) => s + 1)
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
                  {sizePickPhase === "category" ? (
                    <>
                      <h1 className="text-headline mb-2 text-2xl md:text-3xl">
                        Выберите категорию размера
                      </h1>
                      <p className="mb-6 text-muted-foreground">
                        Сначала XS, S, M или L — затем конкретную ячейку
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {SIZE_ORDER.map((size) => (
                          <Card
                            key={size}
                            onClick={() => {
                              setSelectedSize(size)
                              setSizePickPhase("unit")
                            }}
                            className="cursor-pointer p-5 transition-all hover:border-primary/50"
                          >
                            <div className="mb-2 flex items-center justify-between">
                              <span className="text-headline text-2xl">
                                {SIZE_META[size].title}
                              </span>
                              <span className="rounded-full bg-secondary px-3 py-1 text-sm">
                                категория
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {SIZE_META[size].hint}
                            </p>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="mb-4">
                        <Button
                          type="button"
                          variant="ghost"
                          className="px-0 text-muted-foreground hover:text-foreground"
                          onClick={backToCategories}
                        >
                          ← К категориям
                        </Button>
                      </div>
                      <h1 className="text-headline mb-2 text-2xl md:text-3xl">
                        Выберите ячейку ({selectedSize})
                      </h1>
                      <p className="mb-6 text-muted-foreground">
                        Подберите конкретный бокс в выбранной категории
                      </p>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {boxesInCategory.map((box) => (
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
                              <span className="text-sm font-normal text-muted-foreground">
                                {" "}
                                / мес
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
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
                    {rentalEndIso ? (
                      <p className="mt-3 text-sm text-muted-foreground">
                        Аренда до{" "}
                        <span className="font-medium text-foreground">
                          {formatDateRuLong(rentalEndIso)}
                        </span>
                      </p>
                    ) : null}
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
                        onChange={(e) => {
                          setPhoneError("")
                          setFormData((prev) => ({ ...prev, phone: e.target.value }))
                        }}
                        placeholder="+7 (999) 123-45-67"
                        aria-invalid={!!phoneError}
                      />
                      {phoneError ? (
                        <p className="mt-1.5 text-sm text-destructive">{phoneError}</p>
                      ) : null}
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
                      <span className="font-medium">{formatDateRuLong(startDate)}</span>
                    </div>
                    {rentalEndIso ? (
                      <div className="flex items-center justify-between p-4">
                        <span className="text-muted-foreground">Дата окончания</span>
                        <span className="font-medium">{formatDateRuLong(rentalEndIso)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center justify-between p-4">
                      <span className="text-muted-foreground">Контакт</span>
                      <span className="font-medium">{formData.name}</span>
                    </div>
                  </Card>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consent-docs"
                        checked={consentDocs}
                        onCheckedChange={(v) => setConsentDocs(v === true)}
                      />
                      <div className="min-w-0 flex-1 space-y-2 text-sm leading-relaxed">
                        <label
                          htmlFor="consent-docs"
                          className="block cursor-pointer font-normal"
                        >
                          Я ознакомлен и согласен с документами:
                        </label>
                        <ul className="list-inside list-disc space-y-1 pl-0.5 text-muted-foreground">
                          <li>
                            <Link
                              href="/legal/contract"
                              target="_blank"
                              className="text-primary hover:underline"
                            >
                              Договор аренды
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/legal/offer"
                              target="_blank"
                              className="text-primary hover:underline"
                            >
                              Публичная оферта
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/legal/rules"
                              target="_blank"
                              className="text-primary hover:underline"
                            >
                              Правила пользования боксами
                            </Link>
                          </li>
                          <li>
                            <Link
                              href="/legal/privacy"
                              target="_blank"
                              className="text-primary hover:underline"
                            >
                              Политика обработки персональных данных
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {CROSSBORDER_TRANSFER ? (
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="consent-crossborder"
                          checked={consentCrossborder}
                          onCheckedChange={(v) => setConsentCrossborder(v === true)}
                        />
                        <Label
                          htmlFor="consent-crossborder"
                          className="block cursor-pointer font-normal leading-relaxed"
                        >
                          Согласен на трансграничную передачу персональных данных (ст. 12 152-ФЗ)
                        </Label>
                      </div>
                    ) : null}

                    <div className="flex items-start gap-3">
                      <Checkbox
                        id="consent-marketing"
                        checked={consentMarketing}
                        onCheckedChange={(v) => setConsentMarketing(v === true)}
                      />
                      <Label
                        htmlFor="consent-marketing"
                        className="block cursor-pointer font-normal leading-relaxed"
                      >
                        Согласен получать рекламные рассылки
                      </Label>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-muted-foreground">
                    После подтверждения вы перейдёте к безопасной оплате через ЮKassa.
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
                    <div className="mb-4 flex gap-3 rounded-xl border border-border bg-card/80 p-4">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"
                        aria-hidden
                      >
                        <Package className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="font-semibold leading-snug">{selectedBox.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {selectedBox.type} · №{selectedBox.number} · {selectedBox.size_m2} м²
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {selectedBox.price_month.toLocaleString("ru-RU")} ₽/мес
                        </div>
                      </div>
                    </div>

                    {rentalEndIso && startDate ? (
                      <p className="mb-4 text-sm text-muted-foreground">
                        Период:{" "}
                        <span className="text-foreground">
                          {formatDateRuLong(startDate)} — {formatDateRuLong(rentalEndIso)}
                        </span>
                      </p>
                    ) : null}

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

                <div
                  className={cn(
                    "mt-6 flex min-w-0 gap-2",
                    step === 4 && "flex-col sm:flex-row",
                  )}
                >
                  {step > 1 && (
                    <Button
                      variant="outline"
                      onClick={goBackStep}
                      className="min-w-0 flex-1 !shrink"
                    >
                      Назад
                    </Button>
                  )}
                  {step < 4 ? (
                    <Button
                      onClick={goNext}
                      disabled={!canProceed()}
                      className="min-w-0 flex-1 !shrink"
                    >
                      Далее
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSubmit}
                      disabled={submitting || !requiredConsentsMet}
                      className="min-w-0 flex-1 !shrink"
                    >
                      {submitting ? "Оплата…" : "Перейти к оплате"}
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
