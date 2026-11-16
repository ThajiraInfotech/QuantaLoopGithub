import Link from "next/link";

import {
  landingCardHover,
  landingContainer,
  landingSectionY,
} from "@/components/landing/landing-styles";
import { Card, CardContent } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import type { ContentInsight } from "@/types/content-insight";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 9;

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

function InsightCard({
  article,
  featured = false,
}: {
  article: ContentInsight;
  featured?: boolean;
}) {
  return (
    <Link href={ROUTES.publicInsight(article.slug)} className="group block h-full">
      <Card
        variant="default"
        className={landingCardHover(
          cn(
            "h-full overflow-hidden border-border/80 bg-card shadow-card",
            featured && "border-accent/25 bg-gradient-to-br from-card via-card to-accent/[0.06]"
          )
        )}
      >
        <CardContent
          className={cn(
            "flex h-full flex-col",
            featured ? "p-6 sm:p-8 lg:p-10" : "p-5 sm:p-6"
          )}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
              Guide
            </span>
            <span className="text-caption text-muted-foreground">
              {formatDate(article.publishedAt ?? article.createdAt)} ·{" "}
              {article.readingMinutes} min
            </span>
          </div>

          <h2
            className={cn(
              "mt-4 font-heading font-semibold tracking-tight text-foreground transition-colors group-hover:text-accent",
              featured
                ? "text-2xl sm:text-3xl lg:text-[2rem] lg:leading-tight"
                : "text-xl sm:text-[1.35rem]"
            )}
          >
            {article.title}
          </h2>

          <p
            className={cn(
              "mt-3 flex-1 leading-relaxed text-muted-foreground",
              featured ? "text-body sm:text-[1.05rem]" : "text-small line-clamp-3"
            )}
          >
            {article.excerpt || article.description}
          </p>

          {article.tags?.length ? (
            <ul className="mt-4 flex list-none flex-wrap gap-2">
              {article.tags.slice(0, featured ? 4 : 3).map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-border/80 bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <span className="mt-5 inline-flex items-center gap-1.5 text-small font-semibold text-accent transition-transform duration-200 group-hover:translate-x-0.5">
            Read guide
            <span aria-hidden>→</span>
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}

function Pagination({
  page,
  totalPages,
}: {
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1
  );

  const items: Array<number | "ellipsis"> = [];
  for (let i = 0; i < pages.length; i += 1) {
    const current = pages[i]!;
    const prev = pages[i - 1];
    if (prev && current - prev > 1) items.push("ellipsis");
    items.push(current);
  }

  return (
    <nav
      aria-label="Insights pagination"
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
    >
      <Link
        href={
          page <= 2
            ? ROUTES.publicInsights
            : `${ROUTES.publicInsights}?page=${page - 1}`
        }
        aria-disabled={page <= 1}
        className={cn(
          "inline-flex h-10 items-center rounded-full border border-border px-4 text-small font-medium transition-colors",
          page <= 1
            ? "pointer-events-none opacity-40"
            : "hover:border-accent/40 hover:text-accent"
        )}
      >
        Previous
      </Link>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`e-${index}`}
            className="px-1 text-small text-muted-foreground"
          >
            …
          </span>
        ) : (
          <Link
            key={item}
            href={
              item === 1
                ? ROUTES.publicInsights
                : `${ROUTES.publicInsights}?page=${item}`
            }
            aria-current={item === page ? "page" : undefined}
            className={cn(
              "inline-flex h-10 min-w-10 items-center justify-center rounded-full border px-3 text-small font-medium transition-colors",
              item === page
                ? "border-accent bg-accent text-accent-foreground"
                : "border-border hover:border-accent/40 hover:text-accent"
            )}
          >
            {item}
          </Link>
        )
      )}

      <Link
        href={`${ROUTES.publicInsights}?page=${page + 1}`}
        aria-disabled={page >= totalPages}
        className={cn(
          "inline-flex h-10 items-center rounded-full border border-border px-4 text-small font-medium transition-colors",
          page >= totalPages
            ? "pointer-events-none opacity-40"
            : "hover:border-accent/40 hover:text-accent"
        )}
      >
        Next
      </Link>
    </nav>
  );
}

export function InsightsIndex({
  articles,
  page = 1,
  labels,
}: {
  articles: ContentInsight[];
  page?: number;
  labels?: {
    library: string;
    guideCount: string;
    emptyTitle: string;
    emptyBody: string;
  };
}) {
  const totalPages = Math.max(1, Math.ceil(articles.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const pageItems = articles.slice(start, start + PAGE_SIZE);
  const [featured, ...rest] =
    safePage === 1 && pageItems.length > 0
      ? [pageItems[0], ...pageItems.slice(1)]
      : [null, ...pageItems];

  const library = labels?.library ?? "Library";
  const emptyTitle = labels?.emptyTitle ?? "Insights coming soon";
  const emptyBody =
    labels?.emptyBody ??
    "Practical guides for buying and selling recyclable materials will appear here.";
  const guideCount =
    labels?.guideCount ??
    `${articles.length} guide${articles.length === 1 ? "" : "s"} · page ${safePage} of ${totalPages}`;

  return (
    <section
      className={cn(
        "relative border-b border-border",
        "bg-[radial-gradient(1200px_500px_at_50%_-10%,rgba(43,170,107,0.10),transparent_60%),linear-gradient(180deg,#f7faf8_0%,#ffffff_42%)]",
        landingSectionY
      )}
    >
      <div className={landingContainer}>
        {articles.length === 0 ? (
          <div className="mx-auto max-w-[640px] rounded-3xl border border-dashed border-border bg-card/70 px-6 py-14 text-center">
            <p className="font-heading text-xl font-semibold text-foreground">
              {emptyTitle}
            </p>
            <p className="mt-3 text-body text-muted-foreground">{emptyBody}</p>
          </div>
        ) : (
          <>
            <div className="mb-8 flex flex-col gap-2 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-eyebrow text-accent">{library}</p>
                <p className="mt-1 text-small text-muted-foreground">
                  {guideCount}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {featured ? <InsightCard article={featured} featured /> : null}

              {rest.length ? (
                <ul className="grid list-none gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((article) => (
                    <li key={article.id} className="min-h-0">
                      <InsightCard article={article} />
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <Pagination page={safePage} totalPages={totalPages} />
          </>
        )}
      </div>
    </section>
  );
}

export const INSIGHTS_PAGE_SIZE = PAGE_SIZE;
