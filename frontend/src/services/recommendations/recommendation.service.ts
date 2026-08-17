import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type {
  MaterialRecommendationItem,
  ParticipantRecommendationItem,
  RecommendationSection,
} from "@/types/recommendation";

import { apiClient } from "../api/client";

export async function fetchMaterialRecommendations(): Promise<
  RecommendationSection<MaterialRecommendationItem>[]
> {
  try {
    const { data } = await apiClient.get<unknown>("/recommendations/materials");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ sections: RecommendationSection<MaterialRecommendationItem>[] }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.sections;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchParticipantRecommendations(): Promise<
  RecommendationSection<ParticipantRecommendationItem>[]
> {
  try {
    const { data } = await apiClient.get<unknown>("/recommendations/participants");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (
      !isApiSuccess<{ sections: RecommendationSection<ParticipantRecommendationItem>[] }>(
        data
      )
    ) {
      throw new Error("Unexpected response");
    }
    return data.data.sections;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
