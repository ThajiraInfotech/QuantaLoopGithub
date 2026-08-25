import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/landing/cta-link";
import {
  landingHeading,
  landingLeadCentered,
  landingPad,
} from "@/components/landing/landing-styles";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export async function LandingFinalCta() {
  const t = await getTranslations("landing.finalCta");

  return (
    <section
      className={cn(
        "border-b border-border bg-[#F8FAF8]",
        "pt-14 pb-8 sm:pt-20 sm:pb-10 lg:pt-28 lg:pb-12"
      )}
    >
      <div className={cn("mx-auto max-w-[900px] text-center", landingPad)}>
        <p className="text-eyebrow">{t("eyebrow")}</p>
        <h2 className={cn("mt-3", landingHeading)}>{t("title")}</h2>
        <p className={cn(landingLeadCentered, "max-w-[640px]")}>
          {t("description")}
        </p>

        <div className="mt-8 sm:mt-10 lg:mt-12">
          <CtaLink
            href={ROUTES.onboardingRole}
            variant="accent"
            size="lg"
            className="w-full min-[480px]:w-auto min-[480px]:min-w-[240px]"
          >
            {t("cta")}
          </CtaLink>
        </div>

        <p className="mt-5 text-small font-medium tracking-wide text-foreground/80 sm:mt-7">
          {t("industries")}
        </p>

        <p className="mt-3 text-caption text-muted-foreground sm:mt-4">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
