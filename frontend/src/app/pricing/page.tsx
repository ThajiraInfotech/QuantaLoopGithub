import type { Metadata } from "next";

import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingPricing } from "@/components/landing/landing-pricing";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ROUTES } from "@/constants/routes";
import { MARKETING_META, PRICING_FAQS } from "@/lib/marketing-pages";
import {
  INDEX_ROBOTS,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/lib/seo";

const crumbs = [
  { name: "Home", path: ROUTES.home },
  { name: "Pricing", path: ROUTES.pricing },
];

export const metadata: Metadata = {
  title: MARKETING_META.pricing.title,
  description: MARKETING_META.pricing.description,
  alternates: { canonical: ROUTES.pricing },
  robots: INDEX_ROBOTS,
  openGraph: {
    title: `${MARKETING_META.pricing.title} · ${SITE_NAME}`,
    description: MARKETING_META.pricing.description,
    url: ROUTES.pricing,
    type: "website",
  },
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <JsonLd data={buildFaqJsonLd(PRICING_FAQS)} />
      <MarketingBreadcrumbs items={crumbs} />
      <MarketingPageHeader
        eyebrow="Membership"
        title={MARKETING_META.pricing.title}
        description={MARKETING_META.pricing.description}
      />
      <LandingPricing omitHeader />
      <MarketingFaq faqs={PRICING_FAQS} />
      <LandingFinalCta />
    </MarketingShell>
  );
}
