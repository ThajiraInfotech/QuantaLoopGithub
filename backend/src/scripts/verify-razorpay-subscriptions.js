const assert = require("node:assert/strict");
const crypto = require("node:crypto");

const {
  EVENT_STATUS_MAP,
  addInterval,
  mapEventToStatus,
  calculateCheckoutSignature,
  verifyCheckoutSignature,
  calculateWebhookSignature,
  verifyWebhookSignature,
  paymentUnlocksMembership,
  keepPaidStatus,
} = require("../modules/subscriptions/subscription.service");

const secret = "unit-test-secret";
const paymentId = "pay_unit123";
const subscriptionId = "sub_unit456";
const expectedCheckout = crypto
  .createHmac("sha256", secret)
  .update(`${paymentId}|${subscriptionId}`)
  .digest("hex");

assert.equal(
  calculateCheckoutSignature(secret, paymentId, subscriptionId),
  expectedCheckout
);
assert.equal(
  verifyCheckoutSignature(
    secret,
    paymentId,
    subscriptionId,
    expectedCheckout
  ),
  true
);
assert.equal(
  verifyCheckoutSignature(secret, paymentId, subscriptionId, "0".repeat(64)),
  false
);
assert.equal(verifyCheckoutSignature(secret, paymentId, subscriptionId, "bad"), false);

const orderId = "order_unit789";
const expectedOrderCheckout = crypto
  .createHmac("sha256", secret)
  .update(`${orderId}|${paymentId}`)
  .digest("hex");
assert.equal(
  require("../modules/subscriptions/subscription.service").calculateOrderCheckoutSignature(
    secret,
    orderId,
    paymentId
  ),
  expectedOrderCheckout
);
assert.equal(
  require("../modules/subscriptions/subscription.service").verifyOrderCheckoutSignature(
    secret,
    orderId,
    paymentId,
    expectedOrderCheckout
  ),
  true
);

const rawBody = Buffer.from('{"event":"subscription.activated","amount":699900}');
const expectedWebhook = crypto
  .createHmac("sha256", secret)
  .update(rawBody)
  .digest("hex");
assert.equal(calculateWebhookSignature(secret, rawBody), expectedWebhook);
assert.equal(verifyWebhookSignature(secret, rawBody, expectedWebhook), true);
assert.equal(
  verifyWebhookSignature(
    secret,
    Buffer.from(`${rawBody.toString()} `),
    expectedWebhook
  ),
  false
);

for (const [eventType, status] of Object.entries(EVENT_STATUS_MAP)) {
  assert.equal(mapEventToStatus(eventType), status);
}
assert.equal(mapEventToStatus("payment.failed"), null);
assert.deepEqual(
  Object.keys(EVENT_STATUS_MAP).sort(),
  [
    "subscription.activated",
    "subscription.authenticated",
    "subscription.cancelled",
    "subscription.charged",
    "subscription.completed",
    "subscription.expired",
    "subscription.halted",
    "subscription.paused",
    "subscription.pending",
    "subscription.resumed",
    "subscription.updated",
  ].sort()
);

// The purchased term decides access when Razorpay reports no billing period.
const paidFrom = new Date("2026-08-14T00:00:00.000Z");
assert.equal(
  addInterval(paidFrom, "yearly", 1).toISOString(),
  "2027-08-14T00:00:00.000Z"
);
assert.equal(
  addInterval(paidFrom, "monthly", 3).toISOString(),
  "2026-11-14T00:00:00.000Z"
);
assert.equal(
  addInterval(paidFrom, undefined, 0).toISOString(),
  "2027-08-14T00:00:00.000Z"
);

const annualPlan = { amountMinor: 699900, currency: "INR" };
assert.equal(
  paymentUnlocksMembership(
    { status: "captured", amount: 699900, currency: "INR" },
    annualPlan
  ),
  true
);
assert.equal(
  paymentUnlocksMembership(
    { status: "authorized", amount: 699900, currency: "INR" },
    annualPlan
  ),
  false
);
assert.equal(
  paymentUnlocksMembership(
    { status: "captured", amount: 100, currency: "INR" },
    annualPlan
  ),
  false
);
assert.equal(
  paymentUnlocksMembership(
    { status: "captured", amount: 699900, currency: "USD" },
    annualPlan
  ),
  false
);
assert.equal(
  paymentUnlocksMembership(
    { status: "captured", amount: 699900, currency: "INR", refund_status: "full" },
    annualPlan
  ),
  false
);
assert.equal(keepPaidStatus("active", "authenticated"), "active");
assert.equal(keepPaidStatus("completed", "created"), "completed");
assert.equal(keepPaidStatus("authenticated", "active"), "active");
assert.equal(keepPaidStatus("created", "authenticated"), "authenticated");

process.stdout.write("Razorpay subscription signature/status checks passed\n");
