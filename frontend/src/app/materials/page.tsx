import type { Metadata } from "next";

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
import {
  MATERIALS_FAQS,
  MARKETING_META,
  getPublicMaterialCategories,
} from "@/lib/marketing-pages";
import {
  INDEX_ROBOTS,
  SITE_NAME,
  buildBreadcrumbJsonLd,
  buildFaqJsonLd,
} from "@/lib/seo";

const crumbs = [
  { name: "Home", path: ROUTES.home },
  { name: "Materials", path: ROUTES.publicMaterials },
];

export const metadata: Metadata = {
  title: MARKETING_META.materials.title,
  description: MARKETING_META.materials.description,
  alternates: { canonical: ROUTES.publicMaterials },
  robots: INDEX_ROBOTS,
  openGraph: {
    title: `${MARKETING_META.materials.title} · ${SITE_NAME}`,
    description: MARKETING_META.materials.description,
    url: ROUTES.publicMaterials,
    type: "website",
  },
};

export default function MaterialsHubPage() {
  const categories = getPublicMaterialCategories();

  return (
    <MarketingShell>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <JsonLd data={buildFaqJsonLd(MATERIALS_FAQS)} />
      <MarketingBreadcrumbs items={crumbs} />
      <MarketingPageHeader
        eyebrow="Categories"
        title={MARKETING_META.materials.title}
        description={MARKETING_META.materials.description}
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
      <MarketingFaq faqs={MATERIALS_FAQS} />
      <LandingFinalCta />
    </MarketingShell>
  );
}
