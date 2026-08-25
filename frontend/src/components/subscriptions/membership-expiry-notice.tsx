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

/** Renewal reminder shown once the paid year is close to running out. */
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

  return (
    <div
      role="status"
      className="mb-5 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-pretty text-amber-950 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2"
    >
      <CalendarClock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <p className="flex-1">
        Your annual membership ends {remaining}
        {endsOn ? ` (${formatDate(endsOn)})` : ""}. When it ends, you will pay
        again to stay on the network.
      </p>
    </div>
  );
}
