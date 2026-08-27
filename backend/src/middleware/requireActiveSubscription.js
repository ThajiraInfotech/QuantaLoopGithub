const { AppError } = require("../utils/AppError");
const {
  getSubscriptionAccessState,
} = require("../modules/subscriptions/subscription-access.service");

function createRequireActiveSubscription({
  resolveAccessState = getSubscriptionAccessState,
  trialDays,
} = {}) {
  return async function requireActiveSubscription(req, res, next) {
    if (!req.user) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }

    try {
      const accessState = await resolveAccessState({
        userId: req.user.id,
        role: req.user.role,
        trialDays,
        account: req.account,
      });
      req.subscriptionAccess = accessState;
      if (!accessState.entitled) {
        next(
          new AppError(
            "An active membership or trial is required",
            403,
            "SUBSCRIPTION_REQUIRED",
            { accessState }
          )
        );
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

const requireActiveSubscription = createRequireActiveSubscription();

module.exports = {
  createRequireActiveSubscription,
  requireActiveSubscription,
};
