"use client"

import { DashboardNav } from "@/components/dashboard-nav"
import { DashboardSignOut } from "@/components/dashboard-sign-out"

export function DashboardShellClient({
  children,
  displayName,
  email,
  initials,
}: {
  children: React.ReactNode
  displayName: string
  email: string
  initials: string
}) {
  return (
    <div className="flex w-full min-h-[calc(100vh-4rem)]">
      <aside className="hidden min-h-[calc(100vh-4rem)] w-60 shrink-0 flex-col border-r border-border bg-card px-3 py-6 md:flex">
        <div className="mb-6 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <DashboardNav variant="desktop" />
        </div>

        <div className="mt-auto border-t border-border pt-4">
          <DashboardSignOut appearance="sidebar" className="w-full justify-start" />
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-4 py-6 pb-28 md:py-10 md:pb-10">
          {children}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <div className="flex justify-center border-b border-border px-2 py-2">
          <DashboardSignOut appearance="sidebar" className="h-9 justify-center px-4" />
        </div>
        <DashboardNav variant="mobile" />
      </div>
    </div>
  )
}
