import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type {
  AdminContentInsightsResult,
  ContentInsight,
  ContentInsightInput,
  ContentInsightLanguage,
  ContentInsightStatus,
} from "@/types/content-insight";
import { getApiV1BaseUrl } from "@/utils/env";

import { apiClient } from "../api/client";

export type AdminInsightListParams = {
  search?: string;
  status?: ContentInsightStatus | "all";
  language?: ContentInsightLanguage | "all";
  page?: number;
  limit?: number;
};

export async function fetchAdminInsights(
  params: AdminInsightListParams = {}
): Promise<AdminContentInsightsResult> {
  try {
    const { data } = await apiClient.get<unknown>("/admin/insights", { params });
    if (isApiError(data)) throw new Error(data.error.message);
    if (!isApiSuccess<AdminContentInsightsResult>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchAdminInsight(id: string): Promise<ContentInsight> {
  try {
    const { data } = await apiClient.get<unknown>(`/admin/insights/${id}`);
    if (isApiError(data)) throw new Error(data.error.message);
    if (!isApiSuccess<{ insight: ContentInsight }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.insight;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function createAdminInsight(
  input: ContentInsightInput
): Promise<ContentInsight> {
  try {
    const { data } = await apiClient.post<unknown>("/admin/insights", input);
    if (isApiError(data)) throw new Error(data.error.message);
    if (!isApiSuccess<{ insight: ContentInsight }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.insight;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function updateAdminInsight(
  id: string,
  input: ContentInsightInput
): Promise<ContentInsight> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/admin/insights/${id}`,
      input
    );
    if (isApiError(data)) throw new Error(data.error.message);
    if (!isApiSuccess<{ insight: ContentInsight }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.insight;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function deleteAdminInsight(id: string): Promise<void> {
  try {
    const { data } = await apiClient.delete<unknown>(`/admin/insights/${id}`);
    if (isApiError(data)) throw new Error(data.error.message);
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

function serverApiBase(): string {
  const configured =
    process.env.API_INTERNAL_URL?.replace(/\/$/, "") ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
    "http://localhost:5000";
  return `${configured}/api/v1`;
}

export async function fetchPublishedInsights(options?: {
  language?: ContentInsightLanguage | "all";
  limit?: number;
}): Promise<ContentInsight[]> {
  try {
    const base =
      typeof window === "undefined" ? serverApiBase() : getApiV1BaseUrl();
    const params = new URLSearchParams();
    if (options?.language) params.set("language", options.language);
    if (options?.limit) params.set("limit", String(options.limit));
    const qs = params.toString();
    const res = await fetch(`${base}/content/insights${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const json = (await res.json()) as unknown;
    if (!isApiSuccess<{ insights: ContentInsight[] }>(json)) return [];
    return json.data.insights;
  } catch {
    return [];
  }
}

export async function fetchPublishedInsightBySlug(
  slug: string
): Promise<ContentInsight | null> {
  try {
    const base =
      typeof window === "undefined" ? serverApiBase() : getApiV1BaseUrl();
    const res = await fetch(
      `${base}/content/insights/${encodeURIComponent(slug)}`,
      { cache: "no-store" }
    );
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = (await res.json()) as unknown;
    if (!isApiSuccess<{ insight: ContentInsight }>(json)) return null;
    return json.data.insight;
  } catch {
    return null;
  }
}

export function slugifyInsightTitle(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
}
