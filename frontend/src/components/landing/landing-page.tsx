import { LandingAccessProcess } from "@/components/landing/landing-access-process";
import { LandingAudience } from "@/components/landing/landing-audience";
import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { LandingNavbar } from "@/components/landing/landing-navbar";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { LandingProblem } from "@/components/landing/landing-problem";
import { LandingRecommendationEngine } from "@/components/landing/landing-recommendation-engine";
import { LandingWhyQuantaLoop } from "@/components/landing/landing-why-quanta-loop";

export async function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingProblem />
        <LandingRecommendationEngine />
        <LandingHowItWorks />
        <LandingAudience />
        <LandingWhyQuantaLoop />
        <LandingPricing />
        <LandingAccessProcess />
        <LandingFinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
