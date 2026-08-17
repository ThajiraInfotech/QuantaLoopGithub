"use client";

import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { RecommendationPriority } from "@/types/recommendation";

export function PriorityBadge({
  priority,
  className,
}: {
  priority?: RecommendationPriority;
  className?: string;
}) {
  const t = useTranslations("dashboard.recommendations.priority");

  if (!priority || priority === "standard") return null;

  return (
    <span
      className={cn(
        "rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        priority === "high"
          ? "border-zinc-300 bg-zinc-100 text-zinc-800"
          : "border-zinc-200 bg-zinc-50 text-zinc-600",
        className
      )}
    >
      {t(priority)}
    </span>
  );
}
