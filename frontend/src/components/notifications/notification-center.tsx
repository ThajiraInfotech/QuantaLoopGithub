"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

import {
  NotificationCard,
  notificationDestination,
} from "@/components/notifications/notification-card";
import { RecentUpdatesSection } from "@/components/notifications/recent-updates-section";
import { Button } from "@/components/ui/button";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { useNotificationLabels } from "@/hooks/use-notification-labels";
import {
  buildActionRequiredDisplayItems,
  countUnreadDisplayItems,
  type UnreadDisplayItem,
} from "@/lib/notification-grouping";
import { partitionNotifications } from "@/lib/notification-display";
import { cn } from "@/lib/utils";
import { PushNotificationPrompt } from "@/components/notifications/push-notification-prompt";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from "@/services/notifications/notification.service";
import { useNotificationStore } from "@/store/notification-store";
import type { Notification } from "@/types/notification";

const cardBaseClass =
  "w-full rounded-xl border px-4 py-3.5 text-left transition-colors sm:px-5 sm:py-4";

function PendingInterestsGroupCard({
  notifications,
  onOpen,
}: {
  notifications: Notification[];
  onOpen: (notification: Notification) => void;
}) {
  const t = useTranslations("notifications.center");
  const { formatRelativeTime } = useLocalizedTime();
  const { groupSubline } = useNotificationLabels();
  const [expanded, setExpanded] = useState(false);
  const count = notifications.length;
  const latestAt = notifications[0]?.updatedAt ?? new Date().toISOString();

  return (
    <div
      className={cn(
        cardBaseClass,
        "border-zinc-200/90 bg-white p-0 shadow-sm shadow-zinc-950/[0.03]"
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-start gap-3 px-4 py-3.5 text-left sm:px-5 sm:py-4"
        aria-expanded={expanded}
      >
        <span
          className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500"
          aria-hidden
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("needsResponse")}
            </p>
            <time className="shrink-0 text-xs text-zinc-400" dateTime={latestAt}>
              {formatRelativeTime(latestAt)}
            </time>
          </div>
          <p className="text-sm font-semibold text-zinc-950">
            {t("pendingInterestsTitle", { count })}
          </p>
          <p className="text-xs text-zinc-500">
            {expanded ? t("hideList") : t("showBuyers")}
          </p>
        </div>
        <span
          className="mt-1 h-2 w-2 shrink-0 rounded-full bg-zinc-900"
          aria-label={t("unread")}
        />
      </button>

      {expanded ? (
        <ul className="space-y-1 border-t border-zinc-100 px-4 py-2 sm:px-5">
          {notifications.map((n) => {
            const interactive = notificationDestination(n) !== null;
            return (
              <li key={n.id}>
                <button
                  type="button"
                  disabled={!interactive}
                  onClick={() => onOpen(n)}
                  className={cn(
                    "w-full rounded-lg px-2 py-2.5 text-left text-sm transition-colors",
                    interactive
                      ? "hover:bg-zinc-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-zinc-400"
                      : "cursor-default opacity-80"
                  )}
                >
                  <span className="text-zinc-700">• {groupSubline(n)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function ActionRequiredSection({
  displayItems,
  onOpen,
}: {
  displayItems: UnreadDisplayItem[];
  onOpen: (notification: Notification) => void;
}) {
  const t = useTranslations("notifications.center");
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {t("actionRequired")}
        {displayItems.length > 0
          ? ` (${countUnreadDisplayItems(displayItems)})`
          : ""}
      </h2>
      {displayItems.length === 0 ? (
        <p className="rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-5 text-sm text-zinc-600">
          {t("noAttention")}
        </p>
      ) : (
        <>
      <p className="text-xs text-zinc-500">{t("actionRequiredHint")}</p>
      <ul className="space-y-2">
        {displayItems.map((item) => (
          <li key={item.kind === "group" ? item.id : item.notification.id}>
            {item.kind === "group" ? (
              <PendingInterestsGroupCard
                notifications={item.notifications}
                onOpen={onOpen}
              />
            ) : (
              <NotificationCard notification={item.notification} onOpen={onOpen} />
            )}
          </li>
        ))}
      </ul>
        </>
      )}
    </section>
  );
}

export function NotificationCenter() {
  const t = useTranslations("notifications.center");
  const router = useRouter();
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNotifications();
      setItems(data.items);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("loadError"));
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const { actionRequired, recentUpdates } = useMemo(
    () => partitionNotifications(items),
    [items]
  );
  const actionDisplayItems = useMemo(
    () => buildActionRequiredDisplayItems(actionRequired),
    [actionRequired]
  );
  const totalUnreadCount = useMemo(
    () => items.filter((n) => !n.isRead).length,
    [items]
  );

  async function handleOpen(notification: Notification) {
    const href = notificationDestination(notification);
    if (!href) return;

    if (!notification.isRead) {
      try {
        await markNotificationReadRequest(notification.id);
        setItems((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
        const count = await fetchUnreadNotificationCount();
        setUnreadCount(count);
      } catch {
        toast.error(t("updateError"));
        return;
      }
    }

    router.push(href);
  }

  async function handleMarkAllRead() {
    if (totalUnreadCount === 0) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsReadRequest();
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success(t("markAllSuccess"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("markAllError"));
    } finally {
      setMarkingAll(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-3 py-4">
        <div className="h-10 w-2/3 animate-pulse rounded-md bg-zinc-100" />
        <div className="h-24 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
        <div className="h-24 animate-pulse rounded-xl border border-zinc-200/80 bg-zinc-50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-4">
        <p className="text-sm text-red-700" role="alert">
          {error}
        </p>
        <Button type="button" variant="outline" size="sm" onClick={() => void load()}>
          {t("tryAgain")}
        </Button>
      </div>
    );
  }

  const isEmpty =
    actionDisplayItems.length === 0 && recentUpdates.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {t("title")}
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-zinc-600">
            {t("subtitle")}
          </p>
        </div>
        {totalUnreadCount > 0 ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markingAll}
            onClick={() => void handleMarkAllRead()}
          >
            {markingAll ? t("updating") : t("markAllRead")}
          </Button>
        ) : null}
      </div>

      <PushNotificationPrompt />

      {isEmpty ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/80 px-6 py-12 text-center">
          <p className="text-sm font-medium text-zinc-800">{t("emptyTitle")}</p>
          <p className="mt-2 text-sm text-zinc-600">
            {t("emptyDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          <ActionRequiredSection
            displayItems={actionDisplayItems}
            onOpen={(n) => void handleOpen(n)}
          />
          <RecentUpdatesSection
            items={recentUpdates}
            onOpen={(n) => void handleOpen(n)}
          />
        </div>
      )}
    </div>
  );
}
