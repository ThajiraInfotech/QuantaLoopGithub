export type TimelineEventType =
  | "interest_received"
  | "interest_accepted"
  | "interest_rejected"
  | "discussion_opened"
  | "workflow_discussion"
  | "workflow_pickup_scheduled"
  | "workflow_completed"
  | "workflow_closed"
  | "message_posted"
  | "material_status_changed"
  | "opportunity_saved";

export type TimelineEvent = {
  id: string;
  type: TimelineEventType;
  summary: string;
  actorId: string | null;
  materialId: string | null;
  interestId: string | null;
  conversationId: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
};
