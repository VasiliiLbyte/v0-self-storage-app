"use client"

import Link from "next/link"
import Image from "next/image"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"
import type { AuthChangeEvent, Session, User } from "@supabase/supabase-js"

const NAV_LINKS = [
  { href: "/#calculator", label: "Калькулятор" },
  { href: "/storage-units", label: "Ячейки" },
  { href: "/#benefits", label: "Почему мы" },
  { href: "/#reviews", label: "Отзывы" },
] as const

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()

    // getSession() reads the session locally without forcing a network token
    // refresh, so it doesn't race the middleware's refresh (single-use refresh
    // tokens would otherwise invalidate each other and log the user out).
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
      },
    )

    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener("scroll", handleScroll)
    }
  }, [])

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      className={`fixed top-0 right-0 left-0 z-50 pt-[env(safe-area-inset-top)] transition-all duration-300 ${
        scrolled
          ? "border-b border-border/50 bg-background/90 shadow-sm backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-20 min-w-0 max-w-7xl items-center justify-between gap-2 px-4">
        {/* Logo */}
        <Link href="/" className="group flex min-w-0 shrink items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary transition-transform group-hover:scale-105">
            <Image
              src="/images/pelican_logo_white_200px.webp"
              alt="ПЕЛИКАН"
              width={32}
              height={32}
              className="object-contain"
              priority
            />
          </div>
          <span className="hidden truncate text-xl font-bold tracking-tight sm:inline">ПЕЛИКАН</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-10 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group relative py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <ThemeToggle />

          {loading ? (
            <div className="h-10 w-20 animate-pulse rounded-full bg-muted sm:w-24" />
          ) : user ? (
            <Button asChild className="rounded-full px-3 sm:px-6">
              <Link href="/dashboard">Кабинет</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden rounded-full sm:inline-flex">
                <Link href="/auth/login">Войти</Link>
              </Button>
              <Button asChild className="rounded-full px-3 sm:px-6">
                <Link href="/booking">
                  <span className="sm:hidden">Бронь</span>
                  <span className="hidden sm:inline">Забронировать</span>
                  <svg className="ml-1 h-4 w-4 sm:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </Button>
            </>
          )}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Открыть меню"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100%,20rem)]">
              <SheetHeader>
                <SheetTitle>Меню</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="rounded-lg px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="mt-4 flex flex-col gap-2 border-t border-border px-4 pt-4">
                {user ? (
                  <Button asChild className="w-full rounded-full">
                    <Link href="/dashboard" onClick={() => setMenuOpen(false)}>
                      Кабинет
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" asChild className="w-full rounded-full">
                      <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                        Войти
                      </Link>
                    </Button>
                    <Button asChild className="w-full rounded-full">
                      <Link href="/booking" onClick={() => setMenuOpen(false)}>
                        Забронировать
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </motion.header>
  )
}
