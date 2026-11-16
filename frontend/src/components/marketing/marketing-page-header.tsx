import {
  landingContainer,
  landingHeadingXl,
  landingLeadCentered,
  landingSectionY,
} from "@/components/landing/landing-styles";
import { cn } from "@/lib/utils";

export function MarketingPageHeader({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "border-b border-border bg-muted/20",
        landingSectionY,
        "py-12 sm:py-16 lg:py-20",
        className
      )}
    >
      <div className={cn(landingContainer, "mx-auto max-w-[900px] text-center")}>
        <p className="text-eyebrow">{eyebrow}</p>
        <h1 className={cn("mt-3", landingHeadingXl)}>{title}</h1>
        <p className={landingLeadCentered}>{description}</p>
      </div>
    </section>
  );
}
