import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type { Material } from "@/types/material";
import type { TimelineEvent } from "@/types/timeline";
import type { CreateMaterialFormValues } from "@/validations/material";

import { apiClient } from "../api/client";

export async function fetchMaterials(): Promise<Material[]> {
  try {
    const { data } = await apiClient.get<unknown>("/materials");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ items: Material[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.items;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchMaterialById(id: string): Promise<Material> {
  try {
    const { data } = await apiClient.get<unknown>(`/materials/${id}`);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ material: Material }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.material;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchMaterialTimeline(
  materialId: string
): Promise<TimelineEvent[]> {
  try {
    const { data } = await apiClient.get<unknown>(
      `/materials/${materialId}/timeline`
    );
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

export type UpdateMaterialInput = Partial<CreateMaterialFormValues>;

export async function updateMaterial(
  id: string,
  body: UpdateMaterialInput
): Promise<Material> {
  try {
    const { data } = await apiClient.patch<unknown>(`/materials/${id}`, body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ material: Material }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.material;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function deleteMaterial(id: string): Promise<void> {
  try {
    const { data } = await apiClient.delete<unknown>(`/materials/${id}`);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ id: string }>(data)) {
      throw new Error("Unexpected response");
    }
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function createMaterial(
  body: CreateMaterialFormValues
): Promise<Material> {
  try {
    const { data } = await apiClient.post<unknown>("/materials", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ material: Material }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.material;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function uploadMaterialImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("image", file);
    const { data } = await apiClient.post<unknown>(
      "/materials/uploads",
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ url: string }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.url;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
