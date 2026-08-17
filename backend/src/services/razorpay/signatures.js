const crypto = require("crypto");

function toUtf8Buffer(value) {
  return Buffer.from(String(value ?? ""), "utf8");
}

function timingSafeEqualString(left, right) {
  const a = toUtf8Buffer(left);
  const b = toUtf8Buffer(right);
  if (a.length !== b.length) {
    if (a.length > 0) {
      crypto.timingSafeEqual(a, a);
    }
    return false;
  }
  return crypto.timingSafeEqual(a, b);
}

function hmacSha256Hex(secret, payload) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function checkoutSignaturePayload(paymentId, subscriptionId) {
  return `${paymentId}|${subscriptionId}`;
}

function verifyCheckoutSignature({
  paymentId,
  subscriptionId,
  signature,
  secret,
}) {
  if (!paymentId || !subscriptionId || !signature || !secret) {
    return false;
  }
  const expected = hmacSha256Hex(
    secret,
    checkoutSignaturePayload(paymentId, subscriptionId)
  );
  return timingSafeEqualString(expected, signature);
}

function verifyWebhookSignature({ rawBody, signature, secret }) {
  if (!rawBody || !signature || !secret) {
    return false;
  }
  const body =
    Buffer.isBuffer(rawBody) || rawBody instanceof Uint8Array
      ? rawBody
      : toUtf8Buffer(rawBody);
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return timingSafeEqualString(expected, signature);
}

const STATUS_RANK = Object.freeze({
  created: 0,
  authenticated: 1,
  pending: 2,
  halted: 3,
  paused: 3,
  active: 4,
  completed: 5,
  cancelled: 5,
  expired: 5,
});

function isTerminalStatus(status) {
  return ["cancelled", "completed", "expired"].includes(status);
}

function isOpenStatus(status) {
  return ["created", "authenticated", "active", "pending", "halted", "paused"].includes(
    status
  );
}

function canReuseCheckout(status) {
  return status === "created";
}

function shouldApplyRemoteStatus(currentStatus, nextStatus) {
  if (!nextStatus) return false;
  if (!currentStatus) return true;
  if (currentStatus === nextStatus) return true;
  if (isTerminalStatus(currentStatus) && !isTerminalStatus(nextStatus)) {
    return false;
  }
  return (STATUS_RANK[nextStatus] ?? 0) >= (STATUS_RANK[currentStatus] ?? 0);
}

function unixToDate(value) {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return new Date(n * 1000);
}

module.exports = {
  hmacSha256Hex,
  checkoutSignaturePayload,
  verifyCheckoutSignature,
  verifyWebhookSignature,
  timingSafeEqualString,
  isTerminalStatus,
  isOpenStatus,
  canReuseCheckout,
  shouldApplyRemoteStatus,
  unixToDate,
  STATUS_RANK,
};
