import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/landing/cta-link";
import { NetworkVisual } from "@/components/landing/network-visual";
import { ROUTES } from "@/constants/routes";

function TrustCheck({ children }: { children: ReactNode }) {
  return (
    <li className="flex min-w-0 items-start gap-2 text-small text-muted-foreground">
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
        aria-hidden
      >
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <path
            d="M2 5.2 4.1 7.3 8 3.4"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      {children}
    </li>
  );
}

export async function LandingHero() {
  const t = await getTranslations("landing.hero");
  const tNav = await getTranslations("landing.nav");
  const tCommon = await getTranslations("common");

  const trustItems = [
    t("trust1"),
    t("trust2"),
    t("trust3"),
    t("trust4"),
  ] as const;

  return (
    <section className="overflow-x-hidden border-b border-border bg-background">
      <div className="mx-auto grid w-full max-w-[86rem] items-center gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 lg:grid-cols-2 lg:gap-8 lg:px-10 lg:py-14 xl:gap-10">
        <div className="flex min-w-0 flex-col lg:pr-4">
          <p className="text-eyebrow">{t("eyebrow")}</p>

          <h1 className="mt-2 font-heading text-[1.625rem] font-bold leading-[1.12] tracking-[-0.03em] text-balance text-foreground min-[400px]:text-[1.75rem] sm:text-[2.125rem] lg:text-[2.5rem] xl:text-[2.75rem] xl:leading-[1.1]">
            <span className="block">{t("titleLine1")}</span>
            <span className="block">{t("titleLine2")}</span>
          </h1>

          <div className="mt-4 space-y-2 sm:mt-5">
            <p className="text-base font-medium leading-relaxed text-foreground sm:text-[1.0625rem] sm:leading-[1.6]">
              {t("description")}
            </p>
            <p className="text-small font-medium text-foreground sm:text-base">
              {t("materials")}
            </p>
            <p className="text-small leading-relaxed text-muted-foreground sm:text-base">
              {t("quantityNote")}
            </p>
          </div>

          <ul className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 min-[420px]:grid-cols-2 sm:mt-5">
            {trustItems.map((item) => (
              <TrustCheck key={item}>{item}</TrustCheck>
            ))}
          </ul>

          <div className="mt-5 flex w-full flex-col gap-3 min-[480px]:flex-row min-[480px]:flex-wrap sm:mt-6">
            <CtaLink
              href={ROUTES.onboardingRole}
              variant="primary"
              size="lg"
              className="w-full min-[480px]:w-auto transition-shadow hover:shadow-card"
            >
              {tCommon("getStarted")}
            </CtaLink>
            <CtaLink
              href="#how-it-works"
              variant="outline"
              size="lg"
              className="w-full min-[480px]:w-auto transition-shadow hover:shadow-subtle"
            >
              {tNav("howItWorks")}
            </CtaLink>
          </div>
        </div>

        <div className="flex min-w-0 w-full items-center lg:pl-2">
          <NetworkVisual className="w-full" />
        </div>
      </div>
    </section>
  );
}
