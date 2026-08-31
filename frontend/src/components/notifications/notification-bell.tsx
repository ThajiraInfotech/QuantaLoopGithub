"use client";

import {
  Bell,
  CheckCheck,
  Loader2,
  MessageSquare,
  Package,
  Sparkles,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { PushNotificationPrompt } from "@/components/notifications/push-notification-prompt";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { getBellPreviewItem } from "@/lib/notification-bell-preview";
import { cn } from "@/lib/utils";
import {
  fetchUnreadNotificationCount,
  markAllNotificationsReadRequest,
  markNotificationReadRequest,
} from "@/services/notifications/notification.service";
import {
  useNotificationStore,
} from "@/store/notification-store";

function CategoryIcon({
  category,
  className,
}: {
  category: ReturnType<typeof getBellPreviewItem>["category"];
  className?: string;
}) {
  switch (category) {
    case "needs_response":
      return <UserRound className={className} aria-hidden />;
    case "discussion":
      return <MessageSquare className={className} aria-hidden />;
    case "progress":
      return <Sparkles className={className} aria-hidden />;
    default:
      return <Package className={className} aria-hidden />;
  }
}

export function NotificationBell() {
  const t = useTranslations("notifications.bell");
  const { formatRelativeTime } = useLocalizedTime();
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const previewItems = useNotificationStore((s) => s.previewItems);
  const streamStatus = useNotificationStore((s) => s.streamStatus);
  const pulseToken = useNotificationStore((s) => s.pulseToken);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const applySync = useNotificationStore((s) => s.applySync);
  const markLocalRead = useNotificationStore((s) => s.markLocalRead);
  const markAllLocalRead = useNotificationStore((s) => s.markAllLocalRead);
  const broadcastSync = useNotificationStore((s) => s.broadcastSync);

  const [open, setOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const lastPulseRef = useRef(pulseToken);

  const previews = useMemo(() => {
    const mapped = previewItems.map((n) => getBellPreviewItem(n));
    const unread = mapped.filter((n) => !n.isRead);
    const read = mapped.filter((n) => n.isRead);
    return [...unread, ...read].slice(0, 20);
  }, [previewItems]);

  const actionableCount = previews.filter((p) => p.isActionable && !p.isRead).length;

  useEffect(() => {
    if (pulseToken === lastPulseRef.current) return;
    lastPulseRef.current = pulseToken;
    setBadgePulse(true);
    const timer = setTimeout(() => setBadgePulse(false), 1200);
    return () => clearTimeout(timer);
  }, [pulseToken]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  async function openItem(id: string) {
    const item = previews.find((p) => p.id === id);
    if (!item?.href) return;

    markLocalRead(id);

    try {
      await markNotificationReadRequest(id);
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
      const at = new Date().toISOString();
      applySync({
        unreadCount: count,
        items: previewItems.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        at,
      });
      broadcastSync({
        unreadCount: count,
        items: previewItems.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        at,
      });
    } catch {
      /* navigate anyway */
    }

    setOpen(false);
    router.push(item.href);
  }

  async function markAllRead() {
    if (unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await markAllNotificationsReadRequest();
      setUnreadCount(0);
      markAllLocalRead();
      const at = new Date().toISOString();
      const items = previewItems.map((n) => ({ ...n, isRead: true }));
      applySync({ unreadCount: 0, items, at });
      broadcastSync({ unreadCount: 0, items, at });
      toast.success(t("markAllSuccess"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("markAllError"));
    } finally {
      setMarkingAll(false);
    }
  }

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200/90 bg-white text-zinc-600 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 sm:h-9 sm:w-9",
          open && "border-emerald-200 bg-emerald-50/60 text-zinc-900 ring-2 ring-emerald-500/15"
        )}
        aria-label={
          unreadCount > 0
            ? t("ariaWithCount", { count: unreadCount })
            : t("ariaDefault")
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell
          className={cn(
            "h-[18px] w-[18px] transition-transform",
            badgePulse && "scale-110"
          )}
        />
        {badgeLabel ? (
          <span
            className={cn(
              "absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white shadow-sm",
              badgePulse && "animate-pulse ring-2 ring-red-300"
            )}
          >
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+3.75rem)] z-50 overflow-hidden rounded-2xl border border-zinc-200/90 bg-white shadow-2xl shadow-zinc-950/10 sm:absolute sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:w-[min(24rem,calc(100vw-2rem))]"
        >
          <div className="border-b border-zinc-100 bg-gradient-to-r from-zinc-50 to-white px-4 py-3.5">
            <div>
              <p className="text-sm font-semibold text-zinc-900">{t("title")}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{t("subtitle")}</p>
            </div>
            {actionableCount > 0 ? (
              <p className="mt-2 text-xs font-medium text-amber-700">
                {t("actionRequired", { count: actionableCount })}
              </p>
            ) : null}
          </div>

          <div className="max-h-[min(26rem,calc(100dvh-8.5rem))] overflow-y-auto overscroll-contain">
            {streamStatus === "connecting" && previews.length === 0 ? (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-zinc-500">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                {t("loading")}
              </div>
            ) : previews.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 text-zinc-400">
                  <Bell className="h-5 w-5" aria-hidden />
                </div>
                <p className="text-sm font-medium text-zinc-800">{t("emptyTitle")}</p>
                <p className="mt-1 text-xs text-zinc-500">{t("emptyDescription")}</p>
              </div>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {previews.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={!item.href}
                      onClick={() => void openItem(item.id)}
                      className={cn(
                        "group flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-zinc-50 disabled:opacity-60",
                        !item.isRead && "bg-emerald-50/30"
                      )}
                    >
                      <div className="relative mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600 group-hover:bg-white">
                        <CategoryIcon category={item.category} className="h-4 w-4" />
                        {!item.isRead ? (
                          <span
                            className={cn(
                              "absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-white",
                              item.dotClass
                            )}
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={cn(
                              "text-sm text-zinc-900",
                              !item.isRead ? "font-semibold" : "font-medium"
                            )}
                          >
                            {item.title}
                          </span>
                          {!item.isRead ? (
                            <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                              {t("new")}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs text-zinc-600">
                          {item.subtitle || item.message}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-zinc-400">
                          <span>{item.categoryLabel}</span>
                          <span aria-hidden>·</span>
                          <span>{formatRelativeTime(item.updatedAt)}</span>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <PushNotificationPrompt variant="compact" />

          {unreadCount > 0 ? (
            <div className="border-t border-zinc-100 bg-zinc-50/80 px-4 py-3">
              <button
                type="button"
                onClick={() => void markAllRead()}
                disabled={markingAll}
                className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-800 transition-colors hover:bg-zinc-50 disabled:opacity-60 sm:min-h-0"
              >
                {markingAll ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <CheckCheck className="h-4 w-4" aria-hidden />
                )}
                {markingAll ? t("markingAll") : t("markAllRead")}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
