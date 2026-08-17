"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { PriorityBadge } from "@/components/recommendations/priority-badge";
import { ROUTES } from "@/constants/routes";
import type { MaterialRecommendationItem } from "@/types/recommendation";

export function MaterialRecommendationCard({
  item,
}: {
  item: MaterialRecommendationItem;
}) {
  const t = useTranslations("dashboard.recommendations");

  return (
    <Link
      href={ROUTES.materialDetail(item.materialId)}
      className="block rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm shadow-zinc-950/5 transition-colors hover:border-zinc-300"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">{item.title}</h3>
            <PriorityBadge priority={item.priority} />
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            {item.headline} · {item.materialType} · {item.location}
            {item.providerCompany ? ` · ${item.providerCompany}` : ""}
          </p>
        </div>
        {item.compositeScore != null ? (
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-zinc-400">
            {t("fitScore", { score: item.compositeScore })}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
