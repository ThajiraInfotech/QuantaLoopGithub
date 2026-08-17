import axios from "axios";

import { useAuthStore } from "@/store/auth-store";
import { getPublicApiBaseUrl } from "@/utils/env";

const baseURL = getPublicApiBaseUrl();

export const apiClient = axios.create({
  baseURL: `${baseURL}/api/v1`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
