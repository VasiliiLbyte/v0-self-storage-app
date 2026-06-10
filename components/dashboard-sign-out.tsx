"use client"

import type { ComponentProps } from "react"
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
      <form action="/auth/logout" method="post">
        <Button
          type="submit"
          variant="ghost"
          className={cn(
            "gap-2 text-muted-foreground hover:text-foreground w-full justify-start",
            className,
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          Выйти
        </Button>
      </form>
    )
  }

  return (
    <form action="/auth/logout" method="post">
      <Button type="submit" variant={variant} className={className}>
        Выйти
      </Button>
    </form>
  )
}
