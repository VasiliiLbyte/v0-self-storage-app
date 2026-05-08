"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Package,
  CreditCard,
  FileText,
  User,
  KeyRound,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NavItem = {
  href: string
  label: string
  icon: typeof LayoutDashboard
  exact?: boolean
}

const ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookings", label: "Аренды", icon: Package },
  { href: "/dashboard/payments", label: "Платежи", icon: CreditCard },
  { href: "/dashboard/documents", label: "Документы", icon: FileText },
  { href: "/dashboard/profile", label: "Профиль", icon: User },
  { href: "/dashboard/access", label: "Доступ", icon: KeyRound },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function DashboardNav({ variant }: { variant: "desktop" | "mobile" }) {
  const pathname = usePathname()

  if (variant === "mobile") {
    return (
      <nav className="flex justify-around gap-1 px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(pathname, href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors",
                active
                  ? "bg-primary font-semibold text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav className="space-y-1">
      {ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = isActive(pathname, href, exact)
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
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
