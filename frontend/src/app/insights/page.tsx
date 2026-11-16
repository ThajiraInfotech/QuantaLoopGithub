import type { Metadata } from "next";

import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import { InsightsIndex } from "@/components/marketing/insights-index";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ROUTES } from "@/constants/routes";
import { INSIGHTS_FAQS, MARKETING_META } from "@/lib/marketing-pages";
import {
  INDEX_ROBOTS,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/lib/seo";
import { fetchPublishedInsights } from "@/services/content-insights/content-insight.service";

export const dynamic = "force-dynamic";

const crumbs = [
  { name: "Home", path: ROUTES.home },
  { name: "Insights", path: ROUTES.publicInsights },
];

export const metadata: Metadata = {
  title: MARKETING_META.insights.title,
  description: MARKETING_META.insights.description,
  alternates: { canonical: ROUTES.publicInsights },
  robots: INDEX_ROBOTS,
  openGraph: {
    title: `${MARKETING_META.insights.title} · ${SITE_NAME}`,
    description: MARKETING_META.insights.description,
    url: ROUTES.publicInsights,
    type: "website",
  },
};

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function InsightsIndexPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const articles = await fetchPublishedInsights({ limit: 100 });

  return (
    <MarketingShell>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <JsonLd data={buildFaqJsonLd(INSIGHTS_FAQS)} />
      <MarketingBreadcrumbs items={crumbs} />
      <MarketingPageHeader
        eyebrow="Guides"
        title={MARKETING_META.insights.title}
        description={MARKETING_META.insights.description}
      />
      <InsightsIndex articles={articles} page={page} />
      <MarketingFaq faqs={INSIGHTS_FAQS} />
      <LandingFinalCta />
    </MarketingShell>
  );
}
