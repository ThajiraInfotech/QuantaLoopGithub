import type { Interest, InterestStatus } from "@/types/interest";

const ACTIVE_STATUSES: InterestStatus[] = [
  "accepted",
  "discussion",
  "pickup_scheduled",
];

const HISTORY_STATUSES: InterestStatus[] = ["completed", "closed", "rejected"];

export type InterestInboxBucket = "pending" | "active" | "history";

export function bucketInterests(items: Interest[]) {
  const pending: Interest[] = [];
  const active: Interest[] = [];
  const history: Interest[] = [];

  for (const item of items) {
    if (item.status === "pending") {
      pending.push(item);
    } else if (ACTIVE_STATUSES.includes(item.status)) {
      active.push(item);
    } else if (HISTORY_STATUSES.includes(item.status)) {
      history.push(item);
    }
  }

  return { pending, active, history };
}

export function countInboxKpis(items: Interest[]) {
  const { pending, active, history } = bucketInterests(items);
  return {
    pending: pending.length,
    active: active.length,
    completed: history.length,
  };
}

export function canMessageInline(
  status: InterestStatus,
  conversationId: string | null
): boolean {
  if (!conversationId) return false;
  return ["accepted", "discussion", "pickup_scheduled"].includes(status);
}

export function canOpenDiscussionThread(status: InterestStatus): boolean {
  return status === "discussion" || status === "pickup_scheduled";
}

export function historyStatusLabel(status: InterestStatus): string | null {
  switch (status) {
    case "completed":
      return "Completed";
    case "rejected":
      return "Declined";
    case "closed":
      return "Closed";
    default:
      return null;
  }
}
