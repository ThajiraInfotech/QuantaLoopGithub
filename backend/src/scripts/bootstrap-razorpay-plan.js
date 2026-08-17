/**
 * Create or reuse the yearly ₹6999 Razorpay plan for annual_access.
 * Usage: node src/scripts/bootstrap-razorpay-plan.js
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const { CATALOG } = require("../config/subscriptionCatalog");
const { createRazorpayClient } = require("../modules/subscriptions/razorpay.client");

async function main() {
  const env = loadEnv();
  const client = createRazorpayClient({
    keyId: env.RAZORPAY_KEY_ID,
    keySecret: env.RAZORPAY_KEY_SECRET,
  });
  const plan = CATALOG.annual_access;
  const planId = await client.resolvePlanId(
    plan,
    env.RAZORPAY_PLAN_ID_ANNUAL_ACCESS || null
  );
  process.stdout.write(`Razorpay plan ready: ${planId}\n`);
  process.stdout.write(
    `Set RAZORPAY_PLAN_ID_ANNUAL_ACCESS=${planId} in backend/.env to pin it.\n`
  );
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exit(1);
});
