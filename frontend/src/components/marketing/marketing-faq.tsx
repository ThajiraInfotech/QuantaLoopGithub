import {
  landingContainer,
  landingHeading,
  landingSectionY,
} from "@/components/landing/landing-styles";
import type { FaqItem } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function MarketingFaq({
  title = "Frequently asked questions",
  faqs,
}: {
  title?: string;
  faqs: FaqItem[];
}) {
  if (!faqs.length) return null;

  return (
    <section className={cn("border-b border-border bg-background", landingSectionY)}>
      <div className={landingContainer}>
        <div className="mx-auto max-w-[720px]">
          <h2 className={cn("text-center", landingHeading)}>{title}</h2>
          <dl className="mt-8 space-y-6 sm:mt-10">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6"
              >
                <dt className="font-heading text-lg font-semibold text-foreground">
                  {faq.question}
                </dt>
                <dd className="mt-2 text-body leading-relaxed text-muted-foreground">
                  {faq.answer}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
