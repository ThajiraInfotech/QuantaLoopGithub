import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { MarketingHeader } from "@/components/layout/marketing-header";
import { OnboardingProgress } from "@/components/onboarding/onboarding-progress";
import { OnboardingTrustBanner } from "@/components/onboarding/onboarding-trust-banner";
import { OnboardingTrustNotes } from "@/components/onboarding/onboarding-trust-notes";
import { RoleSelectionCards } from "@/components/onboarding/role-selection-cards";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("onboarding.role");
  return { title: t("title") };
}

const ghostLink =
  "text-sm font-medium text-zinc-700 underline-offset-4 hover:underline";

export default async function RoleSelectionPage() {
  const t = await getTranslations("onboarding.role");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden bg-zinc-50">
      <MarketingHeader variant="onboarding" />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-6 sm:py-12 lg:px-8 lg:py-16">
          <div className="max-w-2xl space-y-4 sm:space-y-5">
            <OnboardingProgress activeStep={1} />
            <OnboardingTrustBanner />
            <div>
              <h1 className="text-[1.625rem] font-semibold tracking-tight text-balance text-zinc-900 sm:text-3xl lg:text-4xl">
                {t("title")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600 sm:mt-4 sm:text-base">
                {t("description")}
              </p>
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            <RoleSelectionCards />
          </div>

          <OnboardingTrustNotes />

          <p className="mt-6 text-sm text-zinc-600 sm:mt-8">
            {t("alreadyOnboarded")}{" "}
            <Link href={ROUTES.login} className={cn(ghostLink)}>
              {tCommon("signIn")}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
