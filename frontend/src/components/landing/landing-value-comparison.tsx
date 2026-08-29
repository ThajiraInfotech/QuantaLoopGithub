import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/landing/cta-link";
import { landingStackGap } from "@/components/landing/landing-styles";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

export async function LandingValueComparison() {
  const t = await getTranslations("landing.valueComparison");

  return (
    <div className={cn("mx-auto max-w-6xl", landingStackGap)}>
      <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="max-w-md min-w-0">
          <h3 className="font-heading text-[clamp(1.375rem,2.6vw,2rem)] font-bold leading-[1.15] tracking-[-0.02em] text-balance text-foreground">
            {t("title")}
          </h3>

          <p className="mt-4 text-body leading-relaxed text-muted-foreground">
            {t("description")}
          </p>

          <div className="mt-6">
            <CtaLink
              href={ROUTES.onboardingRole}
              variant="primary"
              size="lg"
              className="w-full sm:w-auto"
            >
              {t("cta")}
            </CtaLink>
          </div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <Image
            src="/images/image.png"
            alt={t("imageAlt")}
            width={640}
            height={360}
            className="h-auto w-full max-w-[32rem] object-contain"
            sizes="(max-width: 1024px) 100vw, 32rem"
          />
        </div>
      </div>
    </div>
  );
}
