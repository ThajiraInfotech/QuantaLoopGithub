const { AppError } = require("../../utils/AppError");

const BASE_URL = "https://api.razorpay.com/v1";

function createRazorpayClient({ keyId, keySecret, timeoutMs = 10000, fetchImpl = global.fetch }) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required");
  }

  async function request(method, path, body) {
    if (!keyId || !keySecret) {
      throw new AppError(
        "Razorpay is not configured",
        503,
        "PAYMENTS_NOT_CONFIGURED"
      );
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(`${BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const remoteDescription =
          data?.error?.description || data?.error?.reason || "Razorpay request failed";
        throw new AppError(
          remoteDescription,
          response.status >= 500 ? 502 : 400,
          "RAZORPAY_API_ERROR",
          { remoteStatus: response.status }
        );
      }
      return data;
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error.name === "AbortError") {
        throw new AppError("Razorpay request timed out", 504, "RAZORPAY_TIMEOUT");
      }
      throw new AppError("Razorpay is unavailable", 502, "RAZORPAY_UNAVAILABLE");
    } finally {
      clearTimeout(timeout);
    }
  }

  async function listPlans() {
    const result = await request("GET", "/plans?count=100");
    return Array.isArray(result?.items) ? result.items : [];
  }

  async function createPlan(catalogPlan) {
    return request("POST", "/plans", {
      period: catalogPlan.period || catalogPlan.interval,
      interval: catalogPlan.intervalCount,
      item: {
        name: catalogPlan.name,
        amount: catalogPlan.amountMinor,
        currency: catalogPlan.currency,
        description: catalogPlan.description,
      },
      notes: { catalog_plan_id: catalogPlan.id, product: "quanta_loop" },
    });
  }

  async function resolvePlanId(catalogPlan, pinnedPlanId) {
    if (pinnedPlanId) return pinnedPlanId;
    const plans = await listPlans();
    const existing = plans.find(
      (plan) =>
        plan?.notes?.catalog_plan_id === catalogPlan.id &&
        plan?.item?.amount === catalogPlan.amountMinor &&
        plan?.item?.currency === catalogPlan.currency
    );
    const plan = existing || (await createPlan(catalogPlan));
    if (!plan?.id) {
      throw new AppError(
        "Unable to create Razorpay plan",
        502,
        "PAYMENT_PROVIDER_ERROR"
      );
    }
    return plan.id;
  }

  return {
    createSubscription: (body) => request("POST", "/subscriptions", body),
    fetchSubscription: (id) =>
      request("GET", `/subscriptions/${encodeURIComponent(id)}`),
    fetchPayment: (id) => request("GET", `/payments/${encodeURIComponent(id)}`),
    cancelSubscription: (id, cancelAtCycleEnd) =>
      request("POST", `/subscriptions/${encodeURIComponent(id)}/cancel`, {
        cancel_at_cycle_end: Boolean(cancelAtCycleEnd),
      }),
    resolvePlanId,
  };
}

module.exports = { createRazorpayClient };
