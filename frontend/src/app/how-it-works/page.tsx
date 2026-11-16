import type { Metadata } from "next";

import { LandingAccessProcess } from "@/components/landing/landing-access-process";
import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { LandingHowItWorks } from "@/components/landing/landing-how-it-works";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ROUTES } from "@/constants/routes";
import { HOW_IT_WORKS_FAQS, MARKETING_META } from "@/lib/marketing-pages";
import {
  INDEX_ROBOTS,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/lib/seo";

const crumbs = [
  { name: "Home", path: ROUTES.home },
  { name: "How It Works", path: ROUTES.howItWorks },
];

export const metadata: Metadata = {
  title: MARKETING_META.howItWorks.title,
  description: MARKETING_META.howItWorks.description,
  alternates: { canonical: ROUTES.howItWorks },
  robots: INDEX_ROBOTS,
  openGraph: {
    title: `${MARKETING_META.howItWorks.title} · ${SITE_NAME}`,
    description: MARKETING_META.howItWorks.description,
    url: ROUTES.howItWorks,
    type: "website",
  },
};

export default function HowItWorksPage() {
  return (
    <MarketingShell>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <JsonLd data={buildFaqJsonLd(HOW_IT_WORKS_FAQS)} />
      <MarketingBreadcrumbs items={crumbs} />
      <MarketingPageHeader
        eyebrow="Process"
        title={MARKETING_META.howItWorks.title}
        description={MARKETING_META.howItWorks.description}
      />
      <LandingHowItWorks omitHeader />
      <LandingAccessProcess />
      <MarketingFaq faqs={HOW_IT_WORKS_FAQS} />
      <LandingFinalCta />
    </MarketingShell>
  );
}
