import { ENGLISH_TERMS_CONTENT } from "@/constants/english-terms";
import { LegalDocumentHeader } from "@/components/legal/legal-document";
import { LegalStructuredDocument } from "@/components/legal/legal-structured-document";

export async function TermsAndConditionsContent() {
  const content = ENGLISH_TERMS_CONTENT;

  return (
    <>
      <LegalDocumentHeader title={content.title} metadata={content.metadata} />
      <LegalStructuredDocument content={content} />
    </>
  );
}
