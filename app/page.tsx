import { LandingHeader } from "@/components/landing-header"
import { HeroSection } from "@/components/hero-section"
import { TrustedBySection } from "@/components/trusted-by-section"
import { FeaturesSection } from "@/components/features-section"
import { IndustriesSection } from "@/components/industries-section"
import { DashboardShowcase } from "@/components/dashboard-showcase"
import { TestimonialsSection } from "@/components/testimonials-section"
import { PricingSection } from "@/components/pricing-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { LandingFooter } from "@/components/landing-footer"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingHeader />
      <main>
        <HeroSection />
        <TrustedBySection />
        <FeaturesSection />
        <IndustriesSection />
        <DashboardShowcase />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
    </div>
  )
}
