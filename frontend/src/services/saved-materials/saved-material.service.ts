import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { SavedMaterialRow } from "@/types/saved-material";

import { apiClient } from "../api/client";

export async function fetchSavedMaterials(): Promise<SavedMaterialRow[]> {
  try {
    const { data } = await apiClient.get<unknown>("/saved-materials");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ items: SavedMaterialRow[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.items;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function saveMaterialRequest(materialId: string): Promise<void> {
  try {
    const { data } = await apiClient.post<unknown>(
      `/saved-materials/${materialId}`
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ saved: unknown }>(data)) {
      throw new Error("Unexpected response");
    }
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function unsaveMaterialRequest(materialId: string): Promise<void> {
  try {
    const { data } = await apiClient.delete<unknown>(
      `/saved-materials/${materialId}`
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ removed: boolean }>(data)) {
      throw new Error("Unexpected response");
    }
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
