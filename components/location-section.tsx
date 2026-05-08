export function LocationSection() {
  return (
    <section className="border-t border-border bg-background py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 md:mb-12">
          <span className="mb-3 block text-sm font-medium uppercase tracking-widest text-primary">
            Локация
          </span>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl lg:text-5xl">
            Адрес и как добраться
          </h2>
        </div>

        <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
          <ul className="space-y-4 text-base">
            <li>
              <span className="font-semibold text-foreground">Адрес: </span>
              <span className="text-muted-foreground">
                Мытнинская наб., 5/7, Санкт-Петербург
              </span>
            </li>
            <li>
              <span className="font-semibold text-foreground">Метро: </span>
              <span className="text-muted-foreground">
                Горьковская — 7 минут пешком
              </span>
            </li>
            <li>
              <span className="font-semibold text-foreground">Режим доступа: </span>
              <span className="text-muted-foreground">24/7 без выходных</span>
            </li>
            <li>
              <span className="font-semibold text-foreground">Офис: </span>
              <span className="text-muted-foreground">Пн–Пт 10:00–19:00</span>
            </li>
          </ul>

          <div className="min-h-[280px] overflow-hidden rounded-xl border border-border bg-muted/30 aspect-video lg:min-h-[320px]">
            <iframe
              title="Карта: Мытнинская набережная, Санкт-Петербург"
              src="https://yandex.ru/map-widget/v1/?pt=30.317,59.953&z=16&l=map"
              width="100%"
              height="100%"
              className="h-full min-h-[280px] w-full border-0 lg:min-h-[320px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
