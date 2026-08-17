const { AppError } = require("../utils/AppError");
const {
  userNeedsAccountSetup,
  userNeedsOnboarding,
} = require("../utils/onboardingStatus");

/**
 * Protects the boundary after account creation. Unpaid users still need auth,
 * profile and billing endpoints, but cannot start checkout or use the product
 * until OTP and all required onboarding details are complete.
 */
function requireCompletedOnboarding(req, res, next) {
  if (!req.user || !req.account) {
    next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
    return;
  }

  if (req.user.role === "admin") {
    next();
    return;
  }

  const account = req.account;
  const emailIsVerified =
    account.emailVerified !== false ||
    account.authProvider === "google" ||
    account.googleEmailVerified === true;

  if (!emailIsVerified) {
    next(
      new AppError(
        "Verify your email before continuing",
        403,
        "EMAIL_VERIFICATION_REQUIRED"
      )
    );
    return;
  }

  if (userNeedsOnboarding(account)) {
    next(
      new AppError(
        "Complete onboarding before continuing",
        403,
        "ONBOARDING_REQUIRED"
      )
    );
    return;
  }

  if (userNeedsAccountSetup(account)) {
    next(
      new AppError(
        "Complete account setup before continuing",
        403,
        "ACCOUNT_SETUP_REQUIRED"
      )
    );
    return;
  }

  next();
}

module.exports = { requireCompletedOnboarding };
