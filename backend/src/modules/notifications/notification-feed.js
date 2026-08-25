const {
  enrichNotificationsWithContext,
  countActionableUnread,
} = require("./notification-enrichment");
const { Notification, toPublicNotification } = require("./notification.model");

async function getNotificationFeedForUser(userId, { limit = 150 } = {}) {
  const docs = await Notification.find({ recipient: userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .exec();

  let items = docs.map((d) => toPublicNotification(d));
  items = await enrichNotificationsWithContext(items);
  const unreadCount = countActionableUnread(items);

  return { items, unreadCount };
}

module.exports = { getNotificationFeedForUser };
