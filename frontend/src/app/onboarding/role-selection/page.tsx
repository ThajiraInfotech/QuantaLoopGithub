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
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <MarketingHeader variant="onboarding" />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
          <div className="max-w-2xl space-y-5">
            <OnboardingProgress activeStep={1} />
            <OnboardingTrustBanner />
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl">
                {t("title")}
              </h1>
              <p className="mt-4 text-base leading-relaxed text-zinc-600">
                {t("description")}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <RoleSelectionCards />
          </div>

          <OnboardingTrustNotes />

          <p className="mt-8 text-sm text-zinc-600">
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
