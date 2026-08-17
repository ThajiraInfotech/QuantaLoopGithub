export type InterestStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "discussion"
  | "pickup_scheduled"
  | "completed"
  | "closed";

export type InterestBuyerBrief = {
  id: string;
  companyName: string;
  name: string;
  email: string;
} | null;

export type Interest = {
  id: string;
  materialId: string;
  materialTitle: string;
  materialStatus?: string;
  buyer: InterestBuyerBrief;
  provider: InterestBuyerBrief | null;
  providerId: string;
  message: string;
  pickupTimeline: string;
  status: InterestStatus;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
};
