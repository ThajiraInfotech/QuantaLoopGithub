import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { Conversation, ThreadMessage } from "@/types/conversation";

import { apiClient } from "../api/client";

export async function fetchMyConversations(): Promise<Conversation[]> {
  try {
    const { data } = await apiClient.get<unknown>("/conversations/mine");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ items: Conversation[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.items;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchConversationById(
  id: string
): Promise<Conversation> {
  try {
    const { data } = await apiClient.get<unknown>(`/conversations/${id}`);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ conversation: Conversation }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.conversation;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchConversationMessages(
  conversationId: string,
  params?: { limit?: number; before?: string }
): Promise<{ items: ThreadMessage[]; pagination: { limit: number; nextBefore: string | null } }> {
  try {
    const { data } = await apiClient.get<unknown>(
      `/conversations/${conversationId}/messages`,
      { params }
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (
      !isApiSuccess<{
        items: ThreadMessage[];
        pagination: { limit: number; nextBefore: string | null };
      }>(data)
    ) {
      throw new Error("Unexpected response");
    }
    return { items: data.data.items, pagination: data.data.pagination };
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function postMessageRequest(body: {
  conversationId: string;
  content: string;
}): Promise<ThreadMessage> {
  try {
    const { data } = await apiClient.post<unknown>("/messages", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ message: ThreadMessage }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.message;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
