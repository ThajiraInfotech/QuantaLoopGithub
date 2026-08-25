/**
 * Deep links for notification emails (mirrors frontend bell navigation).
 */
function buildNotificationActionUrl(env, notification) {
  const base = String(env.CLIENT_ORIGIN || "").replace(/\/$/, "");
  if (!base) return "/dashboard";

  if (notification.relatedInterestId) {
    return `${base}/dashboard/interests?open=${encodeURIComponent(notification.relatedInterestId)}`;
  }
  if (notification.relatedMaterialId) {
    return `${base}/dashboard/materials/${notification.relatedMaterialId}`;
  }
  return `${base}/dashboard`;
}

module.exports = { buildNotificationActionUrl };
