/** Normalize stored status to trust-signal display: verified | unverified only. */
function normalizeVerificationStatus(status) {
  return status === "verified" ? "verified" : "unverified";
}

module.exports = { normalizeVerificationStatus };
