"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useMembershipCheckout } from "@/hooks/use-membership-checkout";

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "active":
    case "authenticated":
      return "success" as const;
    case "pending":
    case "created":
    case "paused":
      return "warning" as const;
    case "cancelled":
    case "expired":
    case "halted":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function formatStatus(status: string): string {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Membership management for members who already have access. */
export function SubscriptionCheckout() {
  const checkout = useMembershipCheckout();
  const { plan, subscription } = checkout;
  const activeUntil =
    subscription?.currentPeriodEnd &&
    new Date(subscription.currentPeriodEnd) > new Date()
      ? subscription.currentPeriodEnd
      : null;
  const price = plan ? `₹${plan.amountInr.toLocaleString("en-IN")}` : null;

  if (checkout.loading) {
    return (
      <Card aria-busy="true" className="border-zinc-200/80 bg-white">
        <CardContent className="space-y-3 py-6">
          <div className="h-5 w-40 animate-pulse rounded bg-zinc-100" />
          <div className="h-10 animate-pulse rounded bg-zinc-100" />
        </CardContent>
      </Card>
    );
  }

  if (checkout.error && !plan) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="space-y-3 py-6">
          <p role="alert" className="text-sm text-red-800">
            {checkout.error}
          </p>
          <Button variant="outline" size="sm" onClick={() => void checkout.reload()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-zinc-200/80 bg-white">
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base">Network subscription</CardTitle>
            <CardDescription>
              Manage your annual Quanta Loop network access.
            </CardDescription>
          </div>
          {subscription ? (
            <Badge variant={statusVariant(subscription.status)}>
              {formatStatus(subscription.status)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {activeUntil ? (
          <>
            <p className="text-sm text-zinc-700">
              {subscription?.planName || plan?.name || "Annual membership"} ·
              Access runs through {formatDate(activeUntil)}
            </p>
            {subscription?.cancelAtCycleEnd ? (
              <p className="text-sm text-amber-700">
                Renewal is cancelled. Access remains available until{" "}
                {formatDate(activeUntil)}.
              </p>
            ) : null}
            {checkout.canCancelRenewal ? (
              <Button
                variant="outline"
                size="sm"
                disabled={checkout.busy !== null}
                onClick={() => void checkout.cancelRenewal()}
              >
                {checkout.busy === "cancel" ? "Scheduling…" : "Cancel renewal"}
              </Button>
            ) : null}
          </>
        ) : (
          <>
            {price ? (
              <p className="text-sm text-zinc-700">
                {price} for one full year of network access.
              </p>
            ) : null}
            <Button
              disabled={!plan || checkout.busy !== null || checkout.awaitingActivation}
              aria-busy={checkout.busy === "pay"}
              onClick={() => void checkout.pay()}
            >
              {checkout.busy === "pay"
                ? "Opening secure checkout…"
                : subscription
                  ? "Renew membership"
                  : "Activate membership"}
            </Button>
            {checkout.awaitingActivation ? (
              <div className="space-y-2">
                <p role="alert" aria-live="polite" className="text-sm text-amber-800">
                  Payment received. Membership activation is still processing.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={checkout.busy !== null}
                  onClick={() => void checkout.recheck()}
                >
                  {checkout.busy === "recheck"
                    ? "Rechecking…"
                    : "Recheck payment status"}
                </Button>
              </div>
            ) : null}
            <p className="text-xs text-zinc-500">
              Payment details are collected securely by Razorpay. Quanta Loop
              never receives your card or banking credentials.
            </p>
          </>
        )}

        {checkout.error && !checkout.awaitingActivation ? (
          <p role="alert" aria-live="polite" className="text-sm text-red-700">
            {checkout.error}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
