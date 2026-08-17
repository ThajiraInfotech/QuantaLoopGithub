"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";

import {
  getCategoryMeta,
  getDisplayCategoryLabelKey,
  getNotificationCategory,
  getNotificationHeadlineKey,
  getCategoryLabelKey,
  getTerminalTimestampPrefixKey,
} from "@/lib/notification-display";
import {
  getNotificationContext,
  statusLabelFromInterest,
} from "@/lib/notification-context";
import type { InterestStatus } from "@/types/interest";
import type { Notification } from "@/types/notification";

export function useNotificationLabels() {
  const t = useTranslations("notifications.display");
  const tCommon = useTranslations("common");

  return useMemo(
    () => ({
      getCategoryMeta: (notification: Notification) => {
        const meta = getCategoryMeta(notification);
        return {
          ...meta,
          label: t(getCategoryLabelKey(getNotificationCategory(notification))),
        };
      },
      getDisplayCategoryLabel: (notification: Notification) => {
        const key = getDisplayCategoryLabelKey(notification);
        if (key === "headlines.custom") {
          return notification.title?.trim() || t("headlines.update");
        }
        return t(key);
      },
      getNotificationHeadline: (notification: Notification) => {
        const key = getNotificationHeadlineKey(notification);
        if (key === "headlines.custom") {
          return notification.title?.trim() || t("headlines.update");
        }
        return t(key);
      },
      getTerminalTimestampPrefix: (status: InterestStatus) => {
        const key = getTerminalTimestampPrefixKey(status);
        return key ? t(key) : null;
      },
      getStatusLabel: (status: InterestStatus) => {
        const keyMap: Partial<Record<InterestStatus, string>> = {
          pending: "status.pending",
          accepted: "status.accepted",
          rejected: "status.rejected",
          discussion: "status.discussion",
          pickup_scheduled: "status.pickup_scheduled",
          completed: "status.completed",
          closed: "status.closed",
        };
        const key = keyMap[status];
        return key ? t(key) : status;
      },
      groupSubline: (notification: Notification) => {
        const ctx = getNotificationContext(notification);
        const buyer = ctx.buyer ?? tCommon("buyer");
        const material = ctx.material ?? t("fallbackMaterial");
        return t("groupSubline", { buyer, material });
      },
      detailLabels: {
        buyer: t("details.buyer"),
        provider: t("details.provider"),
        material: t("details.material"),
        status: t("details.status"),
      },
    }),
    [t, tCommon]
  );
}
