import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { ActivitySignalsSummary, OperationalInsight } from "@/types/insight";

import { apiClient } from "../api/client";

export async function fetchOperationalInsights(): Promise<OperationalInsight[]> {
  try {
    const { data } = await apiClient.get<unknown>("/insights");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ insights: OperationalInsight[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.insights;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchActivitySignalsSummary(): Promise<ActivitySignalsSummary> {
  try {
    const { data } = await apiClient.get<unknown>("/activity-signals/summary");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<ActivitySignalsSummary>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
