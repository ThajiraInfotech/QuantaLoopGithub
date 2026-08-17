"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";

import { ROUTES } from "@/constants/routes";
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
      className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
    >
      <CalendarClock className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
      <p className="flex-1">
        Your annual membership ends {remaining}
        {endsOn ? ` (${formatDate(endsOn)})` : ""}. Renew to keep your network
        access without a break.
      </p>
      <Link
        href={ROUTES.access}
        className="rounded-md bg-amber-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-amber-950"
      >
        Renew membership
      </Link>
    </div>
  );
}
