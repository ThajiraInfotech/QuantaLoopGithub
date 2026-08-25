const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  requireCompletedOnboarding,
} = require("../../middleware/requireCompletedOnboarding");
const { createSubscriptionCatalog } = require("../../config/subscriptionCatalog");
const { createRazorpayClient } = require("./razorpay.client");
const { createSubscriptionService } = require("./subscription.service");
const { createSubscriptionController } = require("./subscription.controller");
const { createBillingService } = require("../billing/billing.service");
const { sendInvoiceEmail } = require("../../services/email/email.service");

function createDependencies(env) {
  const catalog = createSubscriptionCatalog(env);
  const client = createRazorpayClient({
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
  });
  const billingService = createBillingService({
    env,
    catalog,
    emailService: {
      sendInvoiceEmail: (payload) => sendInvoiceEmail(env, payload),
    },
  });
  const service = createSubscriptionService({
    client,
    catalog,
    keySecret: env.RAZORPAY_KEY_SECRET,
    billingService,
  });
  return {
    catalog,
    controller: createSubscriptionController({ service, catalog, env }),
  };
}

// Entitlement is polled right after payment; a conditional 304 from an earlier
// unpaid read would keep the member locked out.
function noStore(req, res, next) {
  res.set("Cache-Control", "no-store");
  next();
}

function createSubscriptionsRouter(env) {
  const router = express.Router();
  const { controller } = createDependencies(env);
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.use(noStore);
  router.get("/config", requireAuth, controller.getConfig);
  router.get("/plans", requireAuth, controller.getConfig);
  router.get("/current", requireAuth, controller.getCurrent);
  router.get("/me", requireAuth, controller.getCurrent);
  router.get("/access-state", requireAuth, controller.getAccessState);
  router.post(
    "/checkout",
    requireAuth,
    requireCompletedOnboarding,
    controller.createCheckout
  );
  router.post("/verify", requireAuth, controller.verifyCheckout);
  router.post("/cancel", requireAuth, controller.cancel);
  router.post("/:subscriptionId/cancel", requireAuth, controller.cancel);
  return router;
}

function createSubscriptionWebhookRouter(env) {
  const router = express.Router();
  const { controller } = createDependencies(env);
  router.post("/", controller.webhook);
  return router;
}

module.exports = {
  createSubscriptionsRouter,
  createSubscriptionWebhookRouter,
};
