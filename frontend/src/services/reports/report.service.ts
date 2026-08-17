import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { CreateReportPayload, Report } from "@/types/report";

import { apiClient } from "../api/client";

export async function createReportRequest(
  payload: CreateReportPayload
): Promise<Report> {
  try {
    const { data } = await apiClient.post<unknown>("/reports", payload);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ report: Report }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.report;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function resolveReportRequest(reportId: string): Promise<Report> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/reports/${reportId}/resolve`,
      { status: "resolved" }
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ report: Report }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.report;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
