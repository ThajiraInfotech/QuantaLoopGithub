import { Check, Factory, Network, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { landingSectionY, landingStackGap } from "./landing-styles";

const AUDIENCE_ICONS: LucideIcon[] = [Factory, ShieldCheck, Network];

type AudienceCardData = {
  role: string;
  title: string;
  value: string;
  metrics: readonly { direction: "up" | "down"; label: string }[];
  benefits: readonly string[];
};

function BenefitItem({ children }: { children: string }) {
  return (
    <li className="flex gap-2.5 text-small leading-snug text-muted-foreground">
      <span
        className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent"
        aria-hidden
      >
        <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
      </span>
      <span>{children}</span>
    </li>
  );
}

function MetricItem({
  direction,
  label,
}: {
  direction: "up" | "down";
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 text-caption text-muted-foreground">
      <span className="font-semibold text-accent" aria-hidden>
        {direction === "up" ? "↑" : "↓"}
      </span>
      {label}
    </span>
  );
}

function AudienceCard({
  role,
  title,
  value,
  metrics,
  benefits,
  icon: Icon,
}: AudienceCardData & { icon: LucideIcon }) {
  return (
    <Card
      variant="default"
      className={cn(
        "flex h-full w-full max-w-[420px] flex-col border-border bg-card shadow-card",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:border-[#A7F3D0] hover:shadow-[0_20px_40px_rgba(0,0,0,0.06)]"
      )}
    >
      <CardContent className="flex h-full flex-col p-8">
        <div>
          <div className="flex items-start justify-between gap-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent/85">
              {role}
            </p>
            <span className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 text-accent">
              <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} />
            </span>
          </div>

          <h3 className="mt-3 font-heading text-h4 leading-snug text-card-foreground">
            {title}
          </h3>

          <p className="mt-2 text-body font-medium leading-relaxed text-foreground/90">
            {value}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 border-b border-border/80 pb-5">
            {metrics.map((metric) => (
              <MetricItem key={metric.label} {...metric} />
            ))}
          </div>
        </div>

        <ul className="mt-auto flex flex-col gap-3 pt-6">
          {benefits.map((benefit) => (
            <BenefitItem key={benefit}>{benefit}</BenefitItem>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export async function LandingAudience() {
  const t = await getTranslations("landing.audience");
  const audiences = t.raw("cards") as AudienceCardData[];

  return (
    <section
      id="network"
      className={`scroll-mt-20 border-b border-border bg-muted/30 ${landingSectionY}`}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 font-heading text-[clamp(2.5rem,3vw,3rem)] font-bold leading-[1.1] tracking-[-0.02em] text-foreground">
            {t("title")}
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-[22px] leading-[1.6] text-muted-foreground sm:mt-6">
            {t("description")}
          </p>
        </div>

        <ul
          className={cn(
            "grid list-none items-stretch justify-items-center gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3 lg:gap-10",
            landingStackGap
          )}
        >
          {audiences.map((item, index) => (
            <li key={item.title} className="flex h-full w-full max-w-[420px]">
              <AudienceCard
                {...item}
                icon={AUDIENCE_ICONS[index] ?? Factory}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
