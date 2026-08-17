type TimeTranslator = (
  key: string,
  values?: Record<string, string | number | Date>
) => string;

export function formatRelativeTimeLocalized(iso: string, t: TimeTranslator): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Math.max(0, Date.now() - then);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return t("justNow");
  if (diffMs < hour) {
    const count = Math.round(diffMs / minute);
    return t("minutesAgo", { count });
  }
  if (diffMs < day) {
    const count = Math.round(diffMs / hour);
    return t("hoursAgo", { count });
  }
  if (diffMs < 14 * day) {
    const count = Math.round(diffMs / day);
    return t("daysAgo", { count });
  }

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatRelativeWhenLocalized(iso: string, t: TimeTranslator): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Math.max(0, Date.now() - then);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return t("justNow");
  if (diffMs < hour) {
    const count = Math.round(diffMs / minute);
    return t("minutesAgo", { count });
  }
  if (diffMs < day) {
    const count = Math.round(diffMs / hour);
    return t("hoursAgo", { count });
  }
  if (diffMs < 2 * day) return t("yesterday");
  if (diffMs < week) {
    const count = Math.round(diffMs / day);
    return t("daysAgo", { count });
  }
  if (diffMs < 4 * week) {
    const count = Math.round(diffMs / week);
    return t("weeksAgo", { count });
  }
  if (diffMs < 12 * month) {
    const count = Math.max(1, Math.round(diffMs / month));
    return t("monthsAgo", { count });
  }
  const count = Math.max(1, Math.round(diffMs / year));
  return t("yearsAgo", { count });
}

export function formatDashboardGreetingLocalized(
  displayName: string,
  t: TimeTranslator,
  date = new Date()
): string {
  const hour = date.getHours();
  const greeting =
    hour < 12 ? t("morning") : hour < 17 ? t("afternoon") : t("evening");
  const name = displayName.trim() || t("fallbackName");
  return `${greeting}, ${name}`;
}
