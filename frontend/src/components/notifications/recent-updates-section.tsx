"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

import { NotificationCard } from "@/components/notifications/notification-card";
import { ROUTES } from "@/constants/routes";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import {
  buildRecentUpdatesDisplay,
  recentUpdateSummaryTitle,
  type RecentUpdateGroup,
} from "@/lib/notification-recent-grouping";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

const cardShell =
  "block w-full rounded-xl border border-zinc-100 bg-zinc-50/50 px-4 py-3.5 transition-colors sm:px-5 sm:py-4 hover:border-zinc-200 hover:bg-white";

function RecentUpdateSummaryCard({ group }: { group: RecentUpdateGroup }) {
  const t = useTranslations("notifications.recent");
  const { formatRelativeTime } = useLocalizedTime();
  const title = recentUpdateSummaryTitle(group);

  return (
    <div className={cn(cardShell)}>
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-xs text-zinc-500">
        {t("last", { time: formatRelativeTime(group.latestAt) })}
      </p>
      <Link
        href={ROUTES.interestsHistory}
        className="mt-2 inline-block text-xs font-medium text-zinc-700 underline-offset-4 hover:text-zinc-900 hover:underline"
      >
        {t("viewHistory")}
      </Link>
    </div>
  );
}

export function RecentUpdatesSection({
  items,
  onOpen,
}: {
  items: Notification[];
  onOpen: (notification: Notification) => void;
}) {
  const t = useTranslations("notifications.recent");
  const displayItems = buildRecentUpdatesDisplay(items);

  if (displayItems.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t("title")}
      </h2>
      <p className="text-xs text-zinc-500">
        {t("description")}
      </p>
      <ul className="space-y-2">
        {displayItems.map((item) => (
          <li key={item.kind === "group" ? item.group.id : item.notification.id}>
            {item.kind === "group" ? (
              <RecentUpdateSummaryCard group={item.group} />
            ) : (
              <NotificationCard notification={item.notification} onOpen={onOpen} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
