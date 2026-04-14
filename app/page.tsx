import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Calculator } from "@/components/calculator"
import { Benefits } from "@/components/benefits"
import { Reviews } from "@/components/reviews"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Calculator />
        <Benefits />
        <Reviews />
      </main>
      <Footer />
    </>
  )
}
