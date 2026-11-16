import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { InsightArticleView } from "@/components/marketing/insight-article-view";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ROUTES } from "@/constants/routes";
import {
  INDEX_ROBOTS,
  SITE_NAME,
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
} from "@/lib/seo";
import {
  fetchPublishedInsightBySlug,
  fetchPublishedInsights,
} from "@/services/content-insights/content-insight.service";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchPublishedInsightBySlug(slug);
  if (!article) {
    return { title: "Insight", robots: { index: false } };
  }

  const path = ROUTES.publicInsight(article.slug);

  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: path },
    robots: INDEX_ROBOTS,
    openGraph: {
      title: `${article.title} · ${SITE_NAME}`,
      description: article.description,
      url: path,
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      modifiedTime: article.updatedAt ?? undefined,
    },
  };
}

export default async function InsightArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchPublishedInsightBySlug(slug);
  if (!article) notFound();

  const path = ROUTES.publicInsight(article.slug);
  const crumbs = [
    { name: "Home", path: ROUTES.home },
    { name: "Insights", path: ROUTES.publicInsights },
    { name: article.title, path },
  ];

  const more = (await fetchPublishedInsights({ limit: 6 }))
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3);

  const published =
    article.publishedAt ?? article.createdAt ?? new Date().toISOString();

  return (
    <MarketingShell>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <JsonLd
        data={buildArticleJsonLd({
          title: article.title,
          description: article.description,
          path,
          datePublished: published,
          dateModified: article.updatedAt ?? published,
          keywords: article.tags,
        })}
      />
      <MarketingBreadcrumbs items={crumbs} />
      <InsightArticleView article={article} more={more} />
    </MarketingShell>
  );
}
