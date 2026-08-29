const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../../middleware/auth");
const { createAuthController } = require("./auth.controller");

function createAuthRouter(env) {
  const router = express.Router();
  const controller = createAuthController(env);
  const auth = authenticate({ jwtSecret: env.JWT_SECRET });

  const passwordResetLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false },
    message: {
      success: false,
      message: "Too many reset attempts. Please try again later.",
      data: null,
      error: {
        message: "Too many reset attempts. Please try again later.",
        code: "RATE_LIMITED",
      },
    },
  });

  router.post("/register", controller.register);
  router.post("/login", controller.login);
  router.post("/google", controller.googleAuth);
  router.post("/google/preview", controller.googlePreview);
  router.post("/google/register", controller.googleRegister);
  router.post("/forgot-password", passwordResetLimiter, controller.forgotPassword);
  router.post("/reset-password", passwordResetLimiter, controller.resetPassword);
  router.post("/verify-email", passwordResetLimiter, controller.verifyEmail);
  router.post("/resend-verification", passwordResetLimiter, controller.resendVerification);
  router.post("/complete-account-setup", auth, controller.completeAccountSetup);
  router.delete("/signup", auth, controller.cancelSignup);
  router.post("/logout", controller.logout);

  return router;
}

module.exports = { createAuthRouter };
