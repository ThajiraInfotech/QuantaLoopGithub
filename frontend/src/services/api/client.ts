import axios from "axios";

import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/store/auth-store";
import { getApiV1BaseUrl } from "@/utils/env";

export const apiClient = axios.create({
  baseURL: getApiV1BaseUrl(),
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  config.baseURL = getApiV1BaseUrl();
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Login/register etc. return 401 for bad credentials — do not treat as dead session. */
const AUTH_ATTEMPT_PATH =
  /\/auth\/(login|register|google|forgot-password|reset-password|verify-email|resend-verification|logout)/i;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      typeof window !== "undefined"
    ) {
      const url = `${error.config?.baseURL ?? ""}${error.config?.url ?? ""}`;
      if (!AUTH_ATTEMPT_PATH.test(url) && useAuthStore.getState().accessToken) {
        useAuthStore.getState().clearSession();
        const path = window.location.pathname;
        if (
          path.startsWith("/dashboard") ||
          path.startsWith("/onboarding") ||
          path.startsWith("/admin")
        ) {
          window.location.replace(ROUTES.home);
        }
      }
    }
    return Promise.reject(error);
  }
);
