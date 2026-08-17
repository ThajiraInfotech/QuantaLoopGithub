import { apiClient } from "../api/client";
import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
export type BuyerSuggestionItem = {
  materialId: string;
  title: string;
  materialType: string;
  location: string;
  providerCompany: string;
  score: number;
  headline: string;
};

export type ProviderMatchBuyer = {
  buyerId: string;
  companyName: string;
  location: string;
  industryType: string;
  matchPercent: number;
  reasons: string[];
  verificationStatus?: "unverified" | "pending" | "verified";
  memberSince?: string;
  lastActiveAt?: string;
  averageResponseTime?: string;
  responseRate?: number;
  materialInterests?: string[];
};

export type ProviderMatchSignals = {
  headlines: string[];
  buyers: ProviderMatchBuyer[];
};

export function isProviderMatchSignals(
  data: BuyerSuggestions | ProviderMatchSignals
): data is ProviderMatchSignals {
  return (
    "buyers" in data &&
    Array.isArray(data.buyers) &&
    (data.buyers.length === 0 ||
      (typeof data.buyers[0]?.matchPercent === "number" &&
        "buyerId" in data.buyers[0]))
  );
}

export type BuyerSuggestions = { items: BuyerSuggestionItem[] };

export async function fetchMatchSuggestions(): Promise<
  BuyerSuggestions | ProviderMatchSignals
> {
  try {
    const { data } = await apiClient.get<unknown>("/matches/suggestions");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<BuyerSuggestions | ProviderMatchSignals>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}
