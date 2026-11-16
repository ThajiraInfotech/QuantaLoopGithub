import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LandingFinalCta } from "@/components/landing/landing-final-cta";
import {
  landingCardHover,
  landingContainer,
  landingSectionY,
} from "@/components/landing/landing-styles";
import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { MarketingFaq } from "@/components/marketing/marketing-faq";
import { MarketingPageHeader } from "@/components/marketing/marketing-page-header";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { asFaqItems } from "@/lib/marketing-i18n";
import { getPublicMaterialCategories } from "@/lib/marketing-pages";
import {
  INDEX_ROBOTS,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("marketingPages.materials");
  const title = t("title");
  const description = t("description");
  return {
    title,
    description,
    alternates: { canonical: ROUTES.publicMaterials },
    robots: INDEX_ROBOTS,
    openGraph: {
      title: `${title} · ${SITE_NAME}`,
      description,
      url: ROUTES.publicMaterials,
      type: "website",
    },
  };
}

export default async function MaterialsHubPage() {
  const t = await getTranslations("marketingPages.materials");
  const tCommon = await getTranslations("marketingPages.common");
  const faqs = asFaqItems(t.raw("faqs"));
  const categories = getPublicMaterialCategories();
  const crumbs = [
    { name: tCommon("home"), path: ROUTES.home },
    { name: t("crumb"), path: ROUTES.publicMaterials },
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
      <section
        className={`border-b border-border bg-background ${landingSectionY}`}
      >
        <div className={landingContainer}>
          <ul className="grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.slug}>
                <Card
                  variant="default"
                  className={landingCardHover(
                    "h-full border-border bg-card shadow-card"
                  )}
                >
                  <CardContent className="flex h-full flex-col p-5 sm:p-6">
                    <h2 className="font-heading text-lg font-semibold text-foreground">
                      {category.name}
                    </h2>
                    <p className="mt-2 flex-1 text-small leading-relaxed text-muted-foreground">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <MarketingFaq title={tCommon("faqTitle")} faqs={faqs} />
      <LandingFinalCta />
    </MarketingShell>
  );
}
