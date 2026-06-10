import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { HowItWorks } from "@/components/how-it-works"
import { Calculator } from "@/components/calculator"
import { Benefits } from "@/components/benefits"
import { Reviews } from "@/components/reviews"
import { Faq } from "@/components/faq"
import { LocationSection } from "@/components/location-section"
import { Footer } from "@/components/footer"

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <HowItWorks />
        <Calculator />
        <Benefits />
        <Reviews />
        <Faq />
        <LocationSection />
      </main>
      <Footer />
    </>
  )
}
