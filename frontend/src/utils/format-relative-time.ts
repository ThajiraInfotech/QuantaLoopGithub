export function formatMediumDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Date + time for admin audit / legal proof fields. */
export function formatMediumDateTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function formatShortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Math.max(0, Date.now() - then);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "just now";
  if (diffMs < hour)
    return `${Math.round(diffMs / minute)} min${diffMs < 2 * minute ? "" : "s"} ago`;
  if (diffMs < day)
    return `${Math.round(diffMs / hour)} hr${diffMs < 2 * hour ? "" : "s"} ago`;
  if (diffMs < 14 * day)
    return `${Math.round(diffMs / day)} day${diffMs < 2 * day ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Relative phrasing for tables — never falls back to an absolute date. */
export function formatRelativeWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";

  const diffMs = Math.max(0, Date.now() - then);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (diffMs < minute) return "just now";
  if (diffMs < hour) {
    const mins = Math.round(diffMs / minute);
    return `${mins} min${mins === 1 ? "" : "s"} ago`;
  }
  if (diffMs < day) {
    const hrs = Math.round(diffMs / hour);
    return `${hrs} hr${hrs === 1 ? "" : "s"} ago`;
  }
  if (diffMs < 2 * day) return "yesterday";
  if (diffMs < week) {
    const days = Math.round(diffMs / day);
    return `${days} day${days === 1 ? "" : "s"} ago`;
  }
  if (diffMs < 4 * week) {
    const weeks = Math.round(diffMs / week);
    return `${weeks} week${weeks === 1 ? "" : "s"} ago`;
  }
  if (diffMs < 12 * month) {
    const months = Math.max(1, Math.round(diffMs / month));
    return `${months} month${months === 1 ? "" : "s"} ago`;
  }
  const years = Math.max(1, Math.round(diffMs / year));
  return `${years} year${years === 1 ? "" : "s"} ago`;
}
