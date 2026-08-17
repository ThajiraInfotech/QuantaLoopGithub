import type { InterestStatus } from "@/types/interest";
import type { Notification, NotificationType } from "@/types/notification";

export type NotificationCategory =
  | "needs_response"
  | "discussion"
  | "progress"
  | "closed"
  | "other";

export type NotificationCategoryMeta = {
  id: NotificationCategory;
  label: string;
  dotClass: string;
};

const TERMINAL_INTEREST: InterestStatus[] = ["completed", "closed", "rejected"];

const CATEGORY_META: Record<NotificationCategory, NotificationCategoryMeta> = {
  needs_response: {
    id: "needs_response",
    label: "Needs response",
    dotClass: "bg-amber-500",
  },
  discussion: {
    id: "discussion",
    label: "Discussion",
    dotClass: "bg-sky-500",
  },
  progress: {
    id: "progress",
    label: "Progress",
    dotClass: "bg-emerald-500",
  },
  closed: {
    id: "closed",
    label: "Closed",
    dotClass: "bg-zinc-400",
  },
  other: {
    id: "other",
    label: "Update",
    dotClass: "bg-zinc-400",
  },
};

function categoryFromInterestStatus(
  status: InterestStatus
): NotificationCategory {
  switch (status) {
    case "pending":
      return "needs_response";
    case "rejected":
    case "closed":
      return "closed";
    case "completed":
    case "pickup_scheduled":
    case "discussion":
    case "accepted":
      return "progress";
    default:
      return "other";
  }
}

export function isTerminalNotification(
  notification: Pick<Notification, "relatedInterestStatus">
): boolean {
  const s = notification.relatedInterestStatus;
  return s != null && TERMINAL_INTEREST.includes(s);
}

/** Sidebar badge + Action required section — not stale completed/closed rows. */
export function isActionableNotification(notification: Notification): boolean {
  if (notification.isRead) return false;

  const status = notification.relatedInterestStatus;
  if (status && TERMINAL_INTEREST.includes(status)) {
    return false;
  }

  switch (notification.type) {
    case "interest_received":
    case "response_reminder":
      return !status || status === "pending";
    case "coordination_follow_up":
      return true;
    default:
      return false;
  }
}

export function getNotificationCategory(
  notification: Pick<Notification, "type" | "title" | "relatedInterestStatus">
): NotificationCategory {
  if (notification.type === "coordination_follow_up") {
    return "discussion";
  }

  if (notification.relatedInterestStatus) {
    return categoryFromInterestStatus(notification.relatedInterestStatus);
  }

  const { type, title } = notification;
  const titleLower = title?.toLowerCase() ?? "";

  if (
    type === "interest_rejected" ||
    titleLower.includes("declined") ||
    titleLower.includes("closed")
  ) {
    return "closed";
  }

  switch (type) {
    case "interest_received":
    case "response_reminder":
      return "needs_response";
    case "interest_accepted":
    case "interest_workflow_update":
    case "new_matching_material":
    case "saved_opportunity_active":
    case "introduction_request":
    case "relevant_category_activity":
      return "progress";
    default:
      return "other";
  }
}

export function getCategoryMeta(
  notification: Pick<
    Notification,
    "type" | "title" | "relatedInterestStatus" | "opportunityStatusLabel"
  >
): NotificationCategoryMeta {
  return CATEGORY_META[getNotificationCategory(notification)];
}

/** Uppercase section chip — current opportunity state or event type. */
export function getDisplayCategoryLabel(notification: Notification): string {
  const status = notification.relatedInterestStatus;

  if (status === "completed") return "COMPLETED";
  if (status === "closed") return "CLOSED";
  if (status === "rejected") return "INTEREST DECLINED";
  if (status === "pending") return "NEEDS RESPONSE";
  if (status === "pickup_scheduled") return "PICKUP ARRANGED";
  if (status === "discussion" || status === "accepted") return "IN DISCUSSION";

  if (notification.type === "coordination_follow_up") {
    return "DISCUSSION";
  }

  const titleLower = notification.title?.toLowerCase() ?? "";
  if (
    notification.type === "interest_rejected" ||
    titleLower.includes("declined")
  ) {
    return "INTEREST DECLINED";
  }
  if (titleLower.includes("closed")) return "CLOSED";
  if (titleLower.includes("completed")) return "COMPLETED";

  switch (notification.type) {
    case "interest_received":
    case "response_reminder":
      return "NEEDS RESPONSE";
    case "interest_accepted":
      return "DISCUSSION";
    case "interest_workflow_update":
      return "UPDATE";
    case "new_matching_material":
      return "OPPORTUNITY";
    default:
      return getCategoryMeta(notification).label.toUpperCase();
  }
}

/** Card title — reflects the event / current state, not the original DB title. */
export function getEventHeadline(notification: Notification): string {
  const status = notification.relatedInterestStatus;

  if (status === "completed") return "Deal completed";
  if (status === "closed") return "Opportunity closed";
  if (status === "rejected") return "Interest declined";
  if (status === "pending") return "New buyer interest";
  if (status === "pickup_scheduled") return "Pickup arranged";
  if (status === "discussion" || status === "accepted") {
    return "Discussion update";
  }

  return headlineFromType(notification.type, notification.title);
}

function headlineFromType(
  type: NotificationType,
  storedTitle?: string
): string {
  switch (type) {
    case "interest_received":
    case "response_reminder":
      return "New buyer interest";
    case "coordination_follow_up":
      return "New discussion message";
    case "interest_accepted":
      return "Discussion started";
    case "interest_rejected":
      return "Interest declined";
    case "interest_workflow_update": {
      const t = storedTitle?.toLowerCase() ?? "";
      if (t.includes("pickup")) return "Pickup arranged";
      if (t.includes("closed")) return "Opportunity closed";
      if (t.includes("completed")) return "Deal completed";
      return "Opportunity update";
    }
    case "new_matching_material":
      return "New opportunity for you";
    case "saved_opportunity_active":
      return "Saved opportunity updated";
    case "introduction_request":
      return "Introduction requested";
    default:
      return storedTitle?.trim() || "Update";
  }
}

export function getNotificationHeadline(notification: Notification): string {
  if (
    notification.relatedInterestStatus ||
    notification.relatedInterestId ||
    notification.type === "coordination_follow_up"
  ) {
    return getEventHeadline(notification);
  }
  return getEventHeadline(notification);
}

export function getTerminalTimestampPrefix(
  status: InterestStatus
): string | null {
  switch (status) {
    case "completed":
      return "Completed";
    case "closed":
      return "Closed";
    case "rejected":
      return "Declined";
    default:
      return null;
  }
}

export function getCategoryLabelKey(
  category: NotificationCategory
): `categories.${NotificationCategory}` {
  return `categories.${category}`;
}

export function getDisplayCategoryLabelKey(
  notification: Notification
): string {
  const status = notification.relatedInterestStatus;

  if (status === "completed") return "chips.completed";
  if (status === "closed") return "chips.closed";
  if (status === "rejected") return "chips.interestDeclined";
  if (status === "pending") return "chips.needsResponse";
  if (status === "pickup_scheduled") return "chips.pickupArranged";
  if (status === "discussion" || status === "accepted") return "chips.inDiscussion";

  if (notification.type === "coordination_follow_up") {
    return "chips.discussion";
  }

  const titleLower = notification.title?.toLowerCase() ?? "";
  if (
    notification.type === "interest_rejected" ||
    titleLower.includes("declined")
  ) {
    return "chips.interestDeclined";
  }
  if (titleLower.includes("closed")) return "chips.closed";
  if (titleLower.includes("completed")) return "chips.completed";

  switch (notification.type) {
    case "interest_received":
    case "response_reminder":
      return "chips.needsResponse";
    case "interest_accepted":
      return "chips.discussion";
    case "interest_workflow_update":
      return "chips.update";
    case "new_matching_material":
      return "chips.opportunity";
    default:
      return getCategoryLabelKey(getNotificationCategory(notification));
  }
}

export function getNotificationHeadlineKey(notification: Notification): string {
  const status = notification.relatedInterestStatus;

  if (status === "completed") return "headlines.dealCompleted";
  if (status === "closed") return "headlines.opportunityClosed";
  if (status === "rejected") return "headlines.interestDeclined";
  if (status === "pending") return "headlines.newBuyerInterest";
  if (status === "pickup_scheduled") return "headlines.pickupArranged";
  if (status === "discussion" || status === "accepted") {
    return "headlines.discussionUpdate";
  }

  return headlineKeyFromType(notification.type, notification.title);
}

function headlineKeyFromType(
  type: NotificationType,
  storedTitle?: string
): string {
  switch (type) {
    case "interest_received":
    case "response_reminder":
      return "headlines.newBuyerInterest";
    case "coordination_follow_up":
      return "headlines.newDiscussionMessage";
    case "interest_accepted":
      return "headlines.discussionStarted";
    case "interest_rejected":
      return "headlines.interestDeclined";
    case "interest_workflow_update": {
      const t = storedTitle?.toLowerCase() ?? "";
      if (t.includes("pickup")) return "headlines.pickupArranged";
      if (t.includes("closed")) return "headlines.opportunityClosed";
      if (t.includes("completed")) return "headlines.dealCompleted";
      return "headlines.opportunityUpdate";
    }
    case "new_matching_material":
      return "headlines.newOpportunity";
    case "saved_opportunity_active":
      return "headlines.savedOpportunityUpdated";
    case "introduction_request":
      return "headlines.introductionRequested";
    default:
      return storedTitle?.trim() ? "headlines.custom" : "headlines.update";
  }
}

export function getTerminalTimestampPrefixKey(
  status: InterestStatus
): string | null {
  switch (status) {
    case "completed":
      return "terminal.completed";
    case "closed":
      return "terminal.closed";
    case "rejected":
      return "terminal.declined";
    default:
      return null;
  }
}

/** Recent updates section — operational inbox, not permanent archive. */
export const RECENT_UPDATES_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

export function filterRecentUpdates(items: Notification[]): Notification[] {
  const cutoff = Date.now() - RECENT_UPDATES_WINDOW_MS;
  return items.filter((n) => new Date(n.updatedAt).getTime() >= cutoff);
}

export function partitionNotifications(items: Notification[]): {
  actionRequired: Notification[];
  recentUpdates: Notification[];
} {
  const actionRequired: Notification[] = [];
  const recentUpdates: Notification[] = [];

  for (const item of items) {
    if (isActionableNotification(item)) {
      actionRequired.push(item);
    } else {
      recentUpdates.push(item);
    }
  }

  return {
    actionRequired,
    recentUpdates: filterRecentUpdates(recentUpdates),
  };
}
