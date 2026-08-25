import { getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import {
  landingCardHover,
  landingHeading,
  landingPad,
  landingSectionY,
} from "./landing-styles";

type Transformation = {
  from: string;
  to: string;
  description: string;
};

function TransformMarker() {
  return (
    <div className="my-3 flex flex-col items-center" aria-hidden>
      <div className="flex flex-col items-center">
        <span className="h-2 w-px bg-border" />
        <span className="flex h-7 w-7 items-center justify-center rounded-full border border-accent/25 bg-accent/5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 16 16"
            fill="none"
            className="text-accent"
          >
            <path
              d="M8 3v10M8 13l-3.5-3.5M8 13l3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="h-2 w-px bg-border" />
      </div>
    </div>
  );
}

function TransformCard({
  from,
  to,
  description,
}: {
  from: string;
  to: string;
  description: string;
}) {
  return (
    <Card
      variant="default"
      className={landingCardHover(
        "group flex h-full flex-col border-border/90 bg-card"
      )}
    >
      <CardContent className="flex flex-col items-center justify-center px-4 py-5 text-center sm:px-6 sm:py-7">
        <p className="text-small font-medium text-muted-foreground">{from}</p>

        <TransformMarker />

        <p className="font-heading text-balance text-xl font-bold leading-[1.15] tracking-[-0.02em] text-foreground sm:text-2xl lg:text-3xl">
          {to}
        </p>
        <p className="mt-2 max-w-[14rem] text-small leading-snug text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}

export async function LandingProblem() {
  const t = await getTranslations("landing.problem");
  const transformations = t.raw("transformations") as Transformation[];
  const materialExamples = t.raw("examples") as string[];

  return (
    <section className={`border-b border-border bg-muted/30 ${landingSectionY}`}>
      <div className={cn("mx-auto max-w-[900px] text-center", landingPad)}>
        <h2 className={landingHeading}>
          <span className="block">{t("titleLine1")}</span>
          <span className="block">{t("titleLine2")}</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[700px] text-body leading-relaxed text-muted-foreground sm:mt-5 md:mt-6">
          {t("description")}
        </p>
      </div>

      <div
        className={cn(
          "mx-auto mt-8 grid max-w-6xl gap-4 sm:mt-10 md:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-5",
          landingPad
        )}
      >
        {transformations.map((item) => (
          <div
            key={item.from}
            className="min-w-0 md:last:col-span-2 md:last:mx-auto md:last:max-w-md lg:last:col-span-1 lg:last:mx-0 lg:last:max-w-none"
          >
            <TransformCard
              from={item.from}
              to={item.to}
              description={item.description}
            />
          </div>
        ))}
      </div>

      <div
        className={cn(
          "mx-auto mt-8 flex max-w-6xl flex-col items-center sm:mt-10",
          landingPad
        )}
      >
        <p className="text-small text-muted-foreground">{t("categoriesLabel")}</p>
        <ul className="mt-3 flex max-w-3xl flex-wrap items-center justify-center gap-2">
          {materialExamples.map((material) => (
            <li key={material}>
              <Badge
                variant="outline"
                className="border-border/80 bg-background px-2.5 py-1 text-caption font-normal text-muted-foreground"
              >
                {material}
              </Badge>
            </li>
          ))}
        </ul>
        <p className="mt-3 max-w-md text-center text-[11px] leading-relaxed text-muted-foreground/80">
          {t("categoriesNote")}
        </p>
      </div>
    </section>
  );
}
