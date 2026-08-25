"use client";

import { useEffect } from "react";

import {
  getNotificationStreamUrl,
  isNotificationSyncPayload,
  readNotificationSseStream,
} from "@/lib/notification-stream";
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
} from "@/services/notifications/notification.service";
import { useAuthStore } from "@/store/auth-store";
import {
  subscribeNotificationBroadcast,
  useNotificationStore,
} from "@/store/notification-store";
import { getApiV1BaseUrl } from "@/utils/env";

const POLL_MS = 20_000;
const RETRY_MS = 4_000;

export function NotificationRealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const applySync = useNotificationStore((s) => s.applySync);
  const setStreamStatus = useNotificationStore((s) => s.setStreamStatus);
  const broadcastSync = useNotificationStore((s) => s.broadcastSync);

  useEffect(() => {
    if (!user) {
      setStreamStatus("offline");
      useNotificationStore.setState({
        unreadCount: 0,
        previewItems: [],
        lastSyncedAt: null,
      });
      return;
    }

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let abortController: AbortController | null = null;

    const streamUrl = `${getApiV1BaseUrl()}${getNotificationStreamUrl()}`;

    async function pullFallback(label: "polling" | "offline" | "connecting" | "live" = "polling") {
      if (cancelled) return;
      setStreamStatus(label === "live" ? "live" : label);
      try {
        const [{ items, unreadCount }, count] = await Promise.all([
          fetchNotifications(),
          fetchUnreadNotificationCount(),
        ]);
        if (cancelled) return;
        const at = new Date().toISOString();
        applySync({
          unreadCount: count ?? unreadCount,
          items: items.slice(0, 25),
          at,
        });
      } catch {
        if (!cancelled) setStreamStatus("offline");
      }
    }

    async function connectStream() {
      if (cancelled) return;
      abortController?.abort();
      abortController = new AbortController();
      setStreamStatus("connecting");

      try {
        for await (const frame of readNotificationSseStream(
          streamUrl,
          accessToken,
          abortController.signal
        )) {
          if (cancelled) return;

          if (frame.event === "ping") {
            setStreamStatus("live");
            continue;
          }

          if (frame.event === "sync" && isNotificationSyncPayload(frame.data)) {
            applySync({
              unreadCount: frame.data.unreadCount,
              items: frame.data.items,
              at: frame.data.at,
              pulse: true,
            });
            broadcastSync({
              unreadCount: frame.data.unreadCount,
              items: frame.data.items,
              at: frame.data.at,
            });
            setStreamStatus("live");
          }
        }

        if (!cancelled) {
          setStreamStatus("polling");
          retryTimer = setTimeout(connectStream, RETRY_MS);
        }
      } catch (error) {
        if (cancelled || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }
        await pullFallback("polling");
        if (!cancelled) {
          retryTimer = setTimeout(connectStream, RETRY_MS);
        }
      }
    }

    void pullFallback("connecting");
    void connectStream();

    pollTimer = setInterval(() => {
      if (useNotificationStore.getState().streamStatus !== "live") {
        void pullFallback("polling");
      }
    }, POLL_MS);

    const onFocus = () => {
      void pullFallback(
        useNotificationStore.getState().streamStatus === "live" ? "live" : "polling"
      );
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") onFocus();
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const unsubscribeBroadcast = subscribeNotificationBroadcast((payload) => {
      applySync({ ...payload, pulse: false });
    });

    return () => {
      cancelled = true;
      abortController?.abort();
      if (pollTimer) clearInterval(pollTimer);
      if (retryTimer) clearTimeout(retryTimer);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      unsubscribeBroadcast();
      setStreamStatus("offline");
    };
  }, [user, accessToken, applySync, broadcastSync, setStreamStatus]);

  return children;
}
