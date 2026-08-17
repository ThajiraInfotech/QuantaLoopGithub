const { AppError } = require("../utils/AppError");
const {
  getSubscriptionAccessState,
} = require("../modules/subscriptions/subscription-access.service");

function createRequireActiveSubscription({
  resolveAccessState = getSubscriptionAccessState,
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
      });
      req.subscriptionAccess = accessState;
      if (!accessState.entitled) {
        next(
          new AppError(
            "An active subscription is required",
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
