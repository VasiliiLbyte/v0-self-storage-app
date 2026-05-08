"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  LayoutGrid,
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
}

const ITEMS: NavItem[] = [
  { href: "/admin", label: "Дашборд", icon: LayoutDashboard, exact: true },
  { href: "/admin/units", label: "Ячейки", icon: LayoutGrid },
  { href: "/admin/bookings", label: "Бронирования", icon: Calendar },
  { href: "/admin/clients", label: "Клиенты", icon: Users },
  { href: "/admin/payments", label: "Платежи", icon: CreditCard },
  { href: "/admin/analytics", label: "Аналитика", icon: BarChart3 },
  { href: "/admin/settings", label: "Настройки", icon: Settings },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AdminNav({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname()

  if (variant === "mobile") {
    return (
      <nav className="flex justify-around gap-0.5 px-0.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-2 text-[9px] font-medium leading-tight transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="line-clamp-2 text-center">{label}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="sticky top-20 space-y-1">
      <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Админ
      </p>
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
