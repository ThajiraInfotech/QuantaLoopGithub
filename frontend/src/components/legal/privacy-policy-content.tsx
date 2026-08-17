import { getTranslations } from "next-intl/server";

import type { LegalDocumentContent } from "@/components/legal/legal-content-types";
import { LegalDocumentHeader } from "@/components/legal/legal-document";
import { LegalStructuredDocument } from "@/components/legal/legal-structured-document";

export async function PrivacyPolicyContent() {
  const t = await getTranslations("legal.privacy");
  const content = {
    title: t("title"),
    metadata: t.has("metadata")
      ? (t.raw("metadata") as LegalDocumentContent["metadata"])
      : undefined,
    intro: t.raw("intro") as LegalDocumentContent["intro"],
    sections: t.raw("sections") as LegalDocumentContent["sections"],
  } satisfies LegalDocumentContent;

  return (
    <>
      <LegalDocumentHeader title={content.title} metadata={content.metadata} />
      <LegalStructuredDocument content={content} />
    </>
  );
}
