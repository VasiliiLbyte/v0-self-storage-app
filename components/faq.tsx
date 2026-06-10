import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const ITEMS = [
  {
    q: "Как забронировать бокс?",
    a: "Выберите размер и срок на сайте, оформите бронирование онлайн и оплатите первый период. Договор и доступ появятся в личном кабинете после оплаты.",
  },
  {
    q: "Есть ли скидки за длительный срок?",
    a: "Да: 5% при аренде от 3 месяцев, 10% — от 6 месяцев. Точная сумма рассчитывается на шаге бронирования.",
  },
  {
    q: "Как работает доступ к боксу?",
    a: "Доступ круглосуточно, 7 дней в неделю. После оплаты вы получаете индивидуальный код в личном кабинете.",
  },
  {
    q: "Что нельзя хранить в боксе?",
    a: (
      <>
        Запрещены оружие, взрывчатые и легковоспламеняющиеся вещества, наркотики, скоропортящиеся
        продукты, животные и другие предметы из{" "}
        <Link href="/legal/prohibited" className="text-primary hover:underline">
          перечня запрещённых вещей
        </Link>
        .
      </>
    ),
  },
  {
    q: "Можно ли продлить аренду?",
    a: "Да. Продление и история аренд доступны в личном кабинете. Договор автоматически продлевается на тот же срок, если не отключить автопродление.",
  },
]

export function Faq() {
  return (
    <section id="faq" className="border-t border-border bg-background py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-4">
        <span className="mb-3 block text-sm font-medium uppercase tracking-widest text-primary">
          FAQ
        </span>
        <h2 className="mb-10 text-3xl font-black tracking-tight md:text-4xl">
          Частые вопросы
        </h2>
        <Accordion type="single" collapsible className="w-full">
          {ITEMS.map((item, i) => (
            <AccordionItem key={i} value={`item-${i}`}>
              <AccordionTrigger className="text-left text-base font-semibold">
                {item.q}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed">
                {item.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
