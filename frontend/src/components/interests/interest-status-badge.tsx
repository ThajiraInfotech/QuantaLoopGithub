"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { InterestStatus } from "@/types/interest";

const STATUS_KEYS: Record<InterestStatus, string> = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  discussion: "discussion",
  pickup_scheduled: "discussion",
  completed: "completed",
  closed: "closed",
};

const STATUS_STYLES: Record<InterestStatus, string> = {
  pending: "border-amber-200 bg-amber-50 text-amber-900",
  accepted: "border-blue-200 bg-blue-50 text-blue-900",
  rejected: "border-red-200 bg-red-50 text-red-800",
  discussion: "border-blue-200 bg-blue-50 text-blue-900",
  pickup_scheduled: "border-blue-200 bg-blue-50 text-blue-900",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-800",
  closed: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

type InterestStatusBadgeProps = {
  status: InterestStatus;
  className?: string;
};

export function InterestStatusBadge({ status, className }: InterestStatusBadgeProps) {
  const t = useTranslations("interests.status");

  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
        STATUS_STYLES[status] ?? STATUS_STYLES.closed,
        className
      )}
    >
      {t(STATUS_KEYS[status] ?? "closed")}
    </span>
  );
}
