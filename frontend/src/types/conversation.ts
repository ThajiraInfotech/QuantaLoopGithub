export type ConversationStatus = "active" | "closed";

export type Conversation = {
  id: string;
  materialId: string;
  materialTitle: string;
  interestId: string;
  providerId: string;
  buyerId: string;
  status: ConversationStatus;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ThreadMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderCompany: string;
  isSystem?: boolean;
  content: string;
  attachments: { kind: string; ref: string }[];
  createdAt: string;
  updatedAt: string;
};
