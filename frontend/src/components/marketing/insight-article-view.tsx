import Link from "next/link";

import { CtaLink } from "@/components/landing/cta-link";
import {
  landingCardHover,
  landingContainer,
  landingHeadingXl,
  landingSectionY,
} from "@/components/landing/landing-styles";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { ContentInsight } from "@/types/content-insight";
import { cn } from "@/lib/utils";

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function InsightArticleView({
  article,
  more,
}: {
  article: ContentInsight;
  more: ContentInsight[];
}) {
  const published = formatDate(article.publishedAt ?? article.createdAt);

  return (
    <article>
      <header
        className={cn(
          "relative overflow-hidden border-b border-border",
          "bg-[radial-gradient(900px_420px_at_20%_-10%,rgba(43,170,107,0.14),transparent_55%),linear-gradient(180deg,#f5faf7_0%,#ffffff_70%)]",
          landingSectionY,
          "py-12 sm:py-16 lg:py-20"
        )}
      >
        <div className={cn(landingContainer, "relative max-w-[820px]")}>
          <Link
            href={ROUTES.publicInsights}
            className="inline-flex items-center gap-1.5 text-small font-medium text-muted-foreground transition-colors hover:text-accent"
          >
            <span aria-hidden>←</span> All Insights
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
              Guide
            </span>
            <span className="text-caption text-muted-foreground">
              {published}
              {published ? " · " : ""}
              {article.readingMinutes} min read
            </span>
          </div>

          <h1 className={cn("mt-4", landingHeadingXl)}>{article.title}</h1>

          <p className="mt-5 max-w-[680px] text-body leading-relaxed text-muted-foreground sm:text-[1.125rem] sm:leading-[1.65]">
            {article.description}
          </p>

          {article.tags?.length ? (
            <ul className="mt-6 flex list-none flex-wrap gap-2">
              {article.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-muted-foreground shadow-subtle"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </header>

      <div
        className={cn(
          "border-b border-border bg-background",
          landingSectionY,
          "py-12 sm:py-16 lg:py-20"
        )}
      >
        <div className={cn(landingContainer, "max-w-[820px]")}>
          <div className="space-y-8 sm:space-y-10">
            {article.sections.map((section, index) => (
              <section
                key={`${section.heading}-${index}`}
                className="relative rounded-3xl border border-border/80 bg-card p-5 shadow-card sm:p-7 lg:p-8"
              >
                <div className="flex items-start gap-4">
                  <span
                    className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 font-heading text-small font-semibold text-accent"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                      {section.heading}
                    </h2>
                    {section.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph.slice(0, 64)}
                        className="mt-3 text-body leading-[1.75] text-muted-foreground"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-accent/[0.08] via-card to-card p-6 shadow-card sm:mt-12 sm:p-8 lg:p-10">
            <p className="text-eyebrow text-accent">Next step</p>
            <h2 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
              Ready to list or find materials?
            </h2>
            <p className="mt-3 max-w-[560px] text-body leading-relaxed text-muted-foreground">
              Start a 30-day free trial, explore{" "}
              <Link
                href={ROUTES.publicMaterials}
                className="font-medium text-foreground underline underline-offset-2 hover:text-accent"
              >
                material categories
              </Link>
              , or review{" "}
              <Link
                href={ROUTES.pricing}
                className="font-medium text-foreground underline underline-offset-2 hover:text-accent"
              >
                membership pricing
              </Link>
              .
            </p>
            <div className="mt-6">
              <CtaLink href={ROUTES.onboardingRole} variant="accent" size="lg">
                Start free trial
              </CtaLink>
            </div>
          </div>

          {more.length ? (
            <div className="mt-12 sm:mt-14">
              <div className="mb-5 flex items-end justify-between gap-3">
                <div>
                  <p className="text-eyebrow text-accent">Keep reading</p>
                  <h2 className="mt-1 font-heading text-2xl font-semibold text-foreground">
                    More Insights
                  </h2>
                </div>
                <Link
                  href={ROUTES.publicInsights}
                  className="hidden text-small font-semibold text-accent hover:underline sm:inline"
                >
                  View all →
                </Link>
              </div>

              <ul className="grid list-none gap-4 sm:grid-cols-3">
                {more.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={ROUTES.publicInsight(item.slug)}
                      className="group block h-full"
                    >
                      <Card
                        variant="default"
                        className={landingCardHover(
                          "h-full border-border/80 bg-card shadow-card"
                        )}
                      >
                        <CardContent className="flex h-full flex-col p-5">
                          <p className="text-caption text-muted-foreground">
                            {formatDate(item.publishedAt ?? item.createdAt)} ·{" "}
                            {item.readingMinutes} min
                          </p>
                          <h3 className="mt-2 font-heading text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
                            {item.title}
                          </h3>
                          <p className="mt-2 line-clamp-3 flex-1 text-small leading-relaxed text-muted-foreground">
                            {item.excerpt || item.description}
                          </p>
                          <span className="mt-4 text-small font-semibold text-accent">
                            Read →
                          </span>
                        </CardContent>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="mt-5 sm:hidden">
                <Link
                  href={ROUTES.publicInsights}
                  className="text-small font-semibold text-accent hover:underline"
                >
                  View all Insights →
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
