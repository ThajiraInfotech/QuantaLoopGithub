import Link from "next/link";

import { landingPad } from "@/components/landing/landing-styles";
import type { BreadcrumbItem } from "@/lib/seo";
import { cn } from "@/lib/utils";

export function MarketingBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("border-b border-border/70 bg-background", landingPad)}
    >
      <ol className="mx-auto flex max-w-6xl flex-wrap items-center gap-1.5 py-3 text-caption text-muted-foreground">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={item.path} className="inline-flex items-center gap-1.5">
              {index > 0 ? (
                <span className="text-muted-foreground/50" aria-hidden>
                  /
                </span>
              ) : null}
              {isLast ? (
                <span className="font-medium text-foreground">{item.name}</span>
              ) : (
                <Link
                  href={item.path}
                  className="transition-colors hover:text-foreground"
                >
                  {item.name}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
