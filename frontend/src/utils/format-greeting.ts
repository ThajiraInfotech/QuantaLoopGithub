export function getTimeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** @deprecated Use useDashboardGreeting from @/hooks/use-localized-time in client components */
export function formatDashboardGreeting(displayName: string, date = new Date()): string {
  const name = displayName.trim() || "there";
  return `${getTimeOfDayGreeting(date)}, ${name} `;
}
