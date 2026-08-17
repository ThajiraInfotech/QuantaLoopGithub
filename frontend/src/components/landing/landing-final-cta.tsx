import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/landing/cta-link";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export async function LandingFinalCta() {
  const t = await getTranslations("landing.finalCta");

  return (
    <section
      className={cn(
        "border-b border-border bg-[#F8FAF8]",
        "pt-20 pb-10 sm:pt-28 sm:pb-12"
      )}
    >
      <div className="mx-auto max-w-[900px] px-4 text-center sm:px-6 lg:px-8">
        <p className="text-eyebrow">{t("eyebrow")}</p>
        <h2 className="mt-3 font-heading text-[clamp(2rem,3vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.02em] text-foreground text-balance">
          {t("title")}
        </h2>
        <p className="mx-auto mt-5 max-w-[640px] text-[22px] leading-[1.6] text-muted-foreground sm:mt-6">
          {t("description")}
        </p>

        <div className="mt-10 sm:mt-12">
          <CtaLink
            href={ROUTES.onboardingRole}
            variant="accent"
            size="lg"
            className="min-w-[240px]"
          >
            {t("cta")}
          </CtaLink>
        </div>

        <p className="mt-6 text-small font-medium tracking-wide text-foreground/80 sm:mt-7">
          {t("industries")}
        </p>

        <p className="mt-4 text-caption text-muted-foreground">
          {t("disclaimer")}
        </p>
      </div>
    </section>
  );
}
