import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { JsonLd } from "@/components/marketing/json-ld";
import { MarketingBreadcrumbs } from "@/components/marketing/marketing-breadcrumbs";
import { MarketingShell } from "@/components/marketing/marketing-shell";
import { ContactSupportForm } from "@/components/support/contact-support-form";
import { LEGAL_SUPPORT_EMAIL } from "@/constants/legal";
import { ROUTES } from "@/constants/routes";
import { INDEX_ROBOTS, buildBreadcrumbJsonLd } from "@/lib/seo";

const crumbs = [
  { name: "Home", path: ROUTES.home },
  { name: "Contact", path: ROUTES.contact },
];

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("support");
  const title = t("metaTitle");
  const description = t("metaDescription");
  return {
    title,
    description,
    alternates: {
      canonical: ROUTES.contact,
    },
    robots: INDEX_ROBOTS,
    openGraph: {
      title,
      description,
      url: ROUTES.contact,
      type: "website",
    },
  };
}

export default async function ContactPage() {
  const t = await getTranslations("support");

  return (
    <MarketingShell>
      <JsonLd data={buildBreadcrumbJsonLd(crumbs)} />
      <MarketingBreadcrumbs items={crumbs} />
      <div className="flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto w-full max-w-xl">
          <p className="text-eyebrow text-muted-foreground">{t("eyebrow")}</p>
          <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-body leading-relaxed text-muted-foreground">
            {t("pageDescription")}
          </p>
          <p className="mt-2 text-body leading-relaxed text-muted-foreground">
            {t("directEmail")}{" "}
            <a
              href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
              className="font-medium text-foreground underline underline-offset-2 hover:text-foreground/80"
            >
              {LEGAL_SUPPORT_EMAIL}
            </a>
          </p>
          <div className="mt-8 rounded-2xl border border-border/80 bg-card p-5 shadow-subtle sm:p-8">
            <ContactSupportForm source="public" />
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
