import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { AccessPlansPayload } from "@/types/access";

import { apiClient } from "../api/client";

export async function fetchAccessPlans(): Promise<AccessPlansPayload> {
  try {
    const { data } = await apiClient.get<unknown>("/access/plans");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AccessPlansPayload>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
