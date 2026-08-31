const webpush = require("web-push");

const { buildNotificationActionUrl } = require("../../utils/notificationEmailLinks");
const { toPublicNotification } = require("./notification.model");
const { PushSubscription } = require("./push-subscription.model");

/** @type {import("../../config/env").loadEnv extends () => infer E ? E : never | null} */
let runtimeEnv = null;
let vapidConfigured = false;

function configureWebPush(env) {
  runtimeEnv = env;
  if (env.VAPID_PUBLIC_KEY?.trim() && env.VAPID_PRIVATE_KEY?.trim()) {
    webpush.setVapidDetails(
      env.VAPID_SUBJECT || "mailto:support@quantaloop.com",
      env.VAPID_PUBLIC_KEY,
      env.VAPID_PRIVATE_KEY
    );
    vapidConfigured = true;
  }
}

function isWebPushEnabled() {
  return vapidConfigured;
}

function getVapidPublicKey() {
  return runtimeEnv?.VAPID_PUBLIC_KEY?.trim() ?? null;
}

async function savePushSubscription(userId, subscription, userAgent = "") {
  const { endpoint, keys } = subscription;
  await PushSubscription.findOneAndUpdate(
    { endpoint },
    {
      user: userId,
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
      userAgent,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

async function removePushSubscription(userId, endpoint) {
  await PushSubscription.deleteOne({ user: userId, endpoint });
}

async function countPushSubscriptionsForUser(userId) {
  return PushSubscription.countDocuments({ user: userId });
}

async function dispatchWebPush(doc) {
  if (!vapidConfigured || !runtimeEnv) return;

  // In-app only — no push for introduction requests (matches email behavior)
  if (doc.type === "introduction_request") return;

  const recipientId = doc.recipient?.toString?.() ?? String(doc.recipient);
  const subs = await PushSubscription.find({ user: recipientId }).lean();
  if (!subs.length) return;

  const notification = toPublicNotification(doc);
  const url = buildNotificationActionUrl(runtimeEnv, notification);
  const payload = JSON.stringify({
    title: notification.title,
    body: notification.message,
    icon: "/icon.png",
    badge: "/icon.png",
    tag: notification.id,
    data: { url, notificationId: notification.id },
  });

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        payload
      )
    )
  );

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    if (result.status === "rejected") {
      const statusCode = result.reason?.statusCode;
      if (statusCode === 404 || statusCode === 410) {
        await PushSubscription.deleteOne({ _id: subs[i]._id });
      } else {
        process.stderr.write(
          `[web-push] failed for user ${recipientId}: ${result.reason?.message ?? "unknown"}\n`
        );
      }
    }
  }
}

module.exports = {
  configureWebPush,
  isWebPushEnabled,
  getVapidPublicKey,
  savePushSubscription,
  removePushSubscription,
  countPushSubscriptionsForUser,
  dispatchWebPush,
};
