import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { ProfilePatchInput } from "@/validations/profile";
import type { ProfileWithTrust } from "@/types/profile";

import { apiClient } from "../api/client";

export async function fetchMyProfile(): Promise<ProfileWithTrust> {
  try {
    const { data } = await apiClient.get<unknown>("/profile/me");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<ProfileWithTrust>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function patchMyProfile(
  body: ProfilePatchInput
): Promise<ProfileWithTrust> {
  try {
    const { data } = await apiClient.patch<unknown>("/profile/me", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<ProfileWithTrust>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchProfileById(
  id: string
): Promise<ProfileWithTrust> {
  try {
    const { data } = await apiClient.get<unknown>(`/profile/${id}`);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<ProfileWithTrust>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
