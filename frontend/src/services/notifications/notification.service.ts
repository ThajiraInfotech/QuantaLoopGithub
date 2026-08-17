import { apiClient } from "../api/client";
import {
  getAxiosErrorMessage,
  isApiError,
  isApiSuccess,
} from "@/lib/api-result";
import type { Notification } from "@/types/notification";

export async function fetchUnreadNotificationCount(): Promise<number> {
  try {
    const { data } = await apiClient.get<unknown>("/notifications/unread-count");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ unreadCount: number }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.unreadCount;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchNotifications(): Promise<{
  items: Notification[];
  unreadCount: number;
}> {
  try {
    const { data } = await apiClient.get<unknown>("/notifications");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ items: Notification[]; unreadCount: number }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function markNotificationReadRequest(
  id: string
): Promise<void> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/notifications/${id}/read`,
      {}
    );
    if (data && typeof data === "object" && "success" in data) {
      if (isApiError(data)) {
        throw new Error(data.error.message);
      }
    }
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function markAllNotificationsReadRequest(): Promise<void> {
  try {
    const { data } = await apiClient.patch<unknown>(
      "/notifications/read-all",
      {}
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
