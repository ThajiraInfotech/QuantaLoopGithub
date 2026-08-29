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
const ACCESS_RECHECK_DELAYS_MS = [0, 400, 800, 1_200, 2_000, 3_000, 4_000, 5_000];
const ACTIVATION_POLL_DELAYS_MS = [1_500, 2_000, 3_000, 4_000, 5_000];
const ACTIVATION_POLL_ATTEMPTS = 16;
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
  razorpay_order_id?: string;
  razorpay_subscription_id?: string;
  razorpay_signature: string;
};

type RazorpayFailure = {
  error?: { description?: string };
};

type RazorpayOptions = {
  key: string;
  order_id?: string;
  subscription_id?: string;
  amount?: number;
  currency?: string;
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
  /**
   * Optional gate before Razorpay opens (e.g. save billing profile).
   * Must resolve successfully for checkout to continue.
   */
  beforePay?: () => Promise<void>;
  /**
   * Expected Razorpay currency after billing is saved (INR or USD).
   * Used to refuse opening checkout if the order currency does not match.
   */
  getExpectedCurrency?: () => string;
};

/**
 * Owns the Razorpay subscription checkout: plan lookup, hosted checkout,
 * server-side verification, and the wait for confirmed entitlement. Screens
 * only decide how to present it.
 */
export function useMembershipCheckout({
  onEntitled,
  enabled = true,
  beforePay,
  getExpectedCurrency,
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
  const awaitingRef = useRef(false);

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
        awaitingRef.current = true;
        setAwaitingActivation(true);
        return;
      }
      awaitingRef.current = false;
      setAwaitingActivation(false);
      const current = await getCurrentSubscription().catch(() => null);
      if (current) setSubscription(current);
      await onEntitled?.(access);
    },
    [onEntitled]
  );

  useEffect(() => {
    if (!awaitingActivation) return;
    let cancelled = false;

    void (async () => {
      for (let attempt = 0; attempt < ACTIVATION_POLL_ATTEMPTS; attempt += 1) {
        const delay =
          ACTIVATION_POLL_DELAYS_MS[
            Math.min(attempt, ACTIVATION_POLL_DELAYS_MS.length - 1)
          ];
        await new Promise((resolve) => window.setTimeout(resolve, delay));
        if (cancelled || !awaitingRef.current) return;
        try {
          const access = await getSubscriptionAccessState();
          if (cancelled || !awaitingRef.current) return;
          if (access.entitled) {
            await settle(access);
            return;
          }
        } catch {
          /* keep polling — webhook lag is the usual cause */
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [awaitingActivation, settle]);

  const pay = useCallback(async () => {
    if (!plan || !publicKey || !claim("pay")) return;
    setError(null);
    try {
      if (beforePay) {
        await beforePay();
      }
      await loadRazorpay();
      const session = await createSubscriptionCheckout(plan.code);
      if (!window.Razorpay) {
        throw new Error("Secure checkout is unavailable");
      }

      const orderCurrency = String(session.currency || "").toUpperCase();
      const expectedCurrency = getExpectedCurrency?.()?.trim().toUpperCase();
      if (expectedCurrency && orderCurrency !== expectedCurrency) {
        throw new Error(
          `Checkout currency mismatch (expected ${expectedCurrency}, got ${orderCurrency}). Please refresh and try again.`
        );
      }
      if (!session.amount || session.amount <= 0 || !orderCurrency) {
        throw new Error("Checkout returned an invalid amount or currency");
      }

      const amountLabel =
        orderCurrency === "USD"
          ? `$${(session.amount / 100).toFixed(session.amount % 100 === 0 ? 0 : 2)}`
          : `₹${(session.amount / 100).toLocaleString("en-IN")}`;

      const checkout = new window.Razorpay({
        key: publicKey,
        order_id: session.orderId,
        amount: session.amount,
        currency: orderCurrency,
        name: "Quanta Loop",
        description: `${plan.name} — ${amountLabel}/year`,
        prefill: { name: user?.name, email: user?.email },
        notes: {
          plan_code: plan.code,
          user_id: user?.id ?? "",
          company_name: user?.companyName ?? "",
          checkout_currency: orderCurrency,
        },
        theme: { color: "#33B573" },
        handler: async (response) => {
          awaitingRef.current = true;
          setAwaitingActivation(true);
          setError(null);
          release();
          try {
            const verifiedAccess = await verifySubscription({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId:
                response.razorpay_order_id || session.orderId,
              razorpaySignature: response.razorpay_signature,
            });
            if (verifiedAccess?.entitled) {
              await settle(verifiedAccess);
              return;
            }
            await settle(await waitForEntitlement());
          } catch (verifyError) {
            setError(errorMessage(verifyError));
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
  }, [beforePay, getExpectedCurrency, plan, publicKey, settle, user]);

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
