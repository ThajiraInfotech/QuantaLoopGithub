import axios from "axios";

import type { ApiErrorBody } from "@/types/auth";
import type { ApiSuccessEnvelope } from "@/types/api";

export function isApiError(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    (data as ApiErrorBody).success === false
  );
}

export function isApiSuccess<T>(data: unknown): data is ApiSuccessEnvelope<T> {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    (data as ApiSuccessEnvelope<T>).success === true
  );
}

export function getAxiosErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (isApiError(data)) {
      return data.error?.message ?? data.message ?? "Request failed";
    }
    if (typeof data === "object" && data !== null && "message" in data) {
      const msg = (data as { message?: unknown }).message;
      if (typeof msg === "string") return msg;
    }
    if (error.message) return error.message;
  }
  if (error instanceof Error) return error.message;
  return "Request failed";
}

/** True when the session is dead (expired JWT, deleted user, missing auth). */
export function isUnauthorizedError(error: unknown): boolean {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return true;
    const data = error.response?.data;
    if (isApiError(data)) {
      const code = data.error?.code;
      if (code === "INVALID_TOKEN" || code === "UNAUTHORIZED") return true;
    }
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const normalized = message.toLowerCase();
  return (
    normalized.includes("invalid or expired token") ||
    normalized.includes("authentication required")
  );
}
