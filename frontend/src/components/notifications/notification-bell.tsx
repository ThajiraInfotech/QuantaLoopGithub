"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { ROUTES } from "@/constants/routes";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import { getBellPreviewItem } from "@/lib/notification-bell-preview";
import { isActionableNotification } from "@/lib/notification-display";
import { cn } from "@/lib/utils";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  markNotificationReadRequest,
} from "@/services/notifications/notification.service";
import { useNotificationStore } from "@/store/notification-store";

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

export function NotificationBell() {
  const t = useTranslations("notifications.bell");
  const { formatRelativeTime } = useLocalizedTime();
  const router = useRouter();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previews, setPreviews] = useState<
    ReturnType<typeof getBellPreviewItem>[]
  >([]);
  const rootRef = useRef<HTMLDivElement>(null);

  const loadActionable = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await fetchNotifications();
      const actionable = items
        .filter((n) => isActionableNotification(n))
        .slice(0, 8);
      setPreviews(
        actionable.map((n) => getBellPreviewItem(n, ROUTES.interestsOpen))
      );
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      setPreviews([]);
    } finally {
      setLoading(false);
    }
  }, [setUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void loadActionable();
  }, [open, loadActionable]);

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

    try {
      await markNotificationReadRequest(id);
      const count = await fetchUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      /* navigate anyway */
    }

    setOpen(false);
    router.push(item.href);
  }

  const badgeLabel =
    unreadCount > 99 ? "99+" : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200/90 text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900",
          open && "bg-zinc-50 text-zinc-900"
        )}
        aria-label={
          unreadCount > 0
            ? t("ariaWithCount", { count: unreadCount })
            : t("ariaDefault")
        }
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon className="h-[18px] w-[18px]" />
        {badgeLabel ? (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">
            {badgeLabel}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(100vw-2rem,22rem)] overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-xl shadow-zinc-950/10"
        >
          <div className="border-b border-zinc-100 px-4 py-3">
            <p className="text-sm font-semibold text-zinc-900">{t("title")}</p>
            <p className="text-xs text-zinc-500">{t("subtitle")}</p>
          </div>

          <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
            {loading ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                {t("loading")}
              </p>
            ) : previews.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500">
                {t("empty")}
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {previews.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="menuitem"
                      disabled={!item.href}
                      onClick={() => void openItem(item.id)}
                      className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-colors hover:bg-zinc-50 disabled:opacity-60"
                    >
                      <span className="text-sm font-medium text-zinc-900">
                        {item.title}
                      </span>
                      <span className="line-clamp-1 text-xs text-zinc-600">
                        {item.subtitle}
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        {formatRelativeTime(item.updatedAt)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="border-t border-zinc-100 px-4 py-3">
            <Link
              href={ROUTES.notifications}
              onClick={() => setOpen(false)}
              className="text-xs font-medium text-zinc-800 underline-offset-4 hover:underline"
            >
              {t("viewAll")} →
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
