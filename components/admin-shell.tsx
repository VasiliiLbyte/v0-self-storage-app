"use client"

import Link from "next/link"
import { Toaster } from "sonner"
import { AdminNav } from "@/components/admin-nav"

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-3.5rem)]">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
          <Link href="/admin" className="text-sm font-semibold tracking-tight">
            ПЕЛИКАН — админ
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            На сайт
          </Link>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:flex-row md:items-start md:py-8">
        <aside className="hidden shrink-0 md:block md:w-52">
          <AdminNav variant="desktop" />
        </aside>
        <div className="min-w-0 flex-1 pb-24 md:pb-0">{children}</div>
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:hidden">
          <AdminNav variant="mobile" />
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  )
}
