"use client";

import { useTranslations } from "next-intl";

import { useLocalizedTime } from "@/hooks/use-localized-time";
import type { TimelineEvent } from "@/types/timeline";

const TIMELINE_TYPES = [
  "interest_received",
  "interest_accepted",
  "interest_rejected",
  "discussion_opened",
  "workflow_discussion",
  "workflow_pickup_scheduled",
  "workflow_completed",
  "workflow_closed",
  "message_posted",
  "material_status_changed",
  "opportunity_saved",
] as const;

type TimelineTypeKey = (typeof TIMELINE_TYPES)[number];

function isTimelineType(type: string): type is TimelineTypeKey {
  return (TIMELINE_TYPES as readonly string[]).includes(type);
}

export function ActivityTimeline({
  items,
  emptyLabel,
}: {
  items: TimelineEvent[];
  emptyLabel?: string;
}) {
  const t = useTranslations("dashboard.activity");
  const { formatRelativeTime } = useLocalizedTime();
  const resolvedEmpty = emptyLabel ?? t("emptyDefault");

  if (items.length === 0) {
    return <p className="text-sm text-zinc-500">{resolvedEmpty}</p>;
  }

  return (
    <ol className="relative border-l border-zinc-200 pl-4 sm:pl-5">
      {items.map((ev) => {
        const typeLabel = isTimelineType(ev.type)
          ? t(`types.${ev.type}`)
          : ev.type;

        return (
          <li key={ev.id} className="mb-5 last:mb-0 sm:mb-6">
            <span className="absolute -left-[5px] mt-1.5 h-2 w-2 rounded-full bg-zinc-300 ring-4 ring-zinc-50" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 sm:tracking-[0.16em]">
              {typeLabel} · {formatRelativeTime(ev.createdAt)}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-pretty text-zinc-800">
              {ev.summary}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
