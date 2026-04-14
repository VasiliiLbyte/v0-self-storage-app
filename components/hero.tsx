import Link from "next/link"
import { Button } from "@/components/ui/button"

export function Hero() {
  return (
    <section className="relative overflow-hidden py-20 md:py-32">
      {/* Decorative background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-1/2 translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] translate-y-1/2 -translate-x-1/2 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Работаем 24/7, без выходных</span>
            </div>

            <h1 className="text-display mb-6 text-4xl md:text-5xl lg:text-6xl">
              Ваши вещи в&nbsp;
              <span className="text-primary">надёжных</span>
              &nbsp;руках
            </h1>

            <p className="mb-8 text-lg leading-relaxed text-muted-foreground md:text-xl">
              Современный склад для хранения вещей в Москве. 
              Климат-контроль, видеонаблюдение, доступ в любое время. 
              Бронируйте онлайн за 2 минуты.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild className="h-12 px-8 text-base">
                <Link href="/booking">
                  Забронировать бокс
                  <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-12 px-8 text-base">
                <Link href="/#calculator">Рассчитать стоимость</Link>
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-8 border-t border-border pt-8">
              <div>
                <div className="text-headline text-2xl">500+</div>
                <div className="text-sm text-muted-foreground">Довольных клиентов</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-headline text-2xl">от 1 990 ₽</div>
                <div className="text-sm text-muted-foreground">в месяц</div>
              </div>
              <div className="h-10 w-px bg-border" />
              <div>
                <div className="text-headline text-2xl">4.9</div>
                <div className="text-sm text-muted-foreground">Рейтинг</div>
              </div>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="aspect-square rounded-3xl bg-gradient-to-br from-secondary to-muted p-8">
              {/* Storage illustration */}
              <div className="grid h-full grid-cols-3 gap-3">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-xl transition-all duration-300 ${
                      i === 4 
                        ? "bg-primary shadow-lg" 
                        : i % 3 === 0 
                          ? "bg-accent/80" 
                          : "bg-card border border-border"
                    }`}
                  />
                ))}
              </div>
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-6 -left-6 rounded-2xl border border-border bg-card p-4 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-500/10">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold">Бокс забронирован</div>
                  <div className="text-sm text-muted-foreground">Только что</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
