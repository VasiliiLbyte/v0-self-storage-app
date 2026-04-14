"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { createClient } from "@/lib/supabase/client"
import type { User } from "@supabase/supabase-js"

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <span className="text-lg font-black text-primary-foreground">С</span>
          </div>
          <span className="text-xl font-bold tracking-tight">СкладТвой</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link href="/#calculator" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Калькулятор
          </Link>
          <Link href="/#benefits" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Преимущества
          </Link>
          <Link href="/#reviews" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
            Отзывы
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
          ) : user ? (
            <Button asChild>
              <Link href="/dashboard">Личный кабинет</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex">
                <Link href="/auth/login">Войти</Link>
              </Button>
              <Button asChild>
                <Link href="/booking">Забронировать</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
