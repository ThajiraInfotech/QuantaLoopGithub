const mongoose = require("mongoose");

const SUBSCRIPTION_STATUSES = [
  "created",
  "authenticated",
  "active",
  "pending",
  "halted",
  "paused",
  "cancelled",
  "completed",
  "expired",
];

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    catalogPlanId: { type: String, required: true, index: true },
    // Legacy Razorpay Subscriptions field. Order checkout uses a placeholder.
    razorpayPlanId: { type: String, default: "order_checkout" },
    razorpaySubscriptionId: { type: String, unique: true, sparse: true },
    razorpayOrderId: { type: String, unique: true, sparse: true },
    /** Snapshot of what was charged (INR or USD) so verify stays correct. */
    checkoutAmountMinor: { type: Number, default: null },
    checkoutCurrency: { type: String, trim: true, uppercase: true, default: null },
    latestPaymentId: { type: String, default: null },
    idempotencyKey: { type: String, required: true },
    checkoutState: {
      type: String,
      enum: ["creating", "ready", "failed"],
      default: "creating",
    },
    checkoutErrorAt: { type: Date, default: null },
    status: {
      type: String,
      enum: SUBSCRIPTION_STATUSES,
      default: "created",
      index: true,
    },
    shortUrl: { type: String, default: null },
    currentStartAt: { type: Date, default: null },
    currentEndAt: { type: Date, default: null },
    chargeAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelAtCycleEnd: { type: Boolean, default: false },
    lastPaymentFailure: {
      paymentId: { type: String, default: null },
      code: { type: String, default: null },
      description: { type: String, default: null },
      source: { type: String, default: null },
      step: { type: String, default: null },
      reason: { type: String, default: null },
      occurredAt: { type: Date, default: null },
    },
    paymentFailureCount: { type: Number, default: 0, min: 0 },
    lastWebhookEventId: { type: String, default: null },
    lastReconciledAt: { type: Date, default: null },
    remoteCreatedAt: { type: Date, default: null },
  },
  { timestamps: true, minimize: false }
);

subscriptionSchema.index({ user: 1, idempotencyKey: 1 }, { unique: true });
subscriptionSchema.index({ user: 1, createdAt: -1 });
subscriptionSchema.index({ user: 1, status: 1, currentEndAt: -1 });

function toPublicSubscription(value) {
  if (!value) return null;
  const o = value.toObject ? value.toObject() : value;
  const id = o._id.toString();
  const planId = o.catalogPlanId;
  const razorpaySubscriptionId = o.razorpaySubscriptionId || null;
  const razorpayOrderId = o.razorpayOrderId || null;
  const currentEndAt = o.currentEndAt || null;
  return {
    id,
    planId,
    planCode: planId,
    subscriptionId: razorpaySubscriptionId,
    razorpaySubscriptionId,
    orderId: razorpayOrderId,
    razorpayOrderId,
    checkoutAmountMinor:
      typeof o.checkoutAmountMinor === "number" ? o.checkoutAmountMinor : null,
    checkoutCurrency: o.checkoutCurrency || null,
    status: o.status,
    shortUrl: o.shortUrl || null,
    currentStartAt: o.currentStartAt || null,
    currentEndAt,
    currentPeriodEnd: currentEndAt,
    chargeAt: o.chargeAt || null,
    endedAt: o.endedAt || null,
    cancelledAt: o.cancelledAt || null,
    cancelAtCycleEnd: Boolean(o.cancelAtCycleEnd),
    latestPaymentId: o.latestPaymentId || null,
    paymentFailureCount: o.paymentFailureCount || 0,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
  };
}

const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = {
  Subscription,
  SUBSCRIPTION_STATUSES,
  toPublicSubscription,
};
