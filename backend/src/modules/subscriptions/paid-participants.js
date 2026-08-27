const { Subscription } = require("./subscription.model");
const { User } = require("../users/user.model");
const { PAID_STATUSES } = require("./subscription-access.service");

/**
 * A paid member is someone who has completed at least one successful charge.
 * Checkout still creates a User so Razorpay can charge them, but that row is
 * not treated as paid until money has moved.
 */
function paidMembershipClause() {
  return {
    $or: [
      { status: { $in: PAID_STATUSES } },
      { latestPaymentId: { $ne: null } },
    ],
  };
}

async function findPaidSubscription(userId) {
  return Subscription.findOne({
    user: userId,
    ...paidMembershipClause(),
  }).lean();
}

async function userHasPaidMembership(userId) {
  return Boolean(await findPaidSubscription(userId));
}

async function paidParticipantIds() {
  return Subscription.distinct("user", paidMembershipClause());
}

/**
 * Network-visible participants: paid members OR users still inside free trial.
 * Keeps admin/network lists aligned with who can actually use the product.
 */
async function networkParticipantIds(now = new Date()) {
  const [paidIds, trialIds] = await Promise.all([
    paidParticipantIds(),
    User.distinct("_id", {
      role: { $ne: "admin" },
      trialEndsAt: { $gt: now },
    }),
  ]);
  const merged = new Map();
  for (const id of paidIds) merged.set(String(id), id);
  for (const id of trialIds) merged.set(String(id), id);
  return [...merged.values()];
}

async function paidParticipantFilter() {
  const ids = await paidParticipantIds();
  return { role: { $ne: "admin" }, _id: { $in: ids } };
}

async function networkParticipantFilter(now = new Date()) {
  const ids = await networkParticipantIds(now);
  return { role: { $ne: "admin" }, _id: { $in: ids } };
}

async function userHasNetworkAccess(userId, now = new Date()) {
  if (await userHasPaidMembership(userId)) return true;
  const user = await User.findById(userId).select("trialEndsAt").lean();
  return Boolean(user?.trialEndsAt && new Date(user.trialEndsAt) > now);
}

module.exports = {
  paidMembershipClause,
  findPaidSubscription,
  userHasPaidMembership,
  paidParticipantIds,
  paidParticipantFilter,
  networkParticipantIds,
  networkParticipantFilter,
  userHasNetworkAccess,
};
