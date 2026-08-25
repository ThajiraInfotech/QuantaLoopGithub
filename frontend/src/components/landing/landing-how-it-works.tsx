"use client";

import { Fragment, useMemo, useState } from "react";
import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  Package,
  Search,
  ShieldCheck,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  landingCardHover,
  landingContainer,
  landingHeadingXl,
  landingSectionY,
  landingStackGap,
} from "./landing-styles";

type WorkflowStepData = {
  step: string;
  title: string;
  description: string;
  label: string;
};

type WorkflowStep = WorkflowStepData & { icon: LucideIcon };

const SELLER_ICONS: LucideIcon[] = [
  Package,
  ShieldCheck,
  Target,
  ArrowRightLeft,
];
const BUYER_ICONS: LucideIcon[] = [Search, ShieldCheck, Package, ArrowRightLeft];

function WorkflowConnector({
  orientation,
}: {
  orientation: "horizontal" | "vertical";
}) {
  if (orientation === "horizontal") {
    return (
      <span className="flex w-8 shrink-0 items-center gap-0.5 xl:w-10">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
        <span className="h-px flex-1 bg-accent/40" />
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 text-accent/55"
          strokeWidth={2}
          aria-hidden
        />
      </span>
    );
  }

  return (
    <span className="flex flex-col items-center gap-0.5 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="h-4 w-px bg-accent/40" />
      <ChevronDown
        className="h-3.5 w-3.5 text-accent/55"
        strokeWidth={2}
        aria-hidden
      />
      <span className="h-4 w-px bg-accent/40" />
    </span>
  );
}

function WorkflowStepCard({
  step,
  title,
  description,
  label,
  icon: Icon,
}: WorkflowStep) {
  return (
    <Card
      variant="default"
      className={landingCardHover("h-full border-border bg-card shadow-card")}
    >
      <CardContent className="flex h-full min-h-0 flex-col p-5 sm:p-6 lg:min-h-[220px] lg:p-8">
        <div className="flex items-start justify-between gap-3">
          <Badge
            variant="outline"
            className="shrink-0 border-border bg-muted/50 px-2 py-0.5 font-mono text-caption text-muted-foreground"
          >
            {step}
          </Badge>
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 text-accent">
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </span>
        </div>
        <h3 className="mt-4 font-heading text-lg leading-snug text-card-foreground sm:mt-5 sm:text-h4">
          {title}
        </h3>
        <p className="mt-2 flex-1 text-small leading-relaxed text-muted-foreground">
          {description}
        </p>
        <Badge
          variant="outline"
          className="mt-5 w-fit border-border/80 bg-muted/30 px-2 py-0.5 text-caption font-normal text-muted-foreground"
        >
          {label}
        </Badge>
      </CardContent>
    </Card>
  );
}

function WorkflowFlow({ steps }: { steps: WorkflowStep[] }) {
  return (
    <ol
      className={cn(
        "grid list-none grid-cols-1 md:grid-cols-2 md:gap-5 lg:flex lg:items-stretch lg:gap-0",
        landingStackGap
      )}
    >
      {steps.map((item, index) => (
        <Fragment key={`${item.step}-${item.title}`}>
          <li className="flex min-w-0 flex-1">
            <WorkflowStepCard {...item} />
          </li>
          {index < steps.length - 1 ? (
            <>
              <li className="flex justify-center md:hidden" aria-hidden>
                <WorkflowConnector orientation="vertical" />
              </li>
              <li
                className="hidden shrink-0 items-center self-center px-0.5 lg:flex"
                aria-hidden
              >
                <WorkflowConnector orientation="horizontal" />
              </li>
            </>
          ) : null}
        </Fragment>
      ))}
    </ol>
  );
}

function withIcons(
  steps: WorkflowStepData[],
  icons: LucideIcon[]
): WorkflowStep[] {
  return steps.map((step, index) => ({
    ...step,
    icon: icons[index] ?? Package,
  }));
}

export function LandingHowItWorks() {
  const t = useTranslations("landing.howItWorks");
  const [audience, setAudience] = useState<"seller" | "buyer">("seller");

  const audienceOptions = useMemo(
    () => [
      {
        id: "seller" as const,
        label: t("seller.label"),
        subtitle: t("seller.subtitle"),
        steps: withIcons(
          t.raw("seller.steps") as WorkflowStepData[],
          SELLER_ICONS
        ),
      },
      {
        id: "buyer" as const,
        label: t("buyer.label"),
        subtitle: t("buyer.subtitle"),
        steps: withIcons(
          t.raw("buyer.steps") as WorkflowStepData[],
          BUYER_ICONS
        ),
      },
    ],
    [t]
  );

  const active = audienceOptions.find((option) => option.id === audience)!;

  return (
    <section
      id="how-it-works"
      className={`scroll-mt-20 border-b border-border bg-background ${landingSectionY}`}
    >
      <div className={landingContainer}>
        <div className="mx-auto max-w-[900px] text-center">
          <p className="text-eyebrow">{t("eyebrow")}</p>
          <h2 className={cn("mt-3", landingHeadingXl)}>{t("title")}</h2>
          <p className="mx-auto mt-4 max-w-[700px] text-body leading-relaxed text-muted-foreground sm:mt-5 md:mt-6">
            {active.subtitle}
          </p>

          <div
            className="mx-auto mt-6 flex w-full max-w-md rounded-lg border border-border bg-muted/30 p-1 sm:inline-flex sm:w-auto sm:max-w-none"
            role="tablist"
            aria-label={t("tablistAria")}
          >
            {audienceOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={audience === option.id}
                onClick={() => setAudience(option.id)}
                className={cn(
                  "min-h-10 flex-1 rounded-md px-3 py-2 text-small font-medium transition-colors sm:flex-none sm:px-4",
                  audience === option.id
                    ? "bg-background text-foreground shadow-subtle"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 sm:mt-8 lg:mt-10">
          <WorkflowFlow steps={active.steps} />
        </div>
      </div>
    </section>
  );
}
