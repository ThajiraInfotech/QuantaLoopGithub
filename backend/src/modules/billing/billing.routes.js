const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  requireCompletedOnboarding,
} = require("../../middleware/requireCompletedOnboarding");
const { createSubscriptionCatalog } = require("../../config/subscriptionCatalog");
const { createBillingService } = require("./billing.service");
const { createBillingController } = require("./billing.controller");

function createBillingRouter(env, options = {}) {
  const router = express.Router();
  const catalog = options.catalog || createSubscriptionCatalog(env);
  const service =
    options.service ||
    createBillingService({
      env,
      catalog,
      emailService: options.emailService || null,
    });
  const controller = createBillingController({ service });
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/profile", requireAuth, controller.getProfile);
  router.put(
    "/profile",
    requireAuth,
    requireCompletedOnboarding,
    controller.upsertProfile
  );
  router.get("/tax-preview", requireAuth, controller.previewTax);
  router.get("/invoices", requireAuth, controller.listInvoices);
  router.get("/invoices/:invoiceId", requireAuth, controller.getInvoice);
  router.get(
    "/invoices/:invoiceId/html",
    requireAuth,
    controller.getInvoiceHtml
  );

  return router;
}

module.exports = { createBillingRouter, createBillingService };
