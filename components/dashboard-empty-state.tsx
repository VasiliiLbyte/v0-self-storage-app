import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type DashboardEmptyStateProps = {
  icon: LucideIcon
  title: string
  description?: string
  action?: { label: string; href: string }
  className?: string
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: DashboardEmptyStateProps) {
  return (
    <Card
      className={cn(
        "flex flex-col items-center justify-center px-6 py-12 text-center sm:py-14",
        className,
      )}
    >
      <div
        className="mb-4 flex items-center justify-center text-primary"
        aria-hidden
      >
        <Icon className="h-12 w-12" strokeWidth={1.5} />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {action ? (
        <Button asChild className="mt-6">
          <Link href={action.href}>{action.label}</Link>
        </Button>
      ) : null}
    </Card>
  )
}
