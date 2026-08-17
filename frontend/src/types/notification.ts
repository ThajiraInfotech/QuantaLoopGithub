export type NotificationType =
  | "interest_received"
  | "interest_accepted"
  | "interest_rejected"
  | "interest_workflow_update"
  | "new_matching_material"
  | "response_reminder"
  | "saved_opportunity_active"
  | "relevant_category_activity"
  | "coordination_follow_up"
  | "introduction_request";

import type { InterestStatus } from "@/types/interest";

export type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedMaterialId: string | null;
  relatedInterestId: string | null;
  relatedInterestStatus?: InterestStatus | null;
  buyerCompany?: string | null;
  providerCompany?: string | null;
  materialTitle?: string | null;
  opportunityStatusLabel?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};
