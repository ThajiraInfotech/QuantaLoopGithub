import { groupSubline } from "@/lib/notification-context";
import { getEventHeadline } from "@/lib/notification-display";
import type { Notification } from "@/types/notification";

export type RecentUpdateBucket =
  | "deal_completed"
  | "opportunity_closed"
  | "interest_declined"
  | "pickup_arranged"
  | "other";

export type RecentUpdateGroup = {
  id: string;
  bucket: RecentUpdateBucket;
  dayKey: string;
  dayLabel: string;
  notifications: Notification[];
  latestAt: string;
};

export type RecentUpdateDisplayItem =
  | { kind: "group"; group: RecentUpdateGroup }
  | { kind: "single"; notification: Notification };

const BUCKET_COPY: Record<
  Exclude<RecentUpdateBucket, "other">,
  { one: string; many: string }
> = {
  deal_completed: {
    one: "deal completed",
    many: "deals completed",
  },
  opportunity_closed: {
    one: "opportunity closed",
    many: "opportunities closed",
  },
  interest_declined: {
    one: "interest declined",
    many: "interests declined",
  },
  pickup_arranged: {
    one: "pickup arranged",
    many: "pickups arranged",
  },
};

function toDayKey(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function dayLabelFromKey(dayKey: string): string {
  const todayKey = toDayKey(new Date().toISOString());
  if (dayKey === todayKey) return "today";

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  if (dayKey === toDayKey(yesterday.toISOString())) return "yesterday";

  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getRecentUpdateBucket(
  notification: Notification
): RecentUpdateBucket {
  const status = notification.relatedInterestStatus;

  if (status === "completed") return "deal_completed";
  if (status === "closed") return "opportunity_closed";
  if (status === "rejected") return "interest_declined";
  if (status === "pickup_scheduled") return "pickup_arranged";

  if (notification.type === "interest_rejected") return "interest_declined";

  const headline = getEventHeadline(notification).toLowerCase();
  if (headline.includes("deal completed") || headline.includes("completed")) {
    return "deal_completed";
  }
  if (headline.includes("opportunity closed") || headline.includes("closed")) {
    return "opportunity_closed";
  }
  if (headline.includes("declined")) return "interest_declined";
  if (headline.includes("pickup arranged")) return "pickup_arranged";

  return "other";
}

export function recentUpdateSummaryTitle(group: RecentUpdateGroup): string {
  const count = group.notifications.length;
  const bucket = group.bucket as Exclude<RecentUpdateBucket, "other">;

  const titleByBucket: Record<
    Exclude<RecentUpdateBucket, "other">,
    [string, string]
  > = {
    deal_completed: ["Deal Completed", "Deals Completed"],
    opportunity_closed: ["Opportunity Closed", "Opportunities Closed"],
    interest_declined: ["Interest Declined", "Interests Declined"],
    pickup_arranged: ["Pickup Arranged", "Pickups Arranged"],
  };

  const [singular, plural] = titleByBucket[bucket];
  const label = count === 1 ? `1 ${singular}` : `${count} ${plural}`;

  if (group.dayLabel === "today") return `✓ ${label} Today`;
  if (group.dayLabel === "yesterday") return `✓ ${label} Yesterday`;
  return `✓ ${label} on ${group.dayLabel}`;
}

/** @deprecated Use recentUpdateSummaryTitle */
export function recentUpdateSummaryLine(group: RecentUpdateGroup): string {
  return recentUpdateSummaryTitle(group);
}

export function buildRecentUpdatesDisplay(
  items: Notification[]
): RecentUpdateDisplayItem[] {
  const groupMap = new Map<string, Notification[]>();
  const singles: Notification[] = [];

  for (const item of items) {
    const bucket = getRecentUpdateBucket(item);
    if (bucket === "other") {
      singles.push(item);
      continue;
    }
    const dayKey = toDayKey(item.updatedAt);
    const key = `${dayKey}:${bucket}`;
    const list = groupMap.get(key) ?? [];
    list.push(item);
    groupMap.set(key, list);
  }

  const display: RecentUpdateDisplayItem[] = [];

  for (const [key, notifications] of groupMap) {
    const [dayKey, bucket] = key.split(":") as [string, RecentUpdateBucket];
    const sorted = [...notifications].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt)
    );
    display.push({
      kind: "group",
      group: {
        id: key,
        bucket,
        dayKey,
        dayLabel: dayLabelFromKey(dayKey),
        notifications: sorted,
        latestAt: sorted[0].updatedAt,
      },
    });
  }

  for (const n of singles) {
    display.push({ kind: "single", notification: n });
  }

  display.sort((a, b) => {
    const aTime =
      a.kind === "group" ? a.group.latestAt : a.notification.updatedAt;
    const bTime =
      b.kind === "group" ? b.group.latestAt : b.notification.updatedAt;
    return bTime.localeCompare(aTime);
  });

  return display;
}

export { groupSubline };
