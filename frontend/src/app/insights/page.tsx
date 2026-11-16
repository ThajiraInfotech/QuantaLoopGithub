import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import {
  InsightsIndex,
  INSIGHTS_PAGE_SIZE,
} from "@/components/marketing/insights-index";
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
import { fetchPublishedInsights } from "@/services/content-insights/content-insight.service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketingPages.insights");
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    alternates: { canonical: ROUTES.publicInsights },
    robots: INDEX_ROBOTS,
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: ROUTES.publicInsights,
      type: "website",
    },
  };
}

type PageProps = {
  searchParams: Promise<{ page?: string }>;
};

export default async function InsightsIndexPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);
  const articles = await fetchPublishedInsights({ limit: 100 });
  const t = await getTranslations("marketingPages.insights");
  const tCommon = await getTranslations("marketingPages.common");
  const faqs = asFaqItems(t.raw("faqs"));
  const totalPages = Math.max(1, Math.ceil(articles.length / INSIGHTS_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const crumbs = [
    { name: tCommon("home"), path: ROUTES.home },
    { name: t("crumb"), path: ROUTES.publicInsights },
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
      <InsightsIndex
        articles={articles}
        page={safePage}
        labels={{
          library: t("library"),
          guideCount:
            articles.length === 1
              ? t("guideCountOne", {
                  count: articles.length,
                  page: safePage,
                  totalPages,
                })
              : t("guideCount", {
                  count: articles.length,
                  page: safePage,
                  totalPages,
                }),
          emptyTitle: t("emptyTitle"),
          emptyBody: t("emptyBody"),
        }}
      />
      <MarketingFaq title={tCommon("faqTitle")} faqs={faqs} />
      <LandingFinalCta />
    </MarketingShell>
  );
}
