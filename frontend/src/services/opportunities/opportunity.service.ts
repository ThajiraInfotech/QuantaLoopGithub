import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { OpportunityFeedSection } from "@/types/opportunity-feed";

import { apiClient } from "../api/client";

export async function fetchOpportunityFeed(): Promise<OpportunityFeedSection[]> {
  try {
    const { data } = await apiClient.get<unknown>("/opportunities/feed");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ sections: OpportunityFeedSection[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.sections;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchOpportunityMetrics(): Promise<{
  windowDays: number;
  averageResponseHours: number | null;
  activeResponseRatePct: number | null;
  recentEngagementScore: number;
}> {
  try {
    const { data } = await apiClient.get<unknown>("/opportunities/metrics");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ metrics: unknown }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.metrics as {
      windowDays: number;
      averageResponseHours: number | null;
      activeResponseRatePct: number | null;
      recentEngagementScore: number;
    };
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
