import { getNotificationContext } from "@/lib/notification-context";
import { getEventHeadline } from "@/lib/notification-display";
import type { Notification } from "@/types/notification";

export type BellPreviewItem = {
  id: string;
  title: string;
  subtitle: string;
  href: string | null;
  updatedAt: string;
};

export function getBellPreviewItem(
  notification: Notification,
  interestsOpen: (id: string) => string
): BellPreviewItem {
  const ctx = getNotificationContext(notification);
  const title = getEventHeadline(notification);

  let subtitle = ctx.material ?? ctx.buyer ?? ctx.provider ?? "";
  if (notification.type === "interest_received" && ctx.buyer) {
    subtitle = ctx.buyer;
  }
  if (notification.type === "coordination_follow_up" && ctx.material) {
    subtitle = ctx.material;
  }
  if (!subtitle) {
    subtitle = notification.message.split(".")[0]?.slice(0, 80) ?? "";
  }

  const href = notification.relatedInterestId
    ? interestsOpen(notification.relatedInterestId)
    : null;

  return {
    id: notification.id,
    title,
    subtitle,
    href,
    updatedAt: notification.updatedAt,
  };
}
