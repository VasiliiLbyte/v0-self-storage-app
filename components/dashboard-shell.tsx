"use client"

import { DashboardNav } from "@/components/dashboard-nav"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:py-10">
      <aside className="hidden shrink-0 md:block md:w-52">
        <DashboardNav variant="desktop" />
      </aside>
      <div className="min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
        <DashboardNav variant="mobile" />
      </div>
    </div>
  )
}
