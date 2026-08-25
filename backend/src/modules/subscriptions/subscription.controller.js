const { AppError } = require("../../utils/AppError");
const { sendSuccess } = require("../../utils/apiResponse");
const { asyncHandler } = require("../../utils/asyncHandler");
const { verifyWebhookSignature } = require("./subscription.service");
const {
  getSubscriptionAccessState,
} = require("./subscription-access.service");
const {
  createCheckoutSchema,
  verifyCheckoutSchema,
  cancelSchema,
  parseOrThrow,
} = require("./subscription.validation");

function validationFailure(result) {
  throw new AppError(
    "Validation failed",
    400,
    "VALIDATION_ERROR",
    result.error.flatten()
  );
}

function createSubscriptionController({ service, catalog, env }) {
  const getConfig = asyncHandler(async (req, res) => {
    const configured = Boolean(
      env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET
    );
    const plans = configured
      ? catalog.listPurchasablePlans().length
        ? catalog.listPurchasablePlans()
        : catalog.listCatalogPlans().map((plan) => ({
            id: plan.id,
            code: plan.code || plan.id,
            name: plan.name,
            description: plan.description,
            amount: plan.amount,
            amountInr: plan.amount,
            currency: plan.currency,
            interval: plan.interval,
            intervalCount: plan.intervalCount,
          }))
      : [];
    sendSuccess(
      res,
      {
        provider: "razorpay",
        configured,
        publicKey: configured ? env.RAZORPAY_KEY_ID : null,
        keyId: configured ? env.RAZORPAY_KEY_ID : null,
        razorpayKeyId: configured ? env.RAZORPAY_KEY_ID : null,
        plans,
      },
      "Subscription configuration retrieved"
    );
  });

  /**
   * Pulls the authoritative Razorpay state for a subscription that is still
   * awaiting activation. Failures are non-fatal: the stored record stays the
   * answer and the caller can poll again.
   */
  async function catchUpWithRazorpay(req) {
    if (req.user.role === "admin") return;
    try {
      await service.reconcilePending(req.user.id);
    } catch {
      /* reads must not fail because Razorpay was unreachable */
    }
  }

  const getCurrent = asyncHandler(async (req, res) => {
    await catchUpWithRazorpay(req);
    const subscription = await service.getCurrent(req.user.id);
    sendSuccess(res, { subscription }, "Subscription retrieved");
  });

  const getAccessState = asyncHandler(async (req, res) => {
    await catchUpWithRazorpay(req);
    const accessState = await getSubscriptionAccessState({
      userId: req.user.id,
      role: req.user.role,
    });
    sendSuccess(res, accessState, "Subscription access state retrieved");
  });

  const createCheckout = asyncHandler(async (req, res) => {
    const headerKey = req.get("Idempotency-Key");
    const result = parseOrThrow(createCheckoutSchema, {
      ...req.body,
      idempotencyKey: headerKey || req.body?.idempotencyKey,
    });
    if (!result.success) validationFailure(result);
    const subscription = await service.createCheckout({
      userId: req.user.id,
      planId: result.data.planId,
      idempotencyKey: result.data.idempotencyKey,
    });
    const plan = catalog.getPlan(result.data.planId);
    sendSuccess(
      res,
      {
        subscription,
        checkout: {
          keyId: env.RAZORPAY_KEY_ID || null,
          orderId: subscription.razorpayOrderId,
          razorpayOrderId: subscription.razorpayOrderId,
          amount: plan.amountMinor,
          currency: plan.currency,
          // Legacy fields kept empty for older clients.
          subscriptionId: subscription.razorpaySubscriptionId,
          razorpaySubscriptionId: subscription.razorpaySubscriptionId,
        },
      },
      "Checkout order created"
    );
  });

  const verifyCheckout = asyncHandler(async (req, res) => {
    const result = parseOrThrow(verifyCheckoutSchema, req.body);
    if (!result.success) validationFailure(result);
    const subscription = await service.verifyAndReconcile({
      userId: req.user.id,
      paymentId: result.data.razorpayPaymentId,
      orderId: result.data.razorpayOrderId,
      subscriptionId: result.data.razorpaySubscriptionId,
      signature: result.data.razorpaySignature,
    });
    const accessState = await getSubscriptionAccessState({
      userId: req.user.id,
      role: req.user.role,
    });
    sendSuccess(res, { subscription, accessState }, "Subscription verified");
  });

  const cancel = asyncHandler(async (req, res) => {
    const result = parseOrThrow(cancelSchema, req.body || {});
    if (!result.success) validationFailure(result);
    const subscription = await service.cancel({
      userId: req.user.id,
      subscriptionId: req.params.subscriptionId,
      cancelAtCycleEnd: result.data.cancelAtCycleEnd,
    });
    sendSuccess(res, { subscription }, "Subscription cancellation requested");
  });

  const webhook = asyncHandler(async (req, res) => {
    const signature = req.get("x-razorpay-signature");
    const eventId = req.get("x-razorpay-event-id");
    if (!env.RAZORPAY_WEBHOOK_SECRET) {
      throw new AppError(
        "Razorpay webhook is not configured",
        503,
        "PAYMENTS_NOT_CONFIGURED"
      );
    }
    if (!Buffer.isBuffer(req.body)) {
      throw new AppError("Raw webhook body required", 400, "INVALID_WEBHOOK_BODY");
    }
    if (
      !signature ||
      !verifyWebhookSignature(env.RAZORPAY_WEBHOOK_SECRET, req.body, signature)
    ) {
      throw new AppError("Invalid webhook signature", 401, "INVALID_SIGNATURE");
    }
    if (!eventId || eventId.length > 200) {
      throw new AppError(
        "Webhook event id is required",
        400,
        "WEBHOOK_EVENT_ID_REQUIRED"
      );
    }
    let body;
    try {
      body = JSON.parse(req.body.toString("utf8"));
    } catch {
      throw new AppError("Invalid webhook JSON", 400, "INVALID_WEBHOOK_BODY");
    }
    const eventType = typeof body.event === "string" ? body.event : "unknown";
    const result = await service.processWebhook({ eventId, eventType, body });
    sendSuccess(res, result, result.duplicate ? "Event already processed" : "Event processed");
  });

  return {
    getConfig,
    getCurrent,
    getAccessState,
    createCheckout,
    verifyCheckout,
    cancel,
    webhook,
  };
}

module.exports = { createSubscriptionController };
