const { Subscription } = require("./subscription.model");
const { User } = require("../users/user.model");
const {
  userNeedsAccountSetup,
  userNeedsOnboarding,
} = require("../../utils/onboardingStatus");

// A single-cycle annual plan is billed once, so Razorpay reports "completed"
// as soon as that charge settles. The member paid for the whole term either
// way, so access is decided by the paid-through date, not by future billing.
const PAID_STATUSES = ["active", "completed"];
// Members are warned this many days before the paid year runs out.
const RENEWAL_NOTICE_DAYS = 10;
const DEFAULT_TRIAL_DAYS = 30;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysUntil(expiresAt, now) {
  return Math.ceil((expiresAt.getTime() - now.getTime()) / MS_PER_DAY);
}

function normalizeSubscription(subscription) {
  if (!subscription) return null;
  return subscription.toObject ? subscription.toObject() : subscription;
}

function normalizeTrialDays(value) {
  const days = Number(value);
  if (!Number.isFinite(days) || days < 0) return DEFAULT_TRIAL_DAYS;
  return Math.min(365, Math.floor(days));
}

function isEmailVerified(account) {
  return (
    account.emailVerified !== false ||
    account.authProvider === "google" ||
    account.googleEmailVerified === true
  );
}

function isAccountReadyForTrial(account) {
  if (!account || account.role === "admin") return false;
  if (!isEmailVerified(account)) return false;
  if (userNeedsOnboarding(account)) return false;
  if (userNeedsAccountSetup(account)) return false;
  return true;
}

function buildAccessState({
  state,
  entitled,
  reason,
  plan = null,
  status = null,
  expiresAt = null,
  daysRemaining = null,
  expiringSoon = false,
  accessSource = null,
  isTrial = false,
}) {
  return {
    state,
    plan,
    status,
    expiresAt,
    daysRemaining,
    expiringSoon,
    entitled,
    reason,
    accessSource,
    isTrial,
  };
}

function accessStateFromSubscription({ role, subscription, now = new Date() }) {
  if (role === "admin") {
    return buildAccessState({
      state: "admin_bypass",
      entitled: true,
      reason: "ADMIN_BYPASS",
      accessSource: "admin",
    });
  }

  const local = normalizeSubscription(subscription);
  if (!local) {
    return buildAccessState({
      state: "not_entitled",
      entitled: false,
      reason: "NO_SUBSCRIPTION",
    });
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

  return buildAccessState({
    state: entitled ? "entitled" : "not_entitled",
    plan: local.catalogPlanId || null,
    status: local.status || null,
    expiresAt,
    daysRemaining,
    expiringSoon:
      entitled && daysRemaining !== null && daysRemaining <= RENEWAL_NOTICE_DAYS,
    entitled,
    reason,
    accessSource: entitled ? "paid" : null,
    isTrial: false,
  });
}

function accessStateFromTrial({ trialEndsAt, now = new Date() }) {
  const expiresAt = trialEndsAt ? new Date(trialEndsAt) : null;
  const hasFutureEnd =
    expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt > now;
  if (!hasFutureEnd) {
    return buildAccessState({
      state: "not_entitled",
      entitled: false,
      reason: "TRIAL_EXPIRED",
      expiresAt,
      accessSource: null,
      isTrial: false,
    });
  }

  const daysRemaining = daysUntil(expiresAt, now);
  return buildAccessState({
    state: "entitled",
    entitled: true,
    reason: "TRIAL_ACTIVE",
    expiresAt,
    daysRemaining,
    // Same notice window as paid renewal — avoid a full-trial banner.
    expiringSoon:
      daysRemaining !== null && daysRemaining <= RENEWAL_NOTICE_DAYS,
    accessSource: "trial",
    isTrial: true,
  });
}

async function startTrialIfEligible({
  userId,
  account,
  now,
  trialDays,
  userModel,
}) {
  if (trialDays <= 0) return null;
  if (!isAccountReadyForTrial(account)) return null;
  if (account.trialConsumed) return null;
  if (account.trialEndsAt && new Date(account.trialEndsAt) > now) {
    return account;
  }

  const trialEndsAt = new Date(now.getTime() + trialDays * MS_PER_DAY);
  const updated = await userModel
    .findOneAndUpdate(
      {
        _id: userId,
        trialConsumed: { $ne: true },
        $or: [{ trialEndsAt: null }, { trialEndsAt: { $exists: false } }],
      },
      {
        $set: {
          trialStartedAt: now,
          trialEndsAt,
          trialConsumed: true,
        },
      },
      { new: true }
    )
    .lean();

  return updated;
}

async function getSubscriptionAccessState({
  userId,
  role,
  now = new Date(),
  subscriptionModel = Subscription,
  userModel = User,
  trialDays = DEFAULT_TRIAL_DAYS,
  account = null,
} = {}) {
  if (role === "admin") {
    return accessStateFromSubscription({ role, subscription: null, now });
  }

  const resolvedTrialDays = normalizeTrialDays(trialDays);

  // Search for any currently valid subscription first. A newer processing or
  // failed checkout must not hide an older subscription that still grants access.
  const valid = await subscriptionModel
    .findOne({
      user: userId,
      status: { $in: PAID_STATUSES },
      currentEndAt: { $gt: now },
    })
    .sort({ currentEndAt: -1 })
    .lean();

  if (valid) {
    return accessStateFromSubscription({ role, subscription: valid, now });
  }

  // Anyone who has already paid (even if the term lapsed) does not get a trial.
  const everPaid = await subscriptionModel
    .findOne({
      user: userId,
      $or: [
        { status: { $in: PAID_STATUSES } },
        { latestPaymentId: { $ne: null } },
      ],
    })
    .select("_id")
    .lean();

  let userDoc = await userModel
    .findById(userId)
    .select(
      [
        "role",
        "emailVerified",
        "googleEmailVerified",
        "authProvider",
        "hasLocalPassword",
        "materialTypes",
        "preferredMaterialCategories",
        "requiredMaterialCategories",
        "country",
        "state",
        "location",
        "trialStartedAt",
        "trialEndsAt",
        "trialConsumed",
      ].join(" ")
    )
    .lean();

  if (!everPaid && userDoc?.trialEndsAt && new Date(userDoc.trialEndsAt) > now) {
    return accessStateFromTrial({ trialEndsAt: userDoc.trialEndsAt, now });
  }

  if (!everPaid) {
    const started = await startTrialIfEligible({
      userId,
      account: userDoc || { role },
      now,
      trialDays: resolvedTrialDays,
      userModel,
    });

    if (started?.trialEndsAt && new Date(started.trialEndsAt) > now) {
      return accessStateFromTrial({ trialEndsAt: started.trialEndsAt, now });
    }

    if (userDoc?.trialConsumed && userDoc?.trialEndsAt) {
      return accessStateFromTrial({ trialEndsAt: userDoc.trialEndsAt, now });
    }
  }

  const latest = await subscriptionModel
    .findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();
  return accessStateFromSubscription({ role, subscription: latest, now });
}

async function markTrialConsumed(userId, userModel = User) {
  if (!userId) return;
  await userModel.updateOne(
    { _id: userId },
    { $set: { trialConsumed: true } }
  );
}

module.exports = {
  PAID_STATUSES,
  RENEWAL_NOTICE_DAYS,
  DEFAULT_TRIAL_DAYS,
  accessStateFromSubscription,
  accessStateFromTrial,
  getSubscriptionAccessState,
  markTrialConsumed,
  isAccountReadyForTrial,
  normalizeTrialDays,
};
