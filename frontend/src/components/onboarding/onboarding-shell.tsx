import { MarketingHeader } from "@/components/layout/marketing-header";
import { OnboardingProgress, type OnboardingStep } from "@/components/onboarding/onboarding-progress";
import { OnboardingTrustBanner } from "@/components/onboarding/onboarding-trust-banner";

type OnboardingShellProps = {
  activeStep: OnboardingStep;
  title: string;
  description: string;
  children: React.ReactNode;
  maxWidth?: "lg" | "xl";
};

export function OnboardingShell({
  activeStep,
  title,
  description,
  children,
  maxWidth = "lg",
}: OnboardingShellProps) {
  const widthClass = maxWidth === "xl" ? "max-w-3xl" : "max-w-2xl";

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <MarketingHeader variant="onboarding" />
      <main className="flex-1 px-4 py-10 sm:py-14">
        <div className={`mx-auto ${widthClass} space-y-6`}>
          <OnboardingProgress activeStep={activeStep} />
          <OnboardingTrustBanner />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:text-base">
              {description}
            </p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
