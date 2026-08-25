import { getAxiosErrorMessage, isApiError, isApiSuccess } from "@/lib/api-result";
import type {
  AdminDashboardData,
  AdminInterestDetail,
  AdminInterestRow,
  AdminInterestsResult,
  AdminMaterialDetail,
  AdminMaterialRow,
  AdminMaterialsResult,
  AdminParticipantDetail,
  AdminParticipantRow,
  AdminParticipantsResult,
  AdminReportDetail,
  AdminReportIssue,
  AdminReportsResult,
  AccountStatus,
} from "@/types/admin";
import type {
  AdminInvoiceRow,
  AdminInvoicesResult,
} from "@/types/billing";
import type { User } from "@/types/user";
import type { UserRole } from "@/types/user";

import { apiClient } from "../api/client";

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  try {
    const { data } = await apiClient.get<unknown>("/admin/dashboard");
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminDashboardData>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export type ParticipantListParams = {
  search?: string;
  role?: UserRole | "all";
  accountStatus?: AccountStatus | "all";
  page?: number;
  limit?: number;
};

export async function fetchAdminParticipants(
  params: ParticipantListParams = {}
): Promise<AdminParticipantsResult> {
  try {
    const { data } = await apiClient.get<unknown>("/admin/participants", {
      params,
    });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminParticipantsResult>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchAllAdminParticipants(
  params: Omit<ParticipantListParams, "page" | "limit"> = {}
): Promise<AdminParticipantRow[]> {
  const limit = 100;
  let page = 1;
  const rows: AdminParticipantRow[] = [];

  while (true) {
    const result = await fetchAdminParticipants({ ...params, page, limit });
    rows.push(...result.items);
    if (rows.length >= result.total || result.items.length === 0) {
      break;
    }
    page += 1;
  }

  return rows;
}

export async function fetchAdminParticipantDetail(
  userId: string
): Promise<AdminParticipantDetail> {
  try {
    const { data } = await apiClient.get<unknown>(
      `/admin/participants/${userId}`
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminParticipantDetail>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function patchParticipantAccountStatus(
  userId: string,
  accountStatus: AccountStatus
): Promise<User> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/admin/participants/${userId}`,
      { accountStatus }
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ user: User }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data.user;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export type AdminMaterialListParams = {
  search?: string;
  status?: "all" | "available" | "in_discussion" | "completed" | "archived";
  materialType?: string;
  location?: string;
  reportedOnly?: boolean;
  participant?: string;
  sort?: "newest" | "oldest" | "most_interests" | "most_reports";
  page?: number;
  limit?: number;
};

export async function fetchAdminMaterials(
  params: AdminMaterialListParams = {}
): Promise<AdminMaterialsResult> {
  try {
    const { data } = await apiClient.get<unknown>("/admin/materials", {
      params,
    });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminMaterialsResult>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchAllAdminMaterials(
  params: Omit<AdminMaterialListParams, "page" | "limit"> = {}
): Promise<AdminMaterialRow[]> {
  const limit = 100;
  let page = 1;
  const rows: AdminMaterialRow[] = [];

  while (true) {
    const result = await fetchAdminMaterials({ ...params, page, limit });
    rows.push(...result.items);
    if (rows.length >= result.total || result.items.length === 0) {
      break;
    }
    page += 1;
  }

  return rows;
}

export async function fetchAdminMaterialDetail(
  materialId: string
): Promise<AdminMaterialDetail> {
  try {
    const { data } = await apiClient.get<unknown>(
      `/admin/materials/${materialId}`
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminMaterialDetail>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function moderateAdminMaterial(
  materialId: string,
  action: "archive" | "restore"
): Promise<void> {
  try {
    const { data } = await apiClient.patch<unknown>(
      `/admin/materials/${materialId}`,
      { action }
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function bulkModerateAdminMaterials(
  ids: string[],
  action: "archive" | "restore"
): Promise<{ updated: number }> {
  try {
    const { data } = await apiClient.post<unknown>("/admin/materials/bulk", {
      ids,
      action,
    });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<{ updated: number }>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export type AdminInterestListParams = {
  search?: string;
  status?: "all" | "pending" | "in_discussion" | "completed";
  participant?: string;
  scope?: "created" | "received" | "completed";
  material?: string;
  buyer?: string;
  provider?: string;
  materialType?: string;
  location?: string;
  reportedOnly?: boolean;
  sort?: "newest" | "oldest" | "most_messages" | "most_reports";
  page?: number;
  limit?: number;
};

export async function fetchAdminInterests(
  params: AdminInterestListParams = {}
): Promise<AdminInterestsResult> {
  try {
    const { data } = await apiClient.get<unknown>("/admin/interests", {
      params,
    });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminInterestsResult>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchAllAdminInterests(
  params: Omit<AdminInterestListParams, "page" | "limit"> = {}
): Promise<AdminInterestRow[]> {
  const limit = 100;
  let page = 1;
  const rows: AdminInterestRow[] = [];

  while (true) {
    const result = await fetchAdminInterests({ ...params, page, limit });
    rows.push(...result.items);
    if (rows.length >= result.total || result.items.length === 0) {
      break;
    }
    page += 1;
  }

  return rows;
}

export async function fetchAdminInterestDetail(
  interestId: string
): Promise<AdminInterestDetail> {
  try {
    const { data } = await apiClient.get<unknown>(
      `/admin/interests/${interestId}`
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminInterestDetail>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export type AdminReportListParams = {
  search?: string;
  status?: "all" | "open" | "resolved";
  targetType?: "all" | "material" | "participant";
  reason?:
    | "all"
    | "misleading_information"
    | "spam"
    | "inactive_participant";
  reporter?: string;
  participant?: string;
  material?: string;
  interest?: string;
  dateFrom?: string;
  dateTo?: string;
  sort?: "newest" | "oldest";
  page?: number;
  limit?: number;
};

export async function fetchAdminReports(
  params: AdminReportListParams = {}
): Promise<AdminReportsResult> {
  try {
    const { data } = await apiClient.get<unknown>("/admin/reports", {
      params,
    });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminReportsResult>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchAllAdminReports(
  params: Omit<AdminReportListParams, "page" | "limit"> = {}
): Promise<AdminReportIssue[]> {
  const limit = 100;
  let page = 1;
  const rows: AdminReportIssue[] = [];

  while (true) {
    const result = await fetchAdminReports({ ...params, page, limit });
    rows.push(...result.items);
    if (rows.length >= result.total || result.items.length === 0) {
      break;
    }
    page += 1;
  }

  return rows;
}

export async function fetchAdminReportDetail(
  reportId: string
): Promise<AdminReportDetail> {
  try {
    const { data } = await apiClient.get<unknown>(`/admin/reports/${reportId}`);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminReportDetail>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export type AdminInvoiceListParams = {
  search?: string;
  month?: string;
  taxType?: "all" | "cgst_sgst" | "igst" | "export_zero_rated";
  page?: number;
  limit?: number;
};

export async function fetchAdminInvoices(
  params: AdminInvoiceListParams = {}
): Promise<AdminInvoicesResult> {
  try {
    const { data } = await apiClient.get<unknown>("/admin/invoices", {
      params,
    });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    if (!isApiSuccess<AdminInvoicesResult>(data)) {
      throw new Error("Unexpected response");
    }
    return data.data;
  } catch (e) {
    throw new Error(getAxiosErrorMessage(e));
  }
}

export async function fetchAllAdminInvoices(
  params: Omit<AdminInvoiceListParams, "page" | "limit"> = {}
): Promise<AdminInvoiceRow[]> {
  const limit = 100;
  let page = 1;
  const rows: AdminInvoiceRow[] = [];

  while (true) {
    const result = await fetchAdminInvoices({ ...params, page, limit });
    rows.push(...result.items);
    if (rows.length >= result.total || result.items.length === 0) {
      break;
    }
    page += 1;
  }

  return rows;
}

export async function openAdminInvoiceHtml(invoiceId: string): Promise<void> {
  const { data } = await apiClient.get<string>(
    `/admin/invoices/${encodeURIComponent(invoiceId)}/html`,
    { responseType: "text" }
  );
  const blob = new Blob([data], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
