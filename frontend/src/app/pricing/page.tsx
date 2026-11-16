import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ROUTES } from "@/constants/routes";
import { asFaqItems } from "@/lib/marketing-i18n";
import {
  INDEX_ROBOTS,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketingPages.pricing");
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    alternates: { canonical: ROUTES.pricing },
    robots: INDEX_ROBOTS,
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: ROUTES.pricing,
      type: "website",
    },
  };
}

export default async function PricingPage() {
  const t = await getTranslations("marketingPages.pricing");
  const tCommon = await getTranslations("marketingPages.common");
  const faqs = asFaqItems(t.raw("faqs"));
  const crumbs = [
    { name: tCommon("home"), path: ROUTES.home },
    { name: t("crumb"), path: ROUTES.pricing },
  ];

  return (
    <MarketingShell>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <JsonLd data={buildFaqJsonLd(faqs)} />
      <MarketingBreadcrumbs items={crumbs} />
      <MarketingPageHeader
        eyebrow={t("eyebrow")}
        title={t("title")}
        description={t("description")}
      />
      <LandingPricing omitHeader />
      <MarketingFaq title={tCommon("faqTitle")} faqs={faqs} />
      <LandingFinalCta />
    </MarketingShell>
  );
}
