import {
  Factory,
  Network,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { landingSectionY, landingStackGap } from "./landing-styles";

const WHY_ICONS: LucideIcon[] = [
  ShieldCheck,
  Route,
  Target,
  Network,
  Sparkles,
  Factory,
];

type WhyCardData = {
  label: string;
  title: string;
  description: string;
  outcomes: readonly { direction: "up" | "down"; label: string }[];
};

function OutcomeItem({
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

function WhyCard({
  label,
  title,
  description,
  outcomes,
  icon: Icon,
}: WhyCardData & { icon: LucideIcon }) {
  return (
    <Card
      variant="default"
      className={cn(
        "flex h-full w-full flex-col border-border/90 bg-card shadow-card",
        "transition-all duration-300 ease-out",
        "hover:-translate-y-1.5 hover:border-[#BBF7D0] hover:shadow-[0_20px_40px_rgba(0,0,0,0.05)]"
      )}
    >
      <CardContent className="flex h-full flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent/85">
            {label}
          </p>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 text-accent">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
        </div>

        <h3 className="mt-3 font-heading text-h4 leading-snug text-card-foreground">
          {title}
        </h3>

        <p className="mt-2 text-small leading-relaxed text-muted-foreground">
          {description}
        </p>

        <div className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5 border-t border-border/80 pt-4">
          {outcomes.map((outcome) => (
            <OutcomeItem key={outcome.label} {...outcome} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export async function LandingWhyQuantaLoop() {
  const t = await getTranslations("landing.why");
  const whyCards = t.raw("cards") as WhyCardData[];

  return (
    <section
      id="why-quanta-loop"
      className={cn("border-b border-border bg-[#F8FAF8]", landingSectionY)}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
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
            "grid list-none items-stretch gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7",
            landingStackGap
          )}
        >
          {whyCards.map((item, index) => (
            <li key={item.title} className="flex h-full min-h-0">
              <WhyCard {...item} icon={WHY_ICONS[index] ?? ShieldCheck} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
