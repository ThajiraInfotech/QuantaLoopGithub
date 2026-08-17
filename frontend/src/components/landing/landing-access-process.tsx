import { Fragment } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  Package,
  UserPlus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { landingCardHover, landingSectionY, landingStackGap } from "./landing-styles";

const ACCESS_ICONS: LucideIcon[] = [
  UserPlus,
  FileText,
  Package,
  ArrowRightLeft,
];

type AccessStep = {
  step: string;
  title: string;
  description: string;
};

function ProcessConnector({
  orientation,
}: {
  orientation: "horizontal" | "vertical";
}) {
  if (orientation === "horizontal") {
    return (
      <span className="flex w-8 shrink-0 items-center gap-0.5 xl:w-10">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/80" />
        <span className="h-px flex-1 bg-border" />
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50"
          strokeWidth={2}
          aria-hidden
        />
      </span>
    );
  }

  return (
    <span className="flex flex-col items-center gap-0.5 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-accent/80" />
      <span className="h-4 w-px bg-border" />
      <ChevronDown
        className="h-3.5 w-3.5 text-muted-foreground/50"
        strokeWidth={2}
        aria-hidden
      />
      <span className="h-4 w-px bg-border" />
    </span>
  );
}

function AccessStepCard({
  step,
  title,
  description,
  icon: Icon,
}: AccessStep & { icon: LucideIcon }) {
  return (
    <Card
      variant="default"
      className={landingCardHover(
        "flex h-full w-full flex-col border-border/90 bg-card shadow-card"
      )}
    >
      <CardContent className="flex h-full min-h-[200px] flex-col p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant="outline"
            className="shrink-0 border-border bg-muted/40 px-2 py-0.5 font-mono text-caption text-muted-foreground"
          >
            {step}
          </Badge>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 text-accent">
            <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
        </div>
        <h3 className="mt-4 font-heading text-h4 leading-snug text-card-foreground">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-small leading-relaxed text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export async function LandingAccessProcess() {
  const t = await getTranslations("landing.accessProcess");
  const accessSteps = t.raw("steps") as AccessStep[];

  return (
    <section
      id="access-process"
      className={cn(
        "scroll-mt-20 border-b border-border bg-background",
        landingSectionY
      )}
    >
      <div className="mx-auto max-w-[1200px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-eyebrow">{t("eyebrow")}</p>
          <h2 className="mt-3 font-heading text-[clamp(2rem,3vw,2.75rem)] font-bold leading-[1.12] tracking-[-0.02em] text-foreground text-balance">
            {t("title")}
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-[22px] leading-[1.6] text-muted-foreground sm:mt-6">
            {t("description")}
          </p>
        </div>

        <ol className={cn("flex flex-col lg:hidden", landingStackGap)}>
          {accessSteps.map((item, index) => (
            <Fragment key={item.step}>
              <li className="flex">
                <AccessStepCard
                  {...item}
                  icon={ACCESS_ICONS[index] ?? UserPlus}
                />
              </li>
              {index < accessSteps.length - 1 ? (
                <li className="flex justify-center" aria-hidden>
                  <ProcessConnector orientation="vertical" />
                </li>
              ) : null}
            </Fragment>
          ))}
        </ol>

        <ol
          className={cn("hidden list-none items-stretch lg:flex", landingStackGap)}
        >
          {accessSteps.map((item, index) => (
            <Fragment key={item.step}>
              <li className="flex min-w-0 flex-1">
                <AccessStepCard
                  {...item}
                  icon={ACCESS_ICONS[index] ?? UserPlus}
                />
              </li>
              {index < accessSteps.length - 1 ? (
                <li
                  className="flex shrink-0 items-center self-center px-0.5"
                  aria-hidden
                >
                  <ProcessConnector orientation="horizontal" />
                </li>
              ) : null}
            </Fragment>
          ))}
        </ol>

        <p className="mx-auto mt-10 max-w-[640px] text-center text-small leading-relaxed text-muted-foreground sm:mt-12">
          {t("footer")}
        </p>
      </div>
    </section>
  );
}
