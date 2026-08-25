import { create } from "zustand";

import type { NotificationStreamStatus } from "@/lib/notification-stream";
import type { Notification } from "@/types/notification";

const BROADCAST_CHANNEL = "ql-notifications";

export type NotificationStoreState = {
  unreadCount: number;
  previewItems: Notification[];
  streamStatus: NotificationStreamStatus;
  lastSyncedAt: string | null;
  pulseToken: number;
};

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  return new BroadcastChannel(BROADCAST_CHANNEL);
}

export const useNotificationStore = create<
  NotificationStoreState & {
    setUnreadCount: (n: number) => void;
    applySync: (payload: {
      unreadCount: number;
      items: Notification[];
      at: string;
      pulse?: boolean;
    }) => void;
    setStreamStatus: (status: NotificationStreamStatus) => void;
    markLocalRead: (id: string) => void;
    markAllLocalRead: () => void;
    broadcastSync: (payload: {
      unreadCount: number;
      items: Notification[];
      at: string;
    }) => void;
  }
>((set, get) => ({
  unreadCount: 0,
  previewItems: [],
  streamStatus: "connecting",
  lastSyncedAt: null,
  pulseToken: 0,

  setUnreadCount: (n) => set({ unreadCount: n }),

  applySync: ({ unreadCount, items, at, pulse = false }) =>
    set((state) => ({
      unreadCount,
      previewItems: items,
      lastSyncedAt: at,
      pulseToken: pulse ? state.pulseToken + 1 : state.pulseToken,
    })),

  setStreamStatus: (streamStatus) => set({ streamStatus }),

  markLocalRead: (id) =>
    set((state) => ({
      previewItems: state.previewItems.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      ),
    })),

  markAllLocalRead: () =>
    set((state) => ({
      previewItems: state.previewItems.map((item) => ({
        ...item,
        isRead: true,
      })),
    })),

  broadcastSync: (payload) => {
    getBroadcastChannel()?.postMessage({ type: "sync", payload });
  },
}));

export function subscribeNotificationBroadcast(
  onSync: (payload: {
    unreadCount: number;
    items: Notification[];
    at: string;
  }) => void
) {
  const channel = getBroadcastChannel();
  if (!channel) return () => {};

  const handler = (event: MessageEvent) => {
    if (event.data?.type !== "sync" || !event.data.payload) return;
    onSync(event.data.payload);
  };

  channel.addEventListener("message", handler);
  return () => channel.removeEventListener("message", handler);
}
