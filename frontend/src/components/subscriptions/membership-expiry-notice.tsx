"use client";

import { CalendarClock } from "lucide-react";
import Link from "next/link";

import { useSubscriptionAccess } from "@/components/subscriptions/subscription-access-context";
import { ROUTES } from "@/constants/routes";

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

/** Renewal / trial reminder shown in the dashboard shell. */
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

  if (access.isTrial || access.accessSource === "trial") {
    return (
      <div
        role="status"
        className="mb-5 flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-pretty text-emerald-950 sm:mb-6 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-2"
      >
        <CalendarClock
          className="h-4 w-4 shrink-0 text-emerald-700"
          aria-hidden
        />
        <p className="flex-1">
          Your free trial ends {remaining}
          {endsOn ? ` (${formatDate(endsOn)})` : ""}. After that, continue with
          annual membership to stay on the network.
        </p>
        <Link
          href={ROUTES.onboardingMembership}
          className="shrink-0 font-medium text-emerald-900 underline-offset-2 hover:underline"
        >
          View membership
        </Link>
      </div>
    );
  }

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
