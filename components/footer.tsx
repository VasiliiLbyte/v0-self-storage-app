"use client"

import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { getSiteEmail, getSitePhone, getSitePhoneDisplay, SITE_ADDRESS } from "@/lib/site-config"

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-accent text-accent-foreground overflow-hidden">
      {/* Large background text */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden select-none">
        <div className="max-w-full text-[20vw] font-black leading-none tracking-tighter whitespace-nowrap text-background/[0.03] dark:text-foreground/[0.03]">
          ТВОЙ
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 md:py-24">
        {/* Top section with CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16 md:mb-24 text-center"
        >
          <h2 className="text-3xl font-black tracking-tight md:text-5xl lg:text-6xl mb-6">
            Готовы освободить <span className="text-primary">пространство</span>?
          </h2>
          <p className="text-lg text-accent-foreground/70 max-w-xl mx-auto mb-8">
            Забронируйте бокс онлайн за 2 минуты. Скидка 5% от 3 месяцев, 10% от 6.
          </p>
          <Link
            href="/booking"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-5 rounded-full font-semibold text-lg transition-transform hover:scale-105"
          >
            Забронировать бокс
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>

        {/* Links grid */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-16">
          <div>
            <Link href="/" className="mb-6 flex items-center gap-3 group">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105">
                <Image
                  src="/images/pelican_logo_white_200px.webp"
                  alt="ПЕЛИКАН"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <span className="text-2xl font-bold tracking-tight">ПЕЛИКАН</span>
            </Link>
            <p className="text-sm leading-relaxed text-accent-foreground/60">
              Современный склад для хранения вещей в Санкт-Петербурге. Работаем с 2020 года.
            </p>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-accent-foreground/40">Услуги</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/booking", label: "Аренда бокса" },
                { href: "/#calculator", label: "Калькулятор" },
                { href: "/#benefits", label: "Преимущества" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-accent-foreground/70 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-accent-foreground/40">Документы</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/legal/offer", label: "Публичная оферта" },
                { href: "/legal/rules", label: "Правила пользования боксами" },
                { href: "/legal/prohibited", label: "Перечень запрещённых вещей" },
                { href: "/legal/privacy", label: "Политика конфиденциальности" },
                { href: "/legal/terms", label: "Пользовательское соглашение" },
                { href: "/legal/contract", label: "Типовой договор" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-accent-foreground/70 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-accent-foreground/40">Клиентам</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: "/auth/login", label: "Личный кабинет" },
                { href: "/#reviews", label: "Отзывы" },
                { href: "/#faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-accent-foreground/70 transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-5 text-xs font-semibold uppercase tracking-widest text-accent-foreground/40">Контакты</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`tel:${getSitePhone()}`} className="text-accent-foreground/70 transition-colors hover:text-primary font-mono">
                  {getSitePhoneDisplay()}
                </a>
              </li>
              <li>
                <a href={`mailto:${getSiteEmail()}`} className="text-accent-foreground/70 transition-colors hover:text-primary">
                  {getSiteEmail()}
                </a>
              </li>
              <li className="text-accent-foreground/70">
                {SITE_ADDRESS}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-6 border-t border-border/30 pt-8 md:flex-row">
          <p className="text-sm text-accent-foreground/40">
            © {new Date().getFullYear()} ПЕЛИКАН. Все права защищены.
          </p>
          
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="text-accent-foreground/40 transition-colors hover:text-primary"
              aria-label="Telegram"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
            </a>
            <a
              href="#"
              className="text-accent-foreground/40 transition-colors hover:text-primary"
              aria-label="WhatsApp"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
            </a>
            <a
              href="#"
              className="text-accent-foreground/40 transition-colors hover:text-primary"
              aria-label="VK"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.408 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.862-.525-2.049-1.714-1.033-1.01-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.254-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.049.17.474-.085.716-.576.716z"/>
              </svg>
            </a>
          </div>

          <div className="text-xs text-accent-foreground/30 font-mono">
            v0.skladtvoy.ru
          </div>
        </div>
      </div>
    </footer>
  )
}
