const crypto = require("crypto");

const { AppError } = require("../../utils/AppError");
const {
  Subscription,
  toPublicSubscription,
} = require("./subscription.model");
const { WebhookEvent } = require("./webhook-event.model");

const EVENT_STATUS_MAP = Object.freeze({
  "subscription.authenticated": "authenticated",
  "subscription.activated": "active",
  "subscription.charged": null,
  "subscription.pending": "pending",
  "subscription.halted": "halted",
  "subscription.paused": "paused",
  "subscription.resumed": "active",
  "subscription.cancelled": "cancelled",
  "subscription.completed": "completed",
  "subscription.expired": "expired",
  "subscription.updated": null,
});

const OPEN_STATUSES = [
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "paused",
];
const CONFIRMED_PAYMENT_STATUSES = new Set(["authorized", "captured"]);
const TERMINAL_STATUSES = new Set(["cancelled", "completed", "expired"]);
// Razorpay activates a subscription moments after the first charge. Webhooks
// deliver that transition in production, but reads must be able to catch up on
// their own so a paid member is never stranded when delivery lags or is blocked.
const AWAITING_ACTIVATION_STATUSES = new Set([
  "created",
  "authenticated",
  "pending",
]);
const RECONCILE_MIN_INTERVAL_MS = 1_500;
const PAID_STATUSES = new Set(["active", "completed"]);

function addInterval(date, interval, intervalCount) {
  const end = new Date(date);
  const step = Math.max(1, Number(intervalCount) || 1);
  switch (String(interval || "yearly").toLowerCase()) {
    case "daily":
      end.setDate(end.getDate() + step);
      break;
    case "weekly":
      end.setDate(end.getDate() + 7 * step);
      break;
    case "monthly":
      end.setMonth(end.getMonth() + step);
      break;
    default:
      end.setFullYear(end.getFullYear() + step);
  }
  return end;
}

function secureCompareHex(expectedHex, receivedHex) {
  if (
    typeof expectedHex !== "string" ||
    typeof receivedHex !== "string" ||
    !/^[a-f0-9]+$/i.test(receivedHex)
  ) {
    return false;
  }
  const expected = Buffer.from(expectedHex, "hex");
  const received = Buffer.from(receivedHex, "hex");
  return expected.length === received.length && crypto.timingSafeEqual(expected, received);
}

function calculateCheckoutSignature(secret, paymentId, subscriptionId) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${paymentId}|${subscriptionId}`, "utf8")
    .digest("hex");
}

function verifyCheckoutSignature(secret, paymentId, subscriptionId, signature) {
  return secureCompareHex(
    calculateCheckoutSignature(secret, paymentId, subscriptionId),
    signature
  );
}

/** Razorpay Orders checkout signature: order_id|payment_id */
function calculateOrderCheckoutSignature(secret, orderId, paymentId) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`, "utf8")
    .digest("hex");
}

function verifyOrderCheckoutSignature(secret, orderId, paymentId, signature) {
  return secureCompareHex(
    calculateOrderCheckoutSignature(secret, orderId, paymentId),
    signature
  );
}

function calculateWebhookSignature(secret, rawBody) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

function verifyWebhookSignature(secret, rawBody, signature) {
  return secureCompareHex(calculateWebhookSignature(secret, rawBody), signature);
}

function mapEventToStatus(eventType) {
  return EVENT_STATUS_MAP[eventType] || null;
}

function isFullyRefundedPayment(payment) {
  if (!payment) return false;
  return payment.status === "refunded" || payment.refund_status === "full";
}

function paymentUnlocksMembership(payment, plan) {
  if (!payment || !plan) return false;
  if (payment.status !== "captured") return false;
  if (isFullyRefundedPayment(payment)) return false;
  if (Number(payment.amount) !== Number(plan.amountMinor)) return false;
  const paymentCurrency = String(payment.currency || "").toUpperCase();
  const planCurrency = String(plan.currency || "").toUpperCase();
  return paymentCurrency === planCurrency;
}

function keepPaidStatus(localStatus, remoteStatus) {
  if (
    PAID_STATUSES.has(localStatus) &&
    remoteStatus &&
    AWAITING_ACTIVATION_STATUSES.has(remoteStatus)
  ) {
    return localStatus;
  }
  return remoteStatus || localStatus;
}

function unixDate(value) {
  return Number.isFinite(value) && value > 0 ? new Date(value * 1000) : null;
}

function remoteFields(entity, eventId) {
  return {
    status: entity.status,
    shortUrl: entity.short_url || null,
    currentStartAt: unixDate(entity.current_start),
    currentEndAt: unixDate(entity.current_end),
    chargeAt: unixDate(entity.charge_at),
    endedAt: unixDate(entity.ended_at),
    cancelledAt: unixDate(entity.cancelled_at),
    cancelAtCycleEnd: Boolean(entity.cancel_at_cycle_end),
    remoteCreatedAt: unixDate(entity.created_at),
    lastWebhookEventId: eventId || null,
    lastReconciledAt: new Date(),
  };
}

function assignRemoteFields(local, remote, eventId) {
  const next = remoteFields(remote, eventId);
  next.status = keepPaidStatus(local.status, next.status);
  if (local.currentEndAt && !next.currentEndAt) {
    next.currentEndAt = local.currentEndAt;
  }
  if (local.currentStartAt && !next.currentStartAt) {
    next.currentStartAt = local.currentStartAt;
  }
  Object.assign(local, next);
}

function relevantPayload(eventType, body) {
  const subscription = body?.payload?.subscription?.entity;
  const payment = body?.payload?.payment?.entity;
  return {
    event: eventType,
    subscription: subscription
      ? {
          id: subscription.id,
          planId: subscription.plan_id,
          status: subscription.status,
          currentStart: subscription.current_start,
          currentEnd: subscription.current_end,
          chargeAt: subscription.charge_at,
          endedAt: subscription.ended_at,
          cancelledAt: subscription.cancelled_at,
          cancelAtCycleEnd: subscription.cancel_at_cycle_end,
          notes: {
            userId: subscription.notes?.user_id,
            localSubscriptionId: subscription.notes?.local_subscription_id,
            catalogPlanId: subscription.notes?.catalog_plan_id,
          },
        }
      : null,
    payment: payment
      ? {
          id: payment.id,
          subscriptionId: payment.subscription_id,
          status: payment.status,
          amount: payment.amount,
          currency: payment.currency,
          errorCode: payment.error_code,
          errorDescription: payment.error_description,
          errorSource: payment.error_source,
          errorStep: payment.error_step,
          errorReason: payment.error_reason,
          createdAt: payment.created_at,
        }
      : null,
  };
}

function assertRemoteOwnership(local, remote, userId) {
  const remoteUserId = String(remote.notes?.user_id || "");
  const remoteLocalId = String(remote.notes?.local_subscription_id || "");
  if (
    remote.id !== local.razorpaySubscriptionId ||
    remote.plan_id !== local.razorpayPlanId ||
    remoteUserId !== String(userId) ||
    remoteLocalId !== String(local._id)
  ) {
    throw new AppError(
      "Subscription ownership verification failed",
      403,
      "SUBSCRIPTION_OWNERSHIP_MISMATCH"
    );
  }
}

function createSubscriptionService({ client, catalog, keySecret, billingService }) {
  /**
   * Access is granted through the paid-through date, so a paid subscription
   * must always carry one. Razorpay omits the period on some single-cycle
   * subscriptions, in which case the purchased plan term is authoritative.
   */
  function ensurePaidThrough(local) {
    if (!PAID_STATUSES.has(local.status) || local.currentEndAt) return;
    let plan;
    try {
      plan = catalog.getPlan(local.catalogPlanId);
    } catch {
      return;
    }
    local.currentEndAt = addInterval(
      local.currentStartAt || local.remoteCreatedAt || new Date(),
      plan.interval,
      plan.intervalCount
    );
  }

  function activateFromSettledCharge(local, remote, payment) {
    let plan;
    try {
      plan = catalog.getPlan(local.catalogPlanId);
    } catch {
      return;
    }
    const capturedOk = paymentUnlocksMembership(payment, plan);
    const remoteCharged =
      Boolean(remote) &&
      (PAID_STATUSES.has(remote.status) || Number(remote.paid_count) >= 1);
    if (!capturedOk && !remoteCharged) return;
    if (isFullyRefundedPayment(payment)) return;

    if (AWAITING_ACTIVATION_STATUSES.has(local.status)) {
      local.status =
        remote && PAID_STATUSES.has(remote.status) ? remote.status : "active";
    }
    if (!local.currentStartAt) {
      local.currentStartAt =
        unixDate(remote?.current_start) ||
        unixDate(payment?.created_at) ||
        new Date();
    }
    ensurePaidThrough(local);
  }

  async function findOpenForUser(userId, planId) {
    const query = {
      user: userId,
      status: { $in: OPEN_STATUSES },
    };
    if (planId) query.catalogPlanId = planId;
    return Subscription.findOne(query).sort({ createdAt: -1 });
  }

  async function issueInvoiceSafely({ userId, subscription, paymentId, payment }) {
    if (!billingService?.issueInvoiceForPayment || !paymentId) return;
    try {
      await billingService.issueInvoiceForPayment({
        userId,
        subscription,
        paymentId,
        payment,
      });
    } catch (error) {
      process.stderr.write(
        `[billing] invoice issue skipped for payment ${paymentId}: ${error.message}\n`
      );
    }
  }

  async function createCheckout({ userId, planId, idempotencyKey }) {
    if (billingService?.requireCheckoutReady) {
      await billingService.requireCheckoutReady(userId, planId);
    }
    const plan = catalog.getPlan(planId);

    async function unpaidOrderMatchesPlan(orderId) {
      try {
        const remote = await client.fetchOrder(orderId);
        const status = String(remote.status || "").toLowerCase();
        if (status === "paid") return true;
        return Number(remote.amount) === Number(plan.amountMinor);
      } catch {
        return false;
      }
    }

    async function abandonUnpaidCheckout(doc) {
      doc.status = "cancelled";
      doc.cancelledAt = new Date();
      doc.checkoutState = "failed";
      doc.set("razorpayOrderId", undefined);
      await doc.save();
    }

    let existingOpen = await findOpenForUser(userId, planId);
    if (
      existingOpen?.razorpayOrderId &&
      !PAID_STATUSES.has(existingOpen.status) &&
      !TERMINAL_STATUSES.has(existingOpen.status)
    ) {
      const matches = await unpaidOrderMatchesPlan(existingOpen.razorpayOrderId);
      if (matches) {
        existingOpen.checkoutState = "ready";
        await existingOpen.save();
        return toPublicSubscription(existingOpen);
      }
      // Price override / catalog change — drop stale unpaid order and create fresh.
      await abandonUnpaidCheckout(existingOpen);
      existingOpen = null;
    }

    const key =
      idempotencyKey || `open:${userId}:${planId}:${Date.now()}`;

    let local = existingOpen;
    let ownsAttempt = false;
    if (!local || PAID_STATUSES.has(local.status) || TERMINAL_STATUSES.has(local.status)) {
      try {
        local = await Subscription.create({
          user: userId,
          catalogPlanId: planId,
          razorpayPlanId: "order_checkout",
          idempotencyKey: key,
          checkoutState: "creating",
        });
        ownsAttempt = true;
      } catch (error) {
        if (error?.code !== 11000) throw error;
        local = await Subscription.findOne({ user: userId, idempotencyKey: key });
      }
    } else if (!local.razorpayOrderId) {
      ownsAttempt = true;
      local.checkoutState = "creating";
    }

    if (!local) {
      throw new AppError("Could not create checkout", 409, "CHECKOUT_CONFLICT");
    }
    if (local.catalogPlanId !== planId) {
      throw new AppError(
        "Idempotency key was already used for another plan",
        409,
        "IDEMPOTENCY_KEY_REUSED"
      );
    }
    if (local.checkoutState === "ready" && local.razorpayOrderId) {
      const matches = await unpaidOrderMatchesPlan(local.razorpayOrderId);
      if (matches) return toPublicSubscription(local);
      await abandonUnpaidCheckout(local);
      local = await Subscription.create({
        user: userId,
        catalogPlanId: planId,
        razorpayPlanId: "order_checkout",
        idempotencyKey: `open:${userId}:${planId}:${Date.now()}`,
        checkoutState: "creating",
      });
      ownsAttempt = true;
    }

    if (!ownsAttempt && local.checkoutState === "failed") {
      const claimed = await Subscription.findOneAndUpdate(
        { _id: local._id, checkoutState: "failed" },
        { $set: { checkoutState: "creating", checkoutErrorAt: null } },
        { new: true }
      );
      if (claimed) {
        local = claimed;
        ownsAttempt = true;
      }
    }
    if (!ownsAttempt && local.razorpayOrderId) {
      const matches = await unpaidOrderMatchesPlan(local.razorpayOrderId);
      if (matches) return toPublicSubscription(local);
      await abandonUnpaidCheckout(local);
      local = await Subscription.create({
        user: userId,
        catalogPlanId: planId,
        razorpayPlanId: "order_checkout",
        idempotencyKey: `open:${userId}:${planId}:${Date.now()}`,
        checkoutState: "creating",
      });
      ownsAttempt = true;
    }
    if (!ownsAttempt) {
      throw new AppError(
        "Checkout creation is already in progress",
        409,
        "CHECKOUT_IN_PROGRESS"
      );
    }

    try {
      const remote = await client.createOrder({
        amount: plan.amountMinor,
        currency: plan.currency,
        receipt: `ql_${String(local._id).slice(-12)}`,
        notes: {
          user_id: String(userId),
          local_subscription_id: String(local._id),
          catalog_plan_id: plan.id,
        },
      });
      local.razorpayPlanId = "order_checkout";
      local.razorpayOrderId = remote.id;
      local.status = "created";
      local.remoteCreatedAt = unixDate(remote.created_at) || new Date();
      local.checkoutState = "ready";
      local.lastReconciledAt = new Date();
      await local.save();
      return toPublicSubscription(local);
    } catch (error) {
      const definitelyNotCreated =
        error?.code === "PAYMENTS_NOT_CONFIGURED" ||
        (error?.code === "RAZORPAY_API_ERROR" && error.statusCode === 400);
      await Subscription.updateOne(
        { _id: local._id, checkoutState: "creating" },
        {
          $set: {
            checkoutState: definitelyNotCreated ? "failed" : "creating",
            checkoutErrorAt: new Date(),
          },
        }
      );
      throw error;
    }
  }

  async function reconcilePending(userId) {
    const local = await Subscription.findOne({ user: userId }).sort({
      createdAt: -1,
    });
    if (!local || !AWAITING_ACTIVATION_STATUSES.has(local.status)) {
      return null;
    }
    if (!local.latestPaymentId && !local.razorpayOrderId) return null;

    const lastReconciled = local.lastReconciledAt
      ? new Date(local.lastReconciledAt).getTime()
      : 0;
    if (Date.now() - lastReconciled < RECONCILE_MIN_INTERVAL_MS) return null;

    let payment = null;
    if (local.latestPaymentId) {
      payment = await client.fetchPayment(local.latestPaymentId).catch(() => null);
    }
    if (payment) {
      activateFromSettledCharge(local, null, payment);
      ensurePaidThrough(local);
    }
    local.lastReconciledAt = new Date();
    local.checkoutState = "ready";
    await local.save();
    return toPublicSubscription(local);
  }

  async function getCurrent(userId) {
    const local = await Subscription.findOne({ user: userId })
      .sort({ createdAt: -1 })
      .lean();
    return toPublicSubscription(local);
  }

  async function verifyAndReconcile({
    userId,
    paymentId,
    orderId,
    subscriptionId,
    signature,
  }) {
    if (!keySecret) {
      throw new AppError(
        "Razorpay is not configured",
        503,
        "PAYMENTS_NOT_CONFIGURED"
      );
    }

    const isOrderCheckout = Boolean(orderId);
    if (isOrderCheckout) {
      if (
        !verifyOrderCheckoutSignature(keySecret, orderId, paymentId, signature)
      ) {
        throw new AppError("Invalid checkout signature", 400, "INVALID_SIGNATURE");
      }
    } else if (subscriptionId) {
      if (
        !verifyCheckoutSignature(
          keySecret,
          paymentId,
          subscriptionId,
          signature
        )
      ) {
        throw new AppError("Invalid checkout signature", 400, "INVALID_SIGNATURE");
      }
    } else {
      throw new AppError(
        "Order or subscription id is required",
        400,
        "VALIDATION_ERROR"
      );
    }

    const local = isOrderCheckout
      ? await Subscription.findOne({ user: userId, razorpayOrderId: orderId })
      : await Subscription.findOne({
          user: userId,
          razorpaySubscriptionId: subscriptionId,
        });
    if (!local) {
      throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    const payment = await client.fetchPayment(paymentId);
    if (isOrderCheckout) {
      if (payment.order_id && payment.order_id !== orderId) {
        throw new AppError(
          "Payment does not match this order",
          409,
          "PAYMENT_ORDER_MISMATCH"
        );
      }
      const notesUser = String(payment.notes?.user_id || "");
      const notesLocal = String(payment.notes?.local_subscription_id || "");
      // Notes may be missing on some test captures; order ownership is enough.
      if (notesUser && notesUser !== String(userId)) {
        throw new AppError(
          "Payment ownership verification failed",
          403,
          "PAYMENT_OWNERSHIP_MISMATCH"
        );
      }
      if (notesLocal && notesLocal !== String(local._id)) {
        throw new AppError(
          "Payment ownership verification failed",
          403,
          "PAYMENT_OWNERSHIP_MISMATCH"
        );
      }
    } else {
      const remote = await client.fetchSubscription(subscriptionId);
      assertRemoteOwnership(local, remote, userId);
      if (payment.subscription_id && payment.subscription_id !== subscriptionId) {
        throw new AppError(
          "Razorpay has not confirmed this subscription",
          409,
          "SUBSCRIPTION_NOT_CONFIRMED"
        );
      }
      assignRemoteFields(local, remote, null);
    }

    if (isFullyRefundedPayment(payment) || payment.status === "failed") {
      throw new AppError(
        "Razorpay has not confirmed this payment",
        409,
        "SUBSCRIPTION_NOT_CONFIRMED"
      );
    }
    if (!CONFIRMED_PAYMENT_STATUSES.has(payment.status)) {
      throw new AppError(
        "Razorpay has not confirmed this payment",
        409,
        "SUBSCRIPTION_NOT_CONFIRMED"
      );
    }
    const plan = catalog.getPlan(local.catalogPlanId);
    if (
      payment.status === "captured" &&
      !paymentUnlocksMembership(payment, plan)
    ) {
      throw new AppError(
        "Payment does not match the purchased membership",
        409,
        "PAYMENT_AMOUNT_MISMATCH"
      );
    }

    local.latestPaymentId = payment.id;
    if (isOrderCheckout) local.razorpayOrderId = orderId;
    local.checkoutState = "ready";
    activateFromSettledCharge(local, null, payment);
    ensurePaidThrough(local);
    await local.save();
    await issueInvoiceSafely({
      userId,
      subscription: local,
      paymentId: payment.id,
      payment,
    });
    return toPublicSubscription(local);
  }

  async function cancel({ userId, subscriptionId, cancelAtCycleEnd }) {
    let local = null;
    if (subscriptionId) {
      const mongoose = require("mongoose");
      const filters = [
        { user: userId, razorpaySubscriptionId: subscriptionId },
        { user: userId, razorpayOrderId: subscriptionId },
      ];
      if (mongoose.Types.ObjectId.isValid(subscriptionId)) {
        filters.push({ user: userId, _id: subscriptionId });
      }
      local = await Subscription.findOne({ $or: filters });
    } else {
      local = await findOpenForUser(userId);
    }
    if (!local) {
      throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    }
    if (TERMINAL_STATUSES.has(local.status)) return toPublicSubscription(local);

    // One-time order memberships: mark cancel-at-cycle-end locally (no Razorpay sub).
    if (!local.razorpaySubscriptionId) {
      local.cancelAtCycleEnd = cancelAtCycleEnd !== false;
      if (!cancelAtCycleEnd) {
        local.status = "cancelled";
        local.cancelledAt = new Date();
        local.endedAt = new Date();
        local.idempotencyKey = `closed:${local._id}:${Date.now()}`;
      }
      local.checkoutState = "ready";
      await local.save();
      return toPublicSubscription(local);
    }

    const existing = await client.fetchSubscription(local.razorpaySubscriptionId);
    assertRemoteOwnership(local, existing, userId);
    const remote = await client.cancelSubscription(
      local.razorpaySubscriptionId,
      cancelAtCycleEnd
    );
    assignRemoteFields(local, remote, null);
    local.checkoutState = "ready";
    local.idempotencyKey = `closed:${local._id}:${Date.now()}`;
    await local.save();
    return toPublicSubscription(local);
  }

  async function applyCapturedOrderPayment(payment, eventId) {
    if (!payment?.id || payment.status !== "captured") return;
    const orderId = payment.order_id || null;
    const localId = payment.notes?.local_subscription_id || null;
    const local = orderId
      ? await Subscription.findOne({ razorpayOrderId: orderId })
      : localId
        ? await Subscription.findById(localId)
        : null;
    if (!local) return;

    local.latestPaymentId = payment.id;
    if (orderId) local.razorpayOrderId = orderId;
    local.checkoutState = "ready";
    local.lastWebhookEventId = eventId || null;
    local.lastReconciledAt = new Date();
    activateFromSettledCharge(local, null, payment);
    ensurePaidThrough(local);
    await local.save();
    await issueInvoiceSafely({
      userId: local.user,
      subscription: local,
      paymentId: payment.id,
      payment,
    });
  }

  async function applyRemoteSubscription(remote, eventId, payment) {
    if (!remote?.id) return;
    const local = await Subscription.findOne({
      razorpaySubscriptionId: remote.id,
    });
    if (!local) return;
    assignRemoteFields(local, remote, eventId);
    local.checkoutState = "ready";
    if (payment?.id) local.latestPaymentId = payment.id;
    activateFromSettledCharge(local, remote, payment);
    ensurePaidThrough(local);
    if (TERMINAL_STATUSES.has(local.status)) {
      local.idempotencyKey = `closed:${local._id}:${Date.now()}`;
    }
    await local.save();
    if (payment?.id && payment.status === "captured") {
      await issueInvoiceSafely({
        userId: local.user,
        subscription: local,
        paymentId: payment.id,
        payment,
      });
    }
  }

  async function processWebhook({ eventId, eventType, body }) {
    const auditPayload = relevantPayload(eventType, body);
    let event;
    try {
      event = await WebhookEvent.create({
        eventId,
        eventType,
        payload: auditPayload,
      });
    } catch (error) {
      if (error?.code !== 11000) throw error;
      event = await WebhookEvent.findOne({ eventId });
      if (!event || event.status !== "failed") return { duplicate: true };
      const claimed = await WebhookEvent.findOneAndUpdate(
        { _id: event._id, status: "failed" },
        {
          $set: { status: "processing", lastError: null, payload: auditPayload },
          $inc: { attempts: 1 },
        },
        { new: true }
      );
      if (!claimed) return { duplicate: true };
      event = claimed;
    }

    try {
      const payloadSubscription = body?.payload?.subscription?.entity;
      const payment = body?.payload?.payment?.entity;
      const remoteId =
        payloadSubscription?.id || payment?.subscription_id || null;

      let remote = payloadSubscription;
      if (remoteId) {
        try {
          remote = await client.fetchSubscription(remoteId);
        } catch {
          remote = payloadSubscription;
        }
      }

      if (remote?.id) {
        await applyRemoteSubscription(remote, eventId, payment);
      }

      if (
        (eventType === "payment.captured" || eventType === "order.paid") &&
        payment?.id
      ) {
        await applyCapturedOrderPayment(payment, eventId);
      }

      if (eventType === "payment.failed" && payment) {
        const filter = payment.subscription_id
          ? { razorpaySubscriptionId: payment.subscription_id }
          : payment.order_id
            ? { razorpayOrderId: payment.order_id }
            : null;
        if (filter) {
          await Subscription.updateOne(filter, {
            $set: {
              lastPaymentFailure: {
                paymentId: payment.id || null,
                code: payment.error_code || null,
                description: payment.error_description || null,
                source: payment.error_source || null,
                step: payment.error_step || null,
                reason: payment.error_reason || null,
                occurredAt: unixDate(payment.created_at) || new Date(),
              },
              lastWebhookEventId: eventId,
              lastReconciledAt: new Date(),
            },
            $inc: { paymentFailureCount: 1 },
          });
        }
      }

      event.status = "processed";
      event.processedAt = new Date();
      await event.save();
      return { duplicate: false };
    } catch (error) {
      event.status = "failed";
      event.lastError = String(error.message || "Processing failed").slice(0, 1000);
      await event.save().catch(() => {});
      throw error;
    }
  }

  return {
    createCheckout,
    getCurrent,
    reconcilePending,
    verifyAndReconcile,
    cancel,
    processWebhook,
  };
}

module.exports = {
  EVENT_STATUS_MAP,
  addInterval,
  mapEventToStatus,
  calculateCheckoutSignature,
  verifyCheckoutSignature,
  calculateOrderCheckoutSignature,
  verifyOrderCheckoutSignature,
  calculateWebhookSignature,
  verifyWebhookSignature,
  paymentUnlocksMembership,
  keepPaidStatus,
  createSubscriptionService,
};
