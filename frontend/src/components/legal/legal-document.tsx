import { getTranslations } from "next-intl/server";

import {
  LEGAL_LAST_UPDATED,
  LEGAL_OPERATOR,
  legalEmailLinkClass,
  LEGAL_SUPPORT_EMAIL,
} from "@/constants/legal";
import type { LegalDocumentMetadata } from "@/components/legal/legal-content-types";
import { cn } from "@/lib/utils";

export async function LegalDocumentHeader({
  title,
  metadata,
}: {
  title: string;
  metadata?: LegalDocumentMetadata;
}) {
  const t = await getTranslations("legal.common");

  return (
    <div className="space-y-2 border-b border-border/80 pb-6">
      <p className="text-small font-medium text-foreground">{title}</p>
      {metadata ? (
        <>
          <p className="text-small text-muted-foreground">{metadata.operatedBy}</p>
          <p className="text-small text-muted-foreground">
            {metadata.registeredBusinessAddress}
          </p>
          <p className="text-small text-muted-foreground">{metadata.effectiveDate}</p>
          <p className="text-small text-muted-foreground">{metadata.lastUpdated}</p>
        </>
      ) : (
        <>
          <p className="text-small text-muted-foreground">
            {t("operatedBy", { operator: LEGAL_OPERATOR })}
          </p>
          <p className="text-small text-muted-foreground">
            {t("lastUpdated", { date: LEGAL_LAST_UPDATED })}
          </p>
        </>
      )}
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-h4 text-foreground">{title}</h2>
      {children}
    </section>
  );
}

export function LegalSubsection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h3 className="text-small font-semibold text-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function LegalParagraph({ children }: { children: React.ReactNode }) {
  return <p className="leading-relaxed">{children}</p>;
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="list-disc space-y-2 pl-5 leading-relaxed">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function LegalOrderedList({ items }: { items: string[] }) {
  return (
    <ol className="list-decimal space-y-2 pl-5 leading-relaxed">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ol>
  );
}

export function LegalInlineHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-small font-semibold text-foreground">{children}</h3>;
}

export function LegalEmailLink({ className }: { className?: string }) {
  return (
    <a
      href={`mailto:${LEGAL_SUPPORT_EMAIL}`}
      className={cn(legalEmailLinkClass, className)}
    >
      {LEGAL_SUPPORT_EMAIL}
    </a>
  );
}
