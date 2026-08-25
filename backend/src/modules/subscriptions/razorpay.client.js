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
        const message =
          remoteDescription === "Authentication failed"
            ? "Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (same test/live pair)."
            : remoteDescription;
        throw new AppError(
          message,
          response.status >= 500 ? 502 : 400,
          "RAZORPAY_API_ERROR",
          { remoteStatus: response.status, remoteDescription }
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

  return {
    createOrder: (body) => request("POST", "/orders", body),
    fetchOrder: (id) => request("GET", `/orders/${encodeURIComponent(id)}`),
    createSubscription: (body) => request("POST", "/subscriptions", body),
    fetchSubscription: (id) =>
      request("GET", `/subscriptions/${encodeURIComponent(id)}`),
    fetchPayment: (id) => request("GET", `/payments/${encodeURIComponent(id)}`),
    cancelSubscription: (id, cancelAtCycleEnd) =>
      request("POST", `/subscriptions/${encodeURIComponent(id)}/cancel`, {
        cancel_at_cycle_end: Boolean(cancelAtCycleEnd),
      }),
    resolvePlanId: async () => null,
    listPlans: async () => [],
    createPlan: async () => {
      throw new AppError(
        "Razorpay subscription plans are not used",
        400,
        "ORDERS_ONLY"
      );
    },
  };
}

module.exports = { createRazorpayClient };
