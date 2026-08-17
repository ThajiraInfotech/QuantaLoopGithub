import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { TimelineEvent } from "@/types/timeline";

import { apiClient } from "../api/client";

export async function fetchActivityTimeline(
  limit?: number
): Promise<TimelineEvent[]> {
  try {
    const { data } = await apiClient.get<unknown>("/activity", {
      params: limit ? { limit } : undefined,
    });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ items: TimelineEvent[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.items;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
