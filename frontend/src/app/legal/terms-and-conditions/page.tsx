import type { Metadata } from "next";

import { LegalPageShell } from "@/components/legal/legal-page-shell";
import { TermsAndConditionsContent } from "@/components/legal/terms-and-conditions-content";
import { ENGLISH_TERMS_CONTENT } from "@/constants/english-terms";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: ENGLISH_TERMS_CONTENT.title,
    alternates: { canonical: "/legal/terms-and-conditions" },
    robots: { index: true, follow: true },
  };
}

export default async function TermsAndConditionsPage() {
  return (
    <LegalPageShell title={ENGLISH_TERMS_CONTENT.title}>
      <TermsAndConditionsContent />
    </LegalPageShell>
  );
}
