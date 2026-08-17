"use client";

import { useTranslations } from "next-intl";

import { NotificationDetails } from "@/components/notifications/notification-details";
import { ROUTES } from "@/constants/routes";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { useNotificationLabels } from "@/hooks/use-notification-labels";
import { cn } from "@/lib/utils";
import type { Notification } from "@/types/notification";

export function notificationDestination(
  notification: Notification
): string | null {
  if (notification.relatedInterestId) {
    return ROUTES.interestsOpen(notification.relatedInterestId);
  }
  if (notification.relatedMaterialId) {
    return ROUTES.materialDetail(notification.relatedMaterialId);
  }
  return null;
}

const cardBaseClass =
  "w-full rounded-xl border px-4 py-3.5 text-left transition-colors sm:px-5 sm:py-4";

export function NotificationCard({
  notification,
  onOpen,
  compact = false,
}: {
  notification: Notification;
  onOpen: (notification: Notification) => void;
  compact?: boolean;
}) {
  const t = useTranslations("notifications.card");
  const { formatRelativeTime } = useLocalizedTime();
  const {
    getCategoryMeta: getLocalizedCategoryMeta,
    getDisplayCategoryLabel,
    getNotificationHeadline,
  } = useNotificationLabels();
  const category = getLocalizedCategoryMeta(notification);
  const categoryLabel = getDisplayCategoryLabel(notification);
  const headline = getNotificationHeadline(notification);
  const interactive = notificationDestination(notification) !== null;

  return (
    <button
      type="button"
      disabled={!interactive}
      onClick={() => onOpen(notification)}
      className={cn(
        cardBaseClass,
        !notification.isRead
          ? "border-zinc-200/90 bg-white shadow-sm shadow-zinc-950/[0.03]"
          : "border-zinc-100 bg-zinc-50/50",
        interactive
          ? "cursor-pointer hover:border-zinc-300 hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-400"
          : "cursor-default opacity-90"
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", category.dotClass)}
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {categoryLabel}
            </p>
            <time
              className="shrink-0 text-xs text-zinc-400"
              dateTime={notification.updatedAt}
            >
              {formatRelativeTime(notification.updatedAt)}
            </time>
          </div>
          {!compact ? (
            <p
              className={cn(
                "text-sm font-semibold text-zinc-900",
                !notification.isRead && "text-zinc-950"
              )}
            >
              {headline}
            </p>
          ) : null}
          <NotificationDetails notification={notification} />
        </div>
        {!notification.isRead ? (
          <span
            className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-900"
            aria-label={t("unread")}
          />
        ) : null}
      </div>
    </button>
  );
}
