/**
 * Signature and status-mapping checks for Razorpay subscriptions.
 * No database or network required.
 */
const assert = require("node:assert/strict");

const {
  EVENT_STATUS_MAP,
  mapEventToStatus,
  calculateCheckoutSignature,
  verifyCheckoutSignature,
  calculateWebhookSignature,
  verifyWebhookSignature,
} = require("../modules/subscriptions/subscription.service");
const { parsePlanMap } = require("../config/subscriptionCatalog");

const secret = "test_razorpay_key_secret";
const webhookSecret = "test_webhook_secret";

function ok(label) {
  process.stdout.write(`  ✓ ${label}\n`);
}

const paymentId = "pay_test123";
const subscriptionId = "sub_test123";
const checkoutSig = calculateCheckoutSignature(secret, paymentId, subscriptionId);

assert.equal(
  verifyCheckoutSignature(secret, paymentId, subscriptionId, checkoutSig),
  true
);
ok("valid checkout signature is accepted");

assert.equal(
  verifyCheckoutSignature(secret, paymentId, subscriptionId, "0".repeat(64)),
  false
);
ok("tampered checkout signature is rejected");

assert.equal(
  verifyCheckoutSignature(secret, paymentId, "sub_other", checkoutSig),
  false
);
ok("checkout signature does not bind a different subscription");

const rawBody = Buffer.from(
  JSON.stringify({ event: "subscription.activated", payload: {} }),
  "utf8"
);
const webhookSig = calculateWebhookSignature(webhookSecret, rawBody);
assert.equal(verifyWebhookSignature(webhookSecret, rawBody, webhookSig), true);
ok("valid webhook signature is accepted");

assert.equal(
  verifyWebhookSignature(webhookSecret, Buffer.from(`${rawBody} `), webhookSig),
  false
);
ok("webhook signature requires the exact raw body");

assert.equal(mapEventToStatus("subscription.activated"), "active");
assert.equal(mapEventToStatus("subscription.authenticated"), "authenticated");
assert.equal(mapEventToStatus("subscription.pending"), "pending");
assert.equal(mapEventToStatus("subscription.halted"), "halted");
assert.equal(mapEventToStatus("subscription.paused"), "paused");
assert.equal(mapEventToStatus("subscription.resumed"), "active");
assert.equal(mapEventToStatus("subscription.cancelled"), "cancelled");
assert.equal(mapEventToStatus("subscription.completed"), "completed");
assert.equal(mapEventToStatus("subscription.expired"), "expired");
assert.equal(mapEventToStatus("payment.failed"), null);
ok("subscription event status mapping");

assert.equal("subscription.charged" in EVENT_STATUS_MAP, true);
ok("charged events are tracked without forcing a status overwrite");

assert.deepEqual(parsePlanMap(""), {});
assert.deepEqual(parsePlanMap('{"annual_access":"plan_ABC123"}'), {
  annual_access: "plan_ABC123",
});
assert.deepEqual(parsePlanMap('{"unknown":"plan_ABC123"}'), {});
ok("plan map parsing ignores unknown catalog ids");

process.stdout.write("\nRazorpay signature checks passed.\n");
