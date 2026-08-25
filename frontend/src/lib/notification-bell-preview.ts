import { ROUTES } from "@/constants/routes";
import { getNotificationContext } from "@/lib/notification-context";
import { getEventHeadline, getCategoryMeta, isActionableNotification } from "@/lib/notification-display";
import type { NotificationCategory } from "@/lib/notification-display";
import type { Notification } from "@/types/notification";

export type BellPreviewItem = {
  id: string;
  title: string;
  subtitle: string;
  message: string;
  href: string | null;
  updatedAt: string;
  isRead: boolean;
  isActionable: boolean;
  category: NotificationCategory;
  categoryLabel: string;
  dotClass: string;
};

export function getBellPreviewItem(notification: Notification): BellPreviewItem {
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
    ? ROUTES.interestsOpen(notification.relatedInterestId)
    : notification.relatedMaterialId
      ? ROUTES.materialDetail(notification.relatedMaterialId)
      : null;

  const meta = getCategoryMeta(notification);

  return {
    id: notification.id,
    title,
    subtitle,
    message: notification.message,
    href,
    updatedAt: notification.updatedAt,
    isRead: notification.isRead,
    isActionable: isActionableNotification(notification),
    category: meta.id,
    categoryLabel: meta.label,
    dotClass: meta.dotClass,
  };
}
