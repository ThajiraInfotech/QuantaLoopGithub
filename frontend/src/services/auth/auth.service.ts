import axios from "axios";

import type { ApiErrorBody, ApiSuccess, AuthResponse } from "@/types/auth";
import type {
  ForgotPasswordFormValues,
  GoogleAccountSetupRequestBody,
  GoogleRegisterRequestBody,
  LoginFormValues,
  RegisterRequestBody,
  ResetPasswordFormValues,
} from "@/validations/auth";

import { apiClient } from "../api/client";

export type AuthRequestError = Error & {
  code?: string;
  email?: string;
};

function isApiError(data: unknown): data is ApiErrorBody {
  return (
    typeof data === "object" &&
    data !== null &&
    "success" in data &&
    (data as ApiErrorBody).success === false
  );
}

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (isApiError(data)) {
      const details = data.error.details as
        | { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
        | undefined;
      if (details?.fieldErrors) {
        const fieldMessages = Object.values(details.fieldErrors)
          .flat()
          .filter(Boolean);
        if (fieldMessages.length > 0) {
          return fieldMessages.join(" ");
        }
      }
      if (details?.formErrors?.length) {
        return details.formErrors.join(" ");
      }
      return data.error.message;
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

function toAuthRequestError(error: unknown): AuthRequestError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (isApiError(data)) {
      const details = data.error.details as { email?: string } | undefined;
      const err = new Error(data.error.message) as AuthRequestError;
      err.code = data.error.code;
      err.email =
        typeof details?.email === "string" ? details.email : undefined;
      return err;
    }
  }
  return new Error(getErrorMessage(error)) as AuthRequestError;
}

export async function loginRequest(
  body: LoginFormValues
): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<AuthResponse> | ApiErrorBody
    >("/auth/login", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw toAuthRequestError(e);
  }
}

export async function googleAuthRequest(body: {
  credential: string;
  rememberMe?: boolean;
  mode?: "login" | "signup";
}): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<AuthResponse> | ApiErrorBody
    >("/auth/google", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw toAuthRequestError(e);
  }
}

export async function previewGoogleCredentialRequest(
  credential: string
): Promise<{ email: string; name: string }> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<{ email: string; name: string }> | ApiErrorBody
    >("/auth/google/preview", { credential });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw toAuthRequestError(e);
  }
}

export async function registerWithGoogleRequest(
  body: GoogleRegisterRequestBody
): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<AuthResponse> | ApiErrorBody
    >("/auth/google/register", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw toAuthRequestError(e);
  }
}

export async function registerRequest(
  body: RegisterRequestBody
): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<AuthResponse> | ApiErrorBody
    >("/auth/register", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function forgotPasswordRequest(
  body: ForgotPasswordFormValues
): Promise<{ message: string; otpSentTo?: string }> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<{ message: string; otpSentTo?: string }> | ApiErrorBody
    >("/auth/forgot-password", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function resetPasswordRequest(
  body: ResetPasswordFormValues & { email: string }
): Promise<{ message: string }> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<{ message: string }> | ApiErrorBody
    >("/auth/reset-password", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function verifyEmailRequest(
  code: string
): Promise<{ message: string; user?: AuthResponse["user"] }> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<{ message: string; user?: AuthResponse["user"] }> | ApiErrorBody
    >("/auth/verify-email", { code });
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function resendVerificationRequest(body?: {
  email?: string;
}): Promise<{ message: string }> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<{ message: string }> | ApiErrorBody
    >("/auth/resend-verification", body ?? {});
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post("/auth/logout");
}

/** Discards an unpaid signup so the person can start over from step one. */
export async function cancelSignupRequest(): Promise<void> {
  try {
    const { data } = await apiClient.delete<ApiSuccess<unknown> | ApiErrorBody>(
      "/auth/signup"
    );
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}

export async function completeAccountSetupRequest(
  body: GoogleAccountSetupRequestBody
): Promise<AuthResponse> {
  try {
    const { data } = await apiClient.post<
      ApiSuccess<AuthResponse> | ApiErrorBody
    >("/auth/complete-account-setup", body);
    if (isApiError(data)) {
      throw new Error(data.error.message);
    }
    return data.data;
  } catch (e) {
    throw new Error(getErrorMessage(e));
  }
}
