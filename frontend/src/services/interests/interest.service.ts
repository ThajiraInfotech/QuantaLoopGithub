import { apiClient } from "../api/client";
import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { Interest } from "@/types/interest";

export async function fetchMyInterests(): Promise<Interest[]> {
  try {
    const { data } = await apiClient.get<unknown>("/interests/my");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ items: Interest[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.items;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchMyInterestForMaterial(
  materialId: string
): Promise<Interest | null> {
  try {
    const { data } = await apiClient.get<unknown>(
      `/interests/material/${materialId}/me`
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ interest: Interest | null }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.interest;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function createInterestRequest(body: {
  materialId: string;
  message?: string;
  pickupTimeline?: string;
}): Promise<Interest> {
  try {
    const { data } = await apiClient.post<unknown>("/interests", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ interest: Interest }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.interest;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function updateInterestStatusRequest(
  interestId: string,
  status: "accepted" | "rejected"
): Promise<Interest> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/interests/${interestId}/status`,
      { status }
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ interest: Interest }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.interest;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export type InterestWorkflowAction =
  | "discussion"
  | "pickup_scheduled"
  | "completed"
  | "closed";

export async function patchInterestWorkflowRequest(
  interestId: string,
  status: InterestWorkflowAction
): Promise<Interest> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/interests/${interestId}/workflow`,
      { status }
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ interest: Interest }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.interest;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
