import axios from "axios";

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
