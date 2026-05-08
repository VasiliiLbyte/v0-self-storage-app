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

export function AdminNav({
  variant,
  overdueCount = 0,
}: {
  variant: "desktop" | "mobile"
  overdueCount?: number
}) {
  const pathname = usePathname()

  if (variant === "mobile") {
    return (
      <nav className="flex justify-around gap-0.5 px-0.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact)
          const showOverdue = href === "/admin/bookings" && overdueCount > 0
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-0.5 py-2 text-[9px] font-medium leading-tight transition-colors",
                active
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <span className="relative inline-flex">
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {showOverdue ? (
                  <span
                    className="absolute -right-1.5 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[8px] font-bold leading-none text-destructive-foreground"
                    aria-label={`Просроченных аренд: ${overdueCount}`}
                  >
                    {overdueCount > 99 ? "99" : overdueCount}
                  </span>
                ) : null}
              </span>
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
        const showOverdue = href === "/admin/bookings" && overdueCount > 0
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden />
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
              <span className="truncate">{label}</span>
              {showOverdue ? (
                <span
                  className={cn(
                    "shrink-0 rounded-full bg-destructive px-1.5 py-0.5 text-xs font-semibold tabular-nums text-destructive-foreground",
                    active && "ring-1 ring-destructive-foreground/30",
                  )}
                  aria-label={`Просроченных аренд: ${overdueCount}`}
                >
                  {overdueCount > 999 ? "999+" : overdueCount}
                </span>
              ) : null}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
