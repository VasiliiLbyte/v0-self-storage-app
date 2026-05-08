"use client"

import type { ComponentProps } from "react"
import Link from "next/link"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ButtonVariant = NonNullable<ComponentProps<typeof Button>["variant"]>

export function DashboardSignOut({
  className,
  variant = "outline",
  appearance = "button",
}: {
  className?: string
  variant?: ButtonVariant
  appearance?: "button" | "sidebar"
}) {
  if (appearance === "sidebar") {
    return (
      <Button
        asChild
        type="button"
        variant="ghost"
        className={cn("gap-2 text-muted-foreground hover:text-foreground", className)}
      >
        <Link href="/auth/logout">
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          Выйти
        </Link>
      </Button>
    )
  }

  return (
    <Button asChild type="button" variant={variant} className={className}>
      <Link href="/auth/logout">Выйти</Link>
    </Button>
  )
}
