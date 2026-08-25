import {
  ArrowRight,
  Layers,
  MapPin,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  landingCardHover,
  landingContainer,
  landingHeading,
  landingSectionY,
  landingStackGap,
} from "./landing-styles";

const FACTOR_ICONS: LucideIcon[] = [Layers, MapPin, Users, Target];

type MatchFactor = { title: string; description: string };
type MatchTier = "excellent" | "strong" | "relevant";
type MatchScope = "same_city" | "same_state" | "other_state";
type SampleMatch = {
  tier: MatchTier;
  tierLabel: string;
  title: string;
  meta: string;
  scope: MatchScope;
  locationNote: string;
};

const TIER_STYLES: Record<MatchTier, { chip: string; dot: string }> = {
  excellent: {
    chip: "border-success/30 bg-success-muted text-success",
    dot: "bg-success",
  },
  strong: {
    chip: "border-warning/30 bg-warning-muted text-warning",
    dot: "bg-warning",
  },
  relevant: {
    chip: "border-border bg-muted/50 text-muted-foreground",
    dot: "bg-muted-foreground/60",
  },
};

const SCOPE_STYLES: Record<MatchScope, string> = {
  same_city: "border-success/25 bg-success-muted/60 text-success",
  same_state: "border-border bg-muted/40 text-muted-foreground",
  other_state: "border-warning/25 bg-warning-muted/60 text-warning",
};

function MatchFactorCard({
  title,
  description,
  icon: Icon,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <Card
      variant="default"
      className={landingCardHover("h-full border-border bg-card shadow-card")}
    >
      <CardContent className="flex h-full flex-col p-4 sm:p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-accent/20 bg-accent/5 text-accent">
          <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <h3 className="mt-3 font-heading text-lg leading-snug text-card-foreground sm:mt-4 sm:text-h4">
          {title}
        </h3>
        <p className="mt-2 text-small leading-relaxed text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

function MatchPreviewCard({
  tier,
  tierLabel,
  title,
  meta,
  scope,
  locationNote,
}: SampleMatch) {
  const tierStyle = TIER_STYLES[tier];

  return (
    <div className="rounded-xl border border-border/90 bg-card p-3.5 shadow-subtle sm:p-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-small text-foreground">{title}</p>
          <p className="mt-1 text-caption text-muted-foreground">{meta}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:flex-col sm:items-end">
          <Badge
            variant="outline"
            className={cn(
              "gap-1.5 px-2 py-0.5 text-[11px] font-semibold",
              tierStyle.chip
            )}
          >
            <span
              className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tierStyle.dot)}
              aria-hidden
            />
            {tierLabel}
          </Badge>
          <span
            className={cn(
              "rounded-md border px-2 py-1 text-[11px] font-medium leading-snug",
              SCOPE_STYLES[scope]
            )}
          >
            {locationNote}
          </span>
        </div>
      </div>
    </div>
  );
}

export async function LandingRecommendationEngine() {
  const t = await getTranslations("landing.recommendations");
  const matchFactors = t.raw("factors") as MatchFactor[];
  const sampleMatches = t.raw("samples") as SampleMatch[];

  return (
    <section
      id="recommendations"
      className={cn(
        "scroll-mt-20 border-b border-border bg-[#F8FAF8]",
        landingSectionY
      )}
    >
      <div className={landingContainer}>
        <div className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
          <div className="min-w-0">
            <p className="text-eyebrow">{t("eyebrow")}</p>
            <h2 className={cn("mt-3", landingHeading)}>{t("title")}</h2>
            <p className="mt-4 text-body leading-relaxed text-muted-foreground sm:mt-5">
              {t("description")}
            </p>

            <ul
              className={cn(
                "grid list-none grid-cols-1 gap-3 min-[480px]:grid-cols-2 min-[480px]:gap-4",
                landingStackGap
              )}
            >
              {matchFactors.map((factor, index) => (
                <li key={factor.title} className="flex h-full">
                  <MatchFactorCard
                    {...factor}
                    icon={FACTOR_ICONS[index] ?? Target}
                  />
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-md lg:max-w-none">
            <div
              className="pointer-events-none absolute -inset-4 rounded-3xl bg-accent/5 blur-2xl"
              aria-hidden
            />

            <Card className="relative overflow-hidden border-border/90 bg-card shadow-elevated">
              <CardContent className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
                    <Sparkles className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-caption font-semibold uppercase tracking-wide text-accent">
                      {t("previewBadge")}
                    </p>
                    <p className="text-small font-medium text-foreground">
                      {t("previewTitle")}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2 text-caption text-muted-foreground sm:mt-6">
                  <span className="rounded-md border border-border bg-muted/40 px-2 py-1">
                    {t("yourMaterials")}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden />
                  <span className="rounded-md border border-accent/25 bg-accent/10 px-2 py-1 text-accent">
                    {t("rankedMatches")}
                  </span>
                </div>

                <div className="mt-5 space-y-3">
                  {sampleMatches.map((match) => (
                    <MatchPreviewCard key={match.title} {...match} />
                  ))}
                </div>

                <p className="mt-5 text-center text-[11px] leading-relaxed text-muted-foreground/80">
                  {t("disclaimer")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
