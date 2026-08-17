const { Subscription } = require("./subscription.model");

// A single-cycle annual plan is billed once, so Razorpay reports "completed"
// as soon as that charge settles. The member paid for the whole term either
// way, so access is decided by the paid-through date, not by future billing.
const PAID_STATUSES = ["active", "completed"];
// Members are warned this many days before the paid year runs out.
const RENEWAL_NOTICE_DAYS = 10;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(expiresAt, now) {
  return Math.ceil((expiresAt.getTime() - now.getTime()) / MS_PER_DAY);
}

function normalizeSubscription(subscription) {
  if (!subscription) return null;
  return subscription.toObject ? subscription.toObject() : subscription;
}

function accessStateFromSubscription({ role, subscription, now = new Date() }) {
  if (role === "admin") {
    return {
      state: "admin_bypass",
      plan: null,
      status: null,
      expiresAt: null,
      daysRemaining: null,
      expiringSoon: false,
      entitled: true,
      reason: "ADMIN_BYPASS",
    };
  }

  const local = normalizeSubscription(subscription);
  if (!local) {
    return {
      state: "not_entitled",
      plan: null,
      status: null,
      expiresAt: null,
      daysRemaining: null,
      expiringSoon: false,
      entitled: false,
      reason: "NO_SUBSCRIPTION",
    };
  }

  const expiresAt = local.currentEndAt ? new Date(local.currentEndAt) : null;
  const hasFutureEnd =
    expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt > now;
  const paid = PAID_STATUSES.includes(local.status);
  const entitled = paid && Boolean(hasFutureEnd);

  let reason = "ACTIVE_SUBSCRIPTION";
  if (!entitled && local.status === "authenticated") {
    reason = "PAYMENT_PROCESSING";
  } else if (!entitled && !paid) {
    reason = "SUBSCRIPTION_NOT_ACTIVE";
  } else if (!entitled && !expiresAt) {
    reason = "EXPIRATION_NOT_CONFIRMED";
  } else if (!entitled) {
    reason = "SUBSCRIPTION_EXPIRED";
  }

  const daysRemaining = hasFutureEnd ? daysUntil(expiresAt, now) : null;

  return {
    state: entitled ? "entitled" : "not_entitled",
    plan: local.catalogPlanId || null,
    status: local.status || null,
    expiresAt,
    daysRemaining,
    expiringSoon:
      entitled && daysRemaining !== null && daysRemaining <= RENEWAL_NOTICE_DAYS,
    entitled,
    reason,
  };
}

async function getSubscriptionAccessState({
  userId,
  role,
  now = new Date(),
  subscriptionModel = Subscription,
}) {
  if (role === "admin") {
    return accessStateFromSubscription({ role, subscription: null, now });
  }

  // Search for any currently valid subscription first. A newer processing or
  // failed checkout must not hide an older subscription that still grants access.
  const valid = await subscriptionModel.findOne({
    user: userId,
    status: { $in: PAID_STATUSES },
    currentEndAt: { $gt: now },
  })
    .sort({ currentEndAt: -1 })
    .lean();

  if (valid) {
    return accessStateFromSubscription({ role, subscription: valid, now });
  }

  const latest = await subscriptionModel.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
  return accessStateFromSubscription({ role, subscription: latest, now });
}

module.exports = {
  PAID_STATUSES,
  RENEWAL_NOTICE_DAYS,
  accessStateFromSubscription,
  getSubscriptionAccessState,
};
