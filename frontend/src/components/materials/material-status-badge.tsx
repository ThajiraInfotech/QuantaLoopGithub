"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { MaterialStatus } from "@/types/material";

const STATUS_KEYS: Partial<Record<MaterialStatus, string>> = {
  available: "available",
  active: "available",
  in_discussion: "inDiscussion",
  fulfilled: "completed",
  archived: "archived",
  inactive: "archived",
};

const STATUS_STYLES: Record<MaterialStatus, string> = {
  available: "border-emerald-200 bg-emerald-50 text-emerald-800",
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  in_discussion: "border-amber-200 bg-amber-50 text-amber-900",
  fulfilled: "border-zinc-200 bg-zinc-100 text-zinc-700",
  archived: "border-zinc-200 bg-zinc-100 text-zinc-600",
  inactive: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

type MaterialStatusBadgeProps = {
  status: MaterialStatus;
  className?: string;
};

export function MaterialStatusBadge({ status, className }: MaterialStatusBadgeProps) {
  const t = useTranslations("materials.status");
  const key = STATUS_KEYS[status] ?? "archived";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[status] ?? STATUS_STYLES.archived,
        className
      )}
    >
      {t(key)}
    </span>
  );
}
