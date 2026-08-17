export type ReminderType =
  | "response_reminder"
  | "inactive_conversation"
  | "pending_opportunity"
  | "saved_material_update";

export type ReminderPriority = "low" | "medium" | "high";

export type Reminder = {
  id: string;
  type: ReminderType;
  title: string;
  message: string;
  status: "open" | "dismissed";
  priority: ReminderPriority;
  materialId: string | null;
  interestId: string | null;
  conversationId: string | null;
  dueAt: string | null;
  createdAt: string;
  updatedAt: string;
};
