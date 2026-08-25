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
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-zinc-50">
      <MarketingHeader variant="onboarding" />
      <main className="flex-1 px-4 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:py-14">
        <div className={`mx-auto ${widthClass} space-y-5 sm:space-y-6`}>
          <OnboardingProgress activeStep={activeStep} />
          <OnboardingTrustBanner />
          <div>
            <h1 className="text-[1.5rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-zinc-600 sm:mt-3 sm:text-base">
              {description}
            </p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
