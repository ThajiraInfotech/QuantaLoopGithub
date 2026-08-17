const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  enrichNotificationsWithContext,
  countActionableUnread,
} = require("./notification-enrichment");
const { markAllReadForUser } = require("./notification.service");
const { Notification, toPublicNotification } = require("./notification.model");

const unreadCount = asyncHandler(async (req, res) => {
  const docs = await Notification.find({
    recipient: req.user.id,
    isRead: false,
  })
    .sort({ updatedAt: -1 })
    .limit(200)
    .exec();
  let items = docs.map((d) => toPublicNotification(d));
  items = await enrichNotificationsWithContext(items);
  const count = countActionableUnread(items);
  sendSuccess(res, { unreadCount: count }, "");
});

const listNotifications = asyncHandler(async (req, res) => {
  const docs = await Notification.find({ recipient: req.user.id })
    .sort({ updatedAt: -1 })
    .limit(150)
    .exec();
  let items = docs.map((d) => toPublicNotification(d));
  items = await enrichNotificationsWithContext(items);
  const unreadCount = countActionableUnread(items);

  sendSuccess(res, { items, unreadCount }, "Notifications retrieved");
});

const markNotificationRead = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    next(new AppError("Invalid notification id", 400, "INVALID_ID"));
    return;
  }

  const doc = await Notification.findById(id);
  if (!doc) {
    next(new AppError("Notification not found", 404, "NOT_FOUND"));
    return;
  }

  if (doc.recipient.toString() !== req.user.id) {
    next(new AppError("Forbidden", 403, "FORBIDDEN"));
    return;
  }

  doc.isRead = true;
  await doc.save();

  sendSuccess(res, { notification: toPublicNotification(doc) }, "Marked read");
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const modifiedCount = await markAllReadForUser(req.user.id);
  sendSuccess(res, { modifiedCount, unreadCount: 0 }, "All notifications marked read");
});

module.exports = {
  unreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
};
