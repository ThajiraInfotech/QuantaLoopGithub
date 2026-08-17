import { Check } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { CtaLink } from "@/components/landing/cta-link";
import { LandingValueComparison } from "@/components/landing/landing-value-comparison";
import {
  landingCardHover,
  landingSectionY,
  landingStackGap,
} from "@/components/landing/landing-styles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";

function FeatureItem({ children }: { children: string }) {
  return (
    <li className="flex gap-3 text-small leading-snug text-muted-foreground">
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
        aria-hidden
      >
        <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function TrustIndicator({ children }: { children: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-small text-muted-foreground">
      <span
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
        aria-hidden
      >
        <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
      </span>
      {children}
    </span>
  );
}

export async function LandingPricing() {
  const t = await getTranslations("landing.pricing");
  const membershipFeatures = t.raw("features") as string[];
  const trustIndicators = t.raw("trustIndicators") as string[];

  return (
    <section
      id="access"
      className={cn(
        "scroll-mt-20 border-b border-border bg-muted/30",
        landingSectionY
      )}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 font-heading text-[clamp(2rem,3vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.02em] text-foreground text-balance">
            {t("title")}
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-[22px] leading-[1.6] text-muted-foreground sm:mt-6">
            {t("description")}
          </p>
        </div>

        <div className={cn("mx-auto max-w-[560px]", landingStackGap)}>
          <Card
            variant="default"
            className={landingCardHover("border-border/90 bg-card shadow-card")}
          >
            <CardContent className="p-8 sm:p-10">
              <h3 className="font-heading text-[1.5rem] font-semibold leading-snug text-card-foreground sm:text-h3">
                {t("membershipTitle")}
              </h3>
              <p className="mt-3 text-body leading-relaxed text-muted-foreground">
                {t("membershipDescription")}
              </p>

              <div className="mt-8 border-t border-border/80 pt-8">
                <div className="flex flex-wrap items-end gap-3">
                  <p className="font-heading text-[clamp(2rem,3vw,2.5rem)] font-bold leading-none tracking-[-0.02em] text-foreground">
                    {t("price")}
                    <span className="text-h4 font-medium text-muted-foreground">
                      {t("perYear")}
                    </span>
                  </p>
                  <Badge
                    variant="accent"
                    className="mb-1 px-3 py-1 text-small font-semibold"
                  >
                    {t("trialBadge")}
                  </Badge>
                </div>
                <p className="mt-3 text-small text-muted-foreground">
                  {t("dailyCost")}
                </p>
                <p className="mt-3 text-small font-medium leading-relaxed text-foreground/90">
                  {t("roiNote")}
                </p>
              </div>

              <ul className="mt-8 flex flex-col gap-3.5 border-t border-border/80 pt-8">
                {membershipFeatures.map((feature) => (
                  <FeatureItem key={feature}>{feature}</FeatureItem>
                ))}
              </ul>

              <div
                className="mt-8 flex flex-col gap-3 border-t border-border/80 pt-8 md:flex-row md:flex-wrap md:justify-center md:gap-x-8 md:gap-y-2"
                role="list"
                aria-label={t("trustAria")}
              >
                {trustIndicators.map((item) => (
                  <TrustIndicator key={item}>{item}</TrustIndicator>
                ))}
              </div>

              <div className="mt-8 border-t border-border/80 pt-8 sm:mt-9">
                <CtaLink
                  href={ROUTES.onboardingRole}
                  variant="accent"
                  size="lg"
                  className="w-full sm:w-auto sm:min-w-[240px]"
                >
                  {t("cta")}
                </CtaLink>
                <p className="mt-4 text-caption leading-relaxed text-muted-foreground">
                  {t("trialNote")}
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-small leading-relaxed text-muted-foreground">
            {t("enterprisePrefix")}{" "}
            <a
              href="mailto:enterprise@quantaloop.com?subject=Enterprise%20Network%20Access"
              className="font-medium text-foreground underline-offset-4 transition-colors hover:text-accent hover:underline"
            >
              {t("enterpriseContact")}
            </a>{" "}
            {t("enterpriseSuffix")}
          </p>
        </div>

        <LandingValueComparison />
      </div>
    </section>
  );
}
