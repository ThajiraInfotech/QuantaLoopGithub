"use client";

import { useTranslations } from "next-intl";
import { useCallback } from "react";

import {
  formatDashboardGreetingLocalized,
  formatRelativeTimeLocalized,
  formatRelativeWhenLocalized,
} from "@/lib/i18n/time-format";

export function useLocalizedTime() {
  const t = useTranslations("time");

  const formatRelativeTime = useCallback(
    (iso: string) => formatRelativeTimeLocalized(iso, t),
    [t]
  );

  const formatRelativeWhen = useCallback(
    (iso: string) => formatRelativeWhenLocalized(iso, t),
    [t]
  );

  return { formatRelativeTime, formatRelativeWhen };
}

export function useDashboardGreeting(displayName: string) {
  const t = useTranslations("dashboard.home.greeting");
  return formatDashboardGreetingLocalized(displayName, t);
}
