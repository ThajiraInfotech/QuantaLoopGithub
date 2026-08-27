"use client";

import { CalendarClock } from "lucide-react";

import { useSubscriptionAccess } from "@/components/subscriptions/subscription-access-context";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

/**
 * Compact access end-date line on the dashboard.
 * Always shown while entitled; slightly stronger near expiry.
 */
export function MembershipExpiryNotice() {
  const access = useSubscriptionAccess();
  if (!access?.entitled) return null;

  const endsOn = access.expiresAt ?? access.currentEndAt;
  if (!endsOn) return null;

  const isTrial = access.isTrial || access.accessSource === "trial";
  const urgent = access.expiringSoon === true;
  const days = access.daysRemaining;
  const remaining =
    days === null
      ? null
      : days <= 0
        ? "today"
        : days === 1
          ? "in 1 day"
          : `in ${days} days`;

  return (
    <div
      role="status"
      className={
        urgent
          ? isTrial
            ? "mb-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 sm:mb-4"
            : "mb-3 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 sm:mb-4"
          : "mb-3 flex items-center gap-2 text-xs text-zinc-500 sm:mb-4"
      }
    >
      <CalendarClock
        className={
          urgent
            ? isTrial
              ? "h-3.5 w-3.5 shrink-0 text-emerald-700"
              : "h-3.5 w-3.5 shrink-0 text-amber-700"
            : "h-3.5 w-3.5 shrink-0 text-zinc-400"
        }
        aria-hidden
      />
      <p className="min-w-0 leading-snug text-pretty">
        {isTrial ? "Free trial ends" : "Membership ends"}{" "}
        {formatDate(endsOn)}
        {urgent && remaining ? ` · ${remaining}` : ""}
      </p>
    </div>
  );
}
