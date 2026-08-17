const { Notification } = require("./notification.model");
const { newDiscussionMessage } = require("../../utils/notificationCopy");

/**
 * @param {object} payload
 * @param {import('mongoose').Types.ObjectId|string} payload.recipient
 * @param {string} payload.type
 * @param {string} payload.title
 * @param {string} payload.message
 * @param {import('mongoose').Types.ObjectId|string|null} [payload.relatedMaterial]
 * @param {import('mongoose').Types.ObjectId|string|null} [payload.relatedInterest]
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
  return result.modifiedCount ?? 0;
}

module.exports = {
  createNotification,
  upsertMessageNotification,
  markAllReadForUser,
};
