import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsAndConditionsContent } from "@/components/legal/terms-and-conditions-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.terms");
  return { title: t("title") };
}

export default async function TermsAndConditionsPage() {
  const t = await getTranslations("legal.terms");

  return (
    <LegalPageShell title={t("title")}>
      <TermsAndConditionsContent />
    </LegalPageShell>
  );
}
