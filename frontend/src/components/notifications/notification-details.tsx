"use client";

import { getNotificationContext } from "@/lib/notification-context";
import { isTerminalNotification } from "@/lib/notification-display";
import { useNotificationLabels } from "@/hooks/use-notification-labels";
import { useLocalizedTime } from "@/hooks/use-localized-time";
import type { Notification } from "@/types/notification";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-sm leading-snug">
      <span className="font-medium text-zinc-800">{label}: </span>
      <span className="text-zinc-600">{value}</span>
    </div>
  );
}

export function NotificationDetails({
  notification,
}: {
  notification: Notification;
}) {
  const { formatRelativeTime } = useLocalizedTime();
  const {
    getTerminalTimestampPrefix,
    getStatusLabel,
    detailLabels,
  } = useNotificationLabels();
  const ctx = getNotificationContext(notification);
  const terminal = isTerminalNotification(notification);
  const terminalPrefix =
    notification.relatedInterestStatus &&
    getTerminalTimestampPrefix(notification.relatedInterestStatus);

  const statusLabel = notification.relatedInterestStatus
    ? getStatusLabel(notification.relatedInterestStatus)
    : ctx.status;

  const hasStructured = ctx.buyer || ctx.provider || ctx.material;

  if (!hasStructured && !terminal) {
    return (
      <p className="text-sm leading-relaxed text-zinc-600">{notification.message}</p>
    );
  }

  return (
    <div className="space-y-1">
      {ctx.buyer ? <DetailRow label={detailLabels.buyer} value={ctx.buyer} /> : null}
      {ctx.provider ? (
        <DetailRow label={detailLabels.provider} value={ctx.provider} />
      ) : null}
      {ctx.material ? (
        <DetailRow label={detailLabels.material} value={ctx.material} />
      ) : null}
      {!terminal && statusLabel ? (
        <DetailRow label={detailLabels.status} value={statusLabel} />
      ) : null}
      {terminal && terminalPrefix ? (
        <p className="text-xs text-zinc-500">
          {terminalPrefix}{" "}
          {formatRelativeTime(notification.updatedAt)}
        </p>
      ) : null}
    </div>
  );
}
