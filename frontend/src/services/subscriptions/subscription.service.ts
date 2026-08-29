import { getAxiosErrorMessage, isApiError } from "@/lib/api-result";
import type {
  CheckoutSession,
  CurrentSubscription,
  SubscriptionAccessState,
  SubscriptionCatalog,
  SubscriptionPlan,
  VerifySubscriptionInput,
} from "@/types/subscription";

import { apiClient } from "../api/client";

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return typeof value === "object" && value !== null
    ? (value as UnknownRecord)
    : null;
}

function unwrapResponse(value: unknown): unknown {
  if (isApiError(value)) {
    throw new Error(value.error.message);
  }

  const record = asRecord(value);
  if (!record) return value;

  if ("data" in record) return record.data;
  if ("payload" in record) return record.payload;
  return value;
}

function firstString(
  record: UnknownRecord,
  ...keys: string[]
): string | undefined {
  for (const key of keys) {
    if (typeof record[key] === "string" && record[key]) {
      return record[key] as string;
    }
  }
}

function firstNumber(
  record: UnknownRecord,
  ...keys: string[]
): number | undefined {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
}

function normalizePlan(value: unknown): SubscriptionPlan | null {
  const plan = asRecord(value);
  if (!plan) return null;

  const code = firstString(plan, "code", "planCode", "plan_code", "id");
  const name = firstString(plan, "name", "title") ?? "Annual membership";
  const currency =
    (firstString(plan, "currency") ?? "INR").toUpperCase();
  const amount =
    firstNumber(plan, "amount", "amountMajor", "amount_major") ??
    ((firstNumber(
      plan,
      "amountMinor",
      "amount_minor",
      "amountPaise",
      "amount_paise"
    ) ?? 0) / 100);
  const amountInr =
    firstNumber(
      plan,
      "amountInr",
      "amount_inr",
      "annualInr",
      "priceInr"
    ) ?? (currency === "INR" ? amount : 6999);

  if (!code) return null;

  return {
    code,
    name,
    description: firstString(plan, "description", "highlight"),
    amount,
    currency,
    amountInr,
    interval:
      firstString(plan, "interval", "billingInterval", "billing_interval") ??
      "year",
    intervalCount:
      firstNumber(
        plan,
        "intervalCount",
        "interval_count",
        "billingIntervalCount"
      ) ?? 1,
  };
}

function normalizeSubscription(value: unknown): CurrentSubscription | null {
  if (value === null || value === undefined) return null;
  const payload = asRecord(value);
  if (!payload) return null;

  const nested =
    asRecord(payload.subscription) ??
    asRecord(payload.currentSubscription) ??
    payload;
  const id = firstString(
    nested,
    "id",
    "subscriptionId",
    "subscription_id",
    "razorpaySubscriptionId",
    "razorpay_subscription_id"
  );
  const status = firstString(nested, "status");

  if (!id || !status) return null;

  return {
    id,
    planCode:
      firstString(nested, "planCode", "plan_code", "planId", "plan") ?? "",
    planName: firstString(nested, "planName", "plan_name"),
    status,
    currentPeriodEnd: firstString(
      nested,
      "currentPeriodEnd",
      "current_period_end",
      "currentEndAt",
      "currentCycleEnd",
      "endsAt"
    ),
    cancelAtCycleEnd:
      nested.cancelAtCycleEnd === true ||
      nested.cancel_at_cycle_end === true ||
      nested.cancelAtPeriodEnd === true ||
      nested.cancelScheduled === true,
    razorpaySubscriptionId: firstString(
      nested,
      "razorpaySubscriptionId",
      "razorpay_subscription_id",
      "subscriptionId",
      "subscription_id"
    ),
  };
}

async function request<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new Error(getAxiosErrorMessage(error));
  }
}

export async function getSubscriptionPlans(): Promise<SubscriptionCatalog> {
  return request(async () => {
    const { data } = await apiClient.get<unknown>("/subscriptions/plans");
    const unwrapped = unwrapResponse(data);
    const payload = asRecord(unwrapped);
    if (!payload) throw new Error("Unexpected subscription plans response");

    const catalog = asRecord(payload.catalog);
    const planValues =
      (Array.isArray(payload.plans) && payload.plans) ||
      (Array.isArray(payload.catalog) && payload.catalog) ||
      (Array.isArray(catalog?.plans) && catalog.plans) ||
      (Array.isArray(payload.items) && payload.items) ||
      [];
    const publicKey =
      firstString(
        payload,
        "publicKey",
        "public_key",
        "keyId",
        "key_id",
        "razorpayKeyId",
        "razorpay_key_id",
        "key"
      ) ??
      (catalog
        ? firstString(
            catalog,
            "publicKey",
            "public_key",
            "keyId",
            "key_id",
            "razorpayKeyId",
            "razorpay_key_id",
            "key"
          )
        : undefined);
    const plans = planValues
      .map(normalizePlan)
      .filter((plan): plan is SubscriptionPlan => plan !== null);

    if (!publicKey || plans.length === 0) {
      throw new Error("Subscription checkout is not configured");
    }

    return { publicKey, plans };
  });
}

export async function getCurrentSubscription(): Promise<CurrentSubscription | null> {
  return request(async () => {
    const { data } = await apiClient.get<unknown>("/subscriptions/me");
    return normalizeSubscription(unwrapResponse(data));
  });
}

function normalizeAccessState(value: unknown): SubscriptionAccessState | null {
  const payload = asRecord(value);
  if (!payload || typeof payload.entitled !== "boolean") return null;

  return {
    entitled: payload.entitled,
    status: firstString(payload, "status"),
    reason: firstString(payload, "reason"),
    expiresAt: firstString(payload, "expiresAt", "expires_at"),
    currentEndAt: firstString(
      payload,
      "currentEndAt",
      "current_end_at",
      "currentPeriodEnd"
    ),
    daysRemaining:
      firstNumber(payload, "daysRemaining", "days_remaining") ?? null,
    expiringSoon: payload.expiringSoon === true,
    accessSource: firstString(payload, "accessSource", "access_source"),
    isTrial: payload.isTrial === true,
    subscription: normalizeSubscription(payload.subscription),
  };
}

export async function getSubscriptionAccessState(): Promise<SubscriptionAccessState> {
  return request(async () => {
    const { data } = await apiClient.get<unknown>("/subscriptions/access-state");
    const access = normalizeAccessState(unwrapResponse(data));
    if (!access) {
      throw new Error("Unexpected subscription access response");
    }
    return access;
  });
}

export async function createSubscriptionCheckout(
  planCode: string
): Promise<CheckoutSession> {
  return request(async () => {
    const { data } = await apiClient.post<unknown>("/subscriptions/checkout", {
      planCode,
    });
    const payload = asRecord(unwrapResponse(data));
    const nested = payload
      ? asRecord(payload.checkout) ?? asRecord(payload.subscription) ?? payload
      : null;
    const orderId = nested
      ? firstString(
          nested,
          "orderId",
          "order_id",
          "razorpayOrderId",
          "razorpay_order_id"
        )
      : undefined;
    const amount =
      nested &&
      firstNumber(nested, "amount", "amountMinor", "amount_paise", "amount_minor");
    const currency = nested
      ? firstString(nested, "currency")?.toUpperCase()
      : undefined;

    if (!orderId) {
      throw new Error("Checkout did not return an order ID");
    }
    if (!amount || amount <= 0) {
      throw new Error("Checkout did not return a valid amount");
    }
    if (!currency) {
      throw new Error("Checkout did not return a currency");
    }
    return { orderId, amount, currency };
  });
}

export async function verifySubscription(
  input: VerifySubscriptionInput
): Promise<SubscriptionAccessState | null> {
  return request(async () => {
    const { data } = await apiClient.post<unknown>(
      "/subscriptions/verify",
      input
    );
    const payload = asRecord(unwrapResponse(data));
    if (!payload) return null;
    return (
      normalizeAccessState(payload.accessState) ??
      normalizeAccessState(payload)
    );
  });
}

export async function cancelSubscription(
  cancelAtCycleEnd = true
): Promise<CurrentSubscription | null> {
  return request(async () => {
    const { data } = await apiClient.post<unknown>("/subscriptions/cancel", {
      cancelAtCycleEnd,
    });
    return normalizeSubscription(unwrapResponse(data));
  });
}
