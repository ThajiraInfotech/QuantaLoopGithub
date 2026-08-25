const { Subscription } = require("./subscription.model");
const { PAID_STATUSES } = require("./subscription-access.service");

/**
 * A network participant is someone who has paid at least once.
 * Checkout still creates a User so Razorpay can charge them, but that row is
 * not listed in admin or network counts until money has moved.
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

async function paidParticipantFilter() {
  const ids = await paidParticipantIds();
  return { role: { $ne: "admin" }, _id: { $in: ids } };
}

module.exports = {
  paidMembershipClause,
  findPaidSubscription,
  userHasPaidMembership,
  paidParticipantIds,
  paidParticipantFilter,
};
