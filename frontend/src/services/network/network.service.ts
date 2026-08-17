import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { NetworkOverview } from "@/types/network";

import { apiClient } from "../api/client";

export async function fetchNetworkOverview(): Promise<NetworkOverview> {
  try {
    const { data } = await apiClient.get<unknown>("/network/overview");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<NetworkOverview>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export type IntroductionRequestInput = {
  buyerId: string;
  message?: string;
  materialId?: string;
};

export async function requestIntroduction(
  body: IntroductionRequestInput
): Promise<{ id: string; buyerId: string; createdAt: string }> {
  try {
    const { data } = await apiClient.post<unknown>(
      "/network/introduction-requests",
      body
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ introduction: { id: string; buyerId: string; createdAt: string } }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.introduction;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
