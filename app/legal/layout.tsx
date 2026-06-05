import { Header } from "@/components/header"
import { Footer } from "@/components/footer"

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 md:py-16">
        {children}
      </main>
      <Footer />
    </div>
  )
}
