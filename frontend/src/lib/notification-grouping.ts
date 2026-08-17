import { isActionableNotification } from "@/lib/notification-display";
import type { Notification } from "@/types/notification";

const GROUPABLE_TYPES = new Set<Notification["type"]>([
  "interest_received",
  "response_reminder",
]);

export type UnreadDisplayItem =
  | { kind: "single"; notification: Notification }
  | {
      kind: "group";
      id: string;
      notifications: Notification[];
      latestAt: string;
    };

export function isGroupablePendingInterest(notification: Notification): boolean {
  if (!isActionableNotification(notification)) return false;
  if (!GROUPABLE_TYPES.has(notification.type)) return false;
  if (!notification.relatedInterestId) return false;
  const status = notification.relatedInterestStatus;
  return status === "pending" || status == null;
}

export function buildActionRequiredDisplayItems(
  actionRequired: Notification[]
): UnreadDisplayItem[] {
  const groupable: Notification[] = [];
  const singles: Notification[] = [];

  for (const item of actionRequired) {
    if (isGroupablePendingInterest(item)) {
      groupable.push(item);
    } else {
      singles.push(item);
    }
  }

  const display: UnreadDisplayItem[] = [];

  if (groupable.length >= 2) {
    const latestAt = groupable.reduce(
      (max, n) => (n.updatedAt > max ? n.updatedAt : max),
      groupable[0].updatedAt
    );
    display.push({
      kind: "group",
      id: "pending-buyer-interests",
      notifications: [...groupable].sort(
        (a, b) => b.updatedAt.localeCompare(a.updatedAt)
      ),
      latestAt,
    });
  } else {
    for (const n of groupable) {
      display.push({ kind: "single", notification: n });
    }
  }

  for (const n of singles) {
    display.push({ kind: "single", notification: n });
  }

  display.sort((a, b) => {
    const aTime = a.kind === "group" ? a.latestAt : a.notification.updatedAt;
    const bTime = b.kind === "group" ? b.latestAt : b.notification.updatedAt;
    return bTime.localeCompare(aTime);
  });

  return display;
}

export function countUnreadDisplayItems(items: UnreadDisplayItem[]): number {
  return items.length;
}
