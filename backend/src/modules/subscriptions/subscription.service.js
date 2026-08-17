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
const CONFIRMED_SUBSCRIPTION_STATUSES = new Set(["authenticated", "active"]);
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

function calculateWebhookSignature(secret, rawBody) {
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

function verifyWebhookSignature(secret, rawBody, signature) {
  return secureCompareHex(calculateWebhookSignature(secret, rawBody), signature);
}

function mapEventToStatus(eventType) {
  return EVENT_STATUS_MAP[eventType] || null;
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

function createSubscriptionService({ client, catalog, keySecret }) {
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

  async function findOpenForUser(userId, planId) {
    const query = {
      user: userId,
      status: { $in: OPEN_STATUSES },
    };
    if (planId) query.catalogPlanId = planId;
    return Subscription.findOne(query).sort({ createdAt: -1 });
  }

  async function createCheckout({ userId, planId, idempotencyKey }) {
    const plan = catalog.getPlan(planId);
    const razorpayPlanId =
      plan.razorpayPlanId ||
      (await client.resolvePlanId(plan, plan.razorpayPlanId || null));
    if (!razorpayPlanId) {
      throw new AppError("Plan is not available", 404, "PLAN_NOT_AVAILABLE");
    }

    let existingOpen = await findOpenForUser(userId, planId);
    if (existingOpen?.razorpaySubscriptionId) {
      try {
        const remote = await client.fetchSubscription(
          existingOpen.razorpaySubscriptionId
        );
        Object.assign(existingOpen, remoteFields(remote), {
          checkoutState: "ready",
        });
        await existingOpen.save();
      } catch {
        /* keep local record if remote fetch fails */
      }
      if (!TERMINAL_STATUSES.has(existingOpen.status)) {
        return toPublicSubscription(existingOpen);
      }
      existingOpen = null;
    }

    const key =
      idempotencyKey ||
      `open:${userId}:${planId}:${Date.now()}`;

    let local = existingOpen;
    let ownsAttempt = false;
    if (!local) {
      try {
        local = await Subscription.create({
          user: userId,
          catalogPlanId: planId,
          razorpayPlanId,
          idempotencyKey: key,
          checkoutState: "creating",
        });
        ownsAttempt = true;
      } catch (error) {
        if (error?.code !== 11000) throw error;
        local = await Subscription.findOne({ user: userId, idempotencyKey: key });
      }
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
    if (local.checkoutState === "ready" && local.razorpaySubscriptionId) {
      return toPublicSubscription(local);
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
    if (!ownsAttempt && local.razorpaySubscriptionId) {
      return toPublicSubscription(local);
    }
    if (!ownsAttempt) {
      throw new AppError(
        "Checkout creation is already in progress",
        409,
        "CHECKOUT_IN_PROGRESS"
      );
    }

    try {
      const expireBy = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      const remote = await client.createSubscription({
        plan_id: razorpayPlanId,
        total_count: plan.totalCount,
        quantity: 1,
        customer_notify: 1,
        expire_by: expireBy,
        notes: {
          user_id: String(userId),
          local_subscription_id: String(local._id),
          catalog_plan_id: plan.id,
        },
      });
      local.razorpayPlanId = razorpayPlanId;
      local.razorpaySubscriptionId = remote.id;
      local.status = remote.status || "created";
      local.shortUrl = remote.short_url || null;
      local.remoteCreatedAt = unixDate(remote.created_at);
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
    const local = await Subscription.findOne({ user: userId })
      .sort({ createdAt: -1 });
    if (
      !local?.razorpaySubscriptionId ||
      !AWAITING_ACTIVATION_STATUSES.has(local.status)
    ) {
      return null;
    }
    const lastReconciled = local.lastReconciledAt
      ? new Date(local.lastReconciledAt).getTime()
      : 0;
    if (Date.now() - lastReconciled < RECONCILE_MIN_INTERVAL_MS) return null;

    const remote = await client.fetchSubscription(local.razorpaySubscriptionId);
    Object.assign(local, remoteFields(remote), { checkoutState: "ready" });
    ensurePaidThrough(local);
    if (TERMINAL_STATUSES.has(local.status)) {
      local.idempotencyKey = `closed:${local._id}:${Date.now()}`;
    }
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
    const local = await Subscription.findOne({
      user: userId,
      razorpaySubscriptionId: subscriptionId,
    });
    if (!local) {
      throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    }
    const [remote, payment] = await Promise.all([
      client.fetchSubscription(subscriptionId),
      client.fetchPayment(paymentId),
    ]);
    assertRemoteOwnership(local, remote, userId);
    if (payment.subscription_id && payment.subscription_id !== subscriptionId) {
      throw new AppError(
        "Razorpay has not confirmed this subscription",
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
    Object.assign(local, remoteFields(remote), {
      latestPaymentId: payment.id,
      checkoutState: "ready",
    });
    ensurePaidThrough(local);
    await local.save();
    return toPublicSubscription(local);
  }

  async function cancel({ userId, subscriptionId, cancelAtCycleEnd }) {
    const local = subscriptionId
      ? await Subscription.findOne({
          user: userId,
          razorpaySubscriptionId: subscriptionId,
        })
      : await findOpenForUser(userId);
    if (!local?.razorpaySubscriptionId) {
      throw new AppError("Subscription not found", 404, "SUBSCRIPTION_NOT_FOUND");
    }
    if (TERMINAL_STATUSES.has(local.status)) return toPublicSubscription(local);
    const existing = await client.fetchSubscription(local.razorpaySubscriptionId);
    assertRemoteOwnership(local, existing, userId);
    const remote = await client.cancelSubscription(
      local.razorpaySubscriptionId,
      cancelAtCycleEnd
    );
    Object.assign(local, remoteFields(remote), { checkoutState: "ready" });
    local.idempotencyKey = `closed:${local._id}:${Date.now()}`;
    await local.save();
    return toPublicSubscription(local);
  }

  async function applyRemoteSubscription(remote, eventId) {
    if (!remote?.id) return;
    const local = await Subscription.findOne({
      razorpaySubscriptionId: remote.id,
    });
    if (!local) return;
    Object.assign(local, remoteFields(remote, eventId), {
      checkoutState: "ready",
    });
    ensurePaidThrough(local);
    if (TERMINAL_STATUSES.has(local.status)) {
      local.idempotencyKey = `closed:${local._id}:${Date.now()}`;
    }
    await local.save();
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
        await applyRemoteSubscription(remote, eventId);
      }

      if (eventType === "payment.failed" && payment?.subscription_id) {
        await Subscription.updateOne(
          { razorpaySubscriptionId: payment.subscription_id },
          {
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
          }
        );
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
  calculateWebhookSignature,
  verifyWebhookSignature,
  createSubscriptionService,
};
