import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { Reminder } from "@/types/reminder";

import { apiClient } from "../api/client";

export async function fetchReminders(): Promise<Reminder[]> {
  try {
    const { data } = await apiClient.get<unknown>("/reminders");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ items: Reminder[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.items;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function dismissReminderRequest(reminderId: string): Promise<Reminder> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/reminders/${reminderId}/dismiss`
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ reminder: Reminder }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.reminder;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
