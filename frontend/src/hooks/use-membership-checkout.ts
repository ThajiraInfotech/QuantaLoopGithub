"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  cancelSubscription,
  createSubscriptionCheckout,
  getCurrentSubscription,
  getSubscriptionAccessState,
  getSubscriptionPlans,
  verifySubscription,
} from "@/services/subscriptions/subscription.service";
import { useAuthStore } from "@/store/auth-store";
import type {
  CurrentSubscription,
  SubscriptionAccessState,
  SubscriptionPlan,
} from "@/types/subscription";

const RAZORPAY_SCRIPT_URL = "https://checkout.razorpay.com/v1/checkout.js";
const RAZORPAY_SCRIPT_ID = "razorpay-checkout-js";
// Razorpay activates the subscription moments after the first charge, so the
// success handler waits it out instead of handing back an unpaid-looking state.
const ACCESS_RECHECK_DELAYS_MS = [0, 750, 1_250, 2_000, 3_000, 4_000, 5_000];
const ANNUAL_INTERVALS = new Set(["year", "yearly", "annual", "annually"]);
const ANNUAL_PLAN_CODE = "annual_access";
const TERMINAL_STATUSES = new Set(["cancelled", "completed", "expired"]);
const CANCELLABLE_STATUSES = new Set([
  "active",
  "authenticated",
  "pending",
  "paused",
  "halted",
]);

type RazorpaySuccess = {
  razorpay_payment_id: string;
  razorpay_subscription_id: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: { description?: string };
};

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill: { name?: string; email?: string };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: RazorpaySuccess) => void | Promise<void>;
  modal: { ondismiss: () => void };
};

type RazorpayInstance = {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (response: RazorpayFailure) => void
  ) => void;
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpay(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Checkout is only available in a browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      RAZORPAY_SCRIPT_ID
    ) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    script.addEventListener(
      "load",
      () => {
        if (window.Razorpay) {
          resolve();
        } else {
          reject(new Error("Razorpay checkout did not initialize"));
        }
      },
      { once: true }
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Unable to load secure checkout")),
      { once: true }
    );

    if (!existing) {
      script.id = RAZORPAY_SCRIPT_ID;
      script.src = RAZORPAY_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    razorpayScriptPromise = null;
    document.getElementById(RAZORPAY_SCRIPT_ID)?.remove();
    throw error;
  });

  return razorpayScriptPromise;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong";
}

function isAnnualPlan(plan: SubscriptionPlan): boolean {
  if (plan.code === ANNUAL_PLAN_CODE) return true;
  return (
    plan.intervalCount === 1 &&
    ANNUAL_INTERVALS.has(plan.interval.trim().toLowerCase())
  );
}

async function waitForEntitlement(): Promise<SubscriptionAccessState> {
  let latest: SubscriptionAccessState | null = null;
  let lastError: unknown;

  for (const delayMs of ACCESS_RECHECK_DELAYS_MS) {
    if (delayMs) {
      await new Promise((resolve) => window.setTimeout(resolve, delayMs));
    }
    try {
      latest = await getSubscriptionAccessState();
      if (latest.entitled) return latest;
    } catch (error) {
      lastError = error;
    }
  }

  if (latest) return latest;
  throw lastError ?? new Error("Unable to confirm membership access");
}

export type MembershipCheckoutBusy = "pay" | "recheck" | "cancel";

export type MembershipCheckout = {
  /** True until the plan and any existing subscription have been read. */
  loading: boolean;
  error: string | null;
  plan: SubscriptionPlan | null;
  subscription: CurrentSubscription | null;
  busy: MembershipCheckoutBusy | null;
  /** Payment went through but Razorpay has not confirmed activation yet. */
  awaitingActivation: boolean;
  /** A membership was held before and needs paying again. */
  isRenewal: boolean;
  canCancelRenewal: boolean;
  pay: () => Promise<void>;
  recheck: () => Promise<void>;
  cancelRenewal: () => Promise<void>;
  reload: () => Promise<void>;
};

type UseMembershipCheckoutOptions = {
  /** Called once the server confirms the membership is active. */
  onEntitled?: (access: SubscriptionAccessState) => void | Promise<void>;
  /** Skipped for roles that never pay, such as admins. */
  enabled?: boolean;
};

/**
 * Owns the Razorpay subscription checkout: plan lookup, hosted checkout,
 * server-side verification, and the wait for confirmed entitlement. Screens
 * only decide how to present it.
 */
export function useMembershipCheckout({
  onEntitled,
  enabled = true,
}: UseMembershipCheckoutOptions = {}): MembershipCheckout {
  const user = useAuthStore((state) => state.user);
  const [plan, setPlan] = useState<SubscriptionPlan | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<CurrentSubscription | null>(
    null
  );
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<MembershipCheckoutBusy | null>(null);
  const [awaitingActivation, setAwaitingActivation] = useState(false);
  const busyRef = useRef<MembershipCheckoutBusy | null>(null);
  const loadStarted = useRef(false);

  const claim = (next: MembershipCheckoutBusy): boolean => {
    if (busyRef.current) return false;
    busyRef.current = next;
    setBusy(next);
    return true;
  };

  const release = () => {
    busyRef.current = null;
    setBusy(null);
  };

  const reload = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const [catalog, current] = await Promise.all([
        getSubscriptionPlans(),
        getCurrentSubscription(),
      ]);
      setPublicKey(catalog.publicKey);
      setPlan(catalog.plans.find(isAnnualPlan) ?? catalog.plans[0] ?? null);
      setSubscription(current);
    } catch (loadError) {
      setError(errorMessage(loadError));
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || loadStarted.current) return;
    loadStarted.current = true;
    void reload();
  }, [enabled, reload]);

  const settle = useCallback(
    async (access: SubscriptionAccessState) => {
      if (!access.entitled) {
        setAwaitingActivation(true);
        return;
      }
      setAwaitingActivation(false);
      const current = await getCurrentSubscription().catch(() => null);
      if (current) setSubscription(current);
      await onEntitled?.(access);
    },
    [onEntitled]
  );

  const pay = useCallback(async () => {
    if (!plan || !publicKey || !claim("pay")) return;
    setError(null);
    try {
      await loadRazorpay();
      const { subscriptionId } = await createSubscriptionCheckout(plan.code);
      if (!window.Razorpay) {
        throw new Error("Secure checkout is unavailable");
      }

      const checkout = new window.Razorpay({
        key: publicKey,
        subscription_id: subscriptionId,
        name: "Quanta Loop",
        description: `${plan.name} membership`,
        prefill: { name: user?.name, email: user?.email },
        notes: {
          plan_code: plan.code,
          user_id: user?.id ?? "",
          company_name: user?.companyName ?? "",
        },
        theme: { color: "#33B573" },
        handler: async (response) => {
          try {
            await verifySubscription({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            });
            await settle(await waitForEntitlement());
          } catch (verifyError) {
            setAwaitingActivation(true);
            setError(errorMessage(verifyError));
          } finally {
            release();
          }
        },
        modal: { ondismiss: release },
      });

      checkout.on("payment.failed", (response) => {
        setError(
          response.error?.description ?? "Payment failed. Please try again."
        );
        release();
      });
      checkout.open();
    } catch (checkoutError) {
      setError(errorMessage(checkoutError));
      release();
    }
  }, [plan, publicKey, settle, user]);

  const recheck = useCallback(async () => {
    if (!claim("recheck")) return;
    setError(null);
    try {
      await settle(await waitForEntitlement());
    } catch (accessError) {
      setError(errorMessage(accessError));
    } finally {
      release();
    }
  }, [settle]);

  const cancelRenewal = useCallback(async () => {
    if (!claim("cancel")) return;
    setError(null);
    try {
      const updated = await cancelSubscription(true);
      setSubscription(updated ?? (await getCurrentSubscription()));
    } catch (cancelError) {
      setError(errorMessage(cancelError));
    } finally {
      release();
    }
  }, []);

  const status = subscription?.status.toLowerCase();

  return {
    loading,
    error,
    plan,
    subscription,
    busy,
    awaitingActivation,
    isRenewal: Boolean(status && TERMINAL_STATUSES.has(status)),
    canCancelRenewal: Boolean(
      status && CANCELLABLE_STATUSES.has(status) && !subscription?.cancelAtCycleEnd
    ),
    pay,
    recheck,
    cancelRenewal,
    reload,
  };
}
