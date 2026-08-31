const { Notification, toPublicNotification } = require("./notification.model");
const { User } = require("../users/user.model");
const { newDiscussionMessage } = require("../../utils/notificationCopy");
const { sendNotificationEmail } = require("../../services/email/email.service");
const { buildNotificationActionUrl } = require("../../utils/notificationEmailLinks");
const { getNotificationFeedForUser } = require("./notification-feed");
const {
  publishNotificationSync,
} = require("./notification-stream.service");
const { dispatchWebPush } = require("./push-notification.service");

/** @type {import("../../config/env").loadEnv extends () => infer E ? E : never | null} */
let runtimeEnv = null;

function configureNotificationEmails(env) {
  runtimeEnv = env;
}

async function emitRecipientSync(recipientId) {
  try {
    const feed = await getNotificationFeedForUser(recipientId);
    publishNotificationSync(recipientId, feed);
  } catch (err) {
    process.stderr.write(
      `[notification-stream] sync failed: ${err.message}\n`
    );
  }
}

function recipientCanReceiveEmail(user) {
  if (!user?.email?.trim()) return false;
  if (user.accountStatus === "suspended") return false;
  const googleVerified =
    user.authProvider === "google" || Boolean(user.googleEmailVerified);
  return googleVerified || user.emailVerified === true;
}

async function dispatchNotificationEmail(doc, emailExtras = {}) {
  if (!runtimeEnv) return;

  // In-app only — no email automation for introduction requests
  if (doc.type === "introduction_request") return;

  const recipientId = doc.recipient?.toString?.() ?? String(doc.recipient);
  const user = await User.findById(recipientId)
    .select(
      "email emailVerified googleEmailVerified authProvider accountStatus name companyName"
    )
    .lean();

  if (!recipientCanReceiveEmail(user)) return;

  const notification = toPublicNotification(doc);
  const actionUrl = buildNotificationActionUrl(runtimeEnv, notification);

  sendNotificationEmail(runtimeEnv, {
    to: user.email,
    recipientName: user.companyName || user.name,
    title: notification.title,
    message: notification.message,
    actionUrl,
    matchScore: emailExtras.matchScore,
    matchLabel: emailExtras.matchLabel,
  }).catch((err) => {
    process.stderr.write(
      `[notification-email] failed for ${user.email}: ${err.message}\n`
    );
  });
}

/**
 * @param {object} payload
 * @param {import('mongoose').Types.ObjectId|string} payload.recipient
 * @param {string} payload.type
 * @param {string} payload.title
 * @param {string} payload.message
 * @param {import('mongoose').Types.ObjectId|string|null} [payload.relatedMaterial]
 * @param {import('mongoose').Types.ObjectId|string|null} [payload.relatedInterest]
 * @param {{ matchScore?: number, matchLabel?: string }} [payload.emailExtras]
 */
async function createNotification(payload) {
  const doc = await Notification.create({
    recipient: payload.recipient,
    type: payload.type,
    title: payload.title,
    message: payload.message,
    relatedMaterial: payload.relatedMaterial ?? null,
    relatedInterest: payload.relatedInterest ?? null,
  });

  void dispatchNotificationEmail(doc, payload.emailExtras ?? {});
  void dispatchWebPush(doc);
  void emitRecipientSync(payload.recipient);
  return doc;
}

/**
 * One unread message notification per interest thread (avoids inbox spam).
 */
async function upsertMessageNotification({
  recipient,
  senderCompany,
  relatedMaterial,
  relatedInterest,
}) {
  const { title, message } = newDiscussionMessage({
    senderCompany,
  });

  const existing = await Notification.findOne({
    recipient,
    type: "coordination_follow_up",
    relatedInterest,
    isRead: false,
  });

  if (existing) {
    existing.title = title;
    existing.message = message;
    existing.createdAt = new Date();
    await existing.save();
    void dispatchNotificationEmail(existing);
    void dispatchWebPush(existing);
    void emitRecipientSync(recipient);
    return existing;
  }

  return createNotification({
    recipient,
    type: "coordination_follow_up",
    title,
    message,
    relatedMaterial: relatedMaterial ?? null,
    relatedInterest: relatedInterest ?? null,
  });
}

async function markAllReadForUser(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true } }
  );
  void emitRecipientSync(userId);
  return result.modifiedCount ?? 0;
}

module.exports = {
  configureNotificationEmails,
  createNotification,
  upsertMessageNotification,
  markAllReadForUser,
  getNotificationFeedForUser,
  emitRecipientSync,
};
