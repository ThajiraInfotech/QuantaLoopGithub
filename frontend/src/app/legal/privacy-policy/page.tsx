import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { PrivacyPolicyContent } from "@/components/legal/privacy-policy-content";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return { title: t("title") };
}

export default async function PrivacyPolicyPage() {
  const t = await getTranslations("legal.privacy");

  return (
    <LegalPageShell title={t("title")}>
      <PrivacyPolicyContent />
    </LegalPageShell>
  );
}
