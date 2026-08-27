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

/** Compact renewal / trial reminder in the dashboard shell. */
export function MembershipExpiryNotice() {
  const access = useSubscriptionAccess();
  if (!access?.expiringSoon) return null;

  const days = access.daysRemaining;
  const endsOn = access.expiresAt ?? access.currentEndAt;
  const remaining =
    days === null
      ? "soon"
      : days <= 0
        ? "today"
        : days === 1
          ? "in 1 day"
          : `in ${days} days`;

  const isTrial = access.isTrial || access.accessSource === "trial";

  return (
    <div
      role="status"
      className={
        isTrial
          ? "mb-3 flex items-center gap-2 rounded-lg border border-emerald-200/80 bg-emerald-50/80 px-3 py-2 text-xs text-emerald-900 sm:mb-4"
          : "mb-3 flex items-center gap-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-950 sm:mb-4"
      }
    >
      <CalendarClock
        className={
          isTrial
            ? "h-3.5 w-3.5 shrink-0 text-emerald-700"
            : "h-3.5 w-3.5 shrink-0 text-amber-700"
        }
        aria-hidden
      />
      <p className="min-w-0 leading-snug text-pretty">
        {isTrial ? (
          <>
            Free trial ends {remaining}
            {endsOn ? ` (${formatDate(endsOn)})` : ""}.
          </>
        ) : (
          <>
            Membership ends {remaining}
            {endsOn ? ` (${formatDate(endsOn)})` : ""}.
          </>
        )}
      </p>
    </div>
  );
}
