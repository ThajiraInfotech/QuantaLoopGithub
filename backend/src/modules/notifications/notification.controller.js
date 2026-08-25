const mongoose = require("mongoose");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  enrichNotificationsWithContext,
  countActionableUnread,
} = require("./notification-enrichment");
const {
  markAllReadForUser,
  getNotificationFeedForUser,
  emitRecipientSync,
} = require("./notification.service");
const { Notification, toPublicNotification } = require("./notification.model");
const {
  subscribe,
  unsubscribe,
  writeSse,
} = require("./notification-stream.service");

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
  const feed = await getNotificationFeedForUser(req.user.id);
  sendSuccess(res, feed, "Notifications retrieved");
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

  void emitRecipientSync(req.user.id);

  sendSuccess(res, { notification: toPublicNotification(doc) }, "Marked read");
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  const modifiedCount = await markAllReadForUser(req.user.id);
  sendSuccess(res, { modifiedCount, unreadCount: 0 }, "All notifications marked read");
});

const streamNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();

  subscribe(userId, res);

  const feed = await getNotificationFeedForUser(userId);
  writeSse(res, "sync", {
    unreadCount: feed.unreadCount,
    items: feed.items.slice(0, 25),
    at: new Date().toISOString(),
  });

  const heartbeat = setInterval(() => {
    writeSse(res, "ping", { at: new Date().toISOString() });
  }, 25000);

  const cleanup = () => {
    clearInterval(heartbeat);
    unsubscribe(userId, res);
    if (!res.writableEnded) {
      res.end();
    }
  };

  req.on("close", cleanup);
  req.on("aborted", cleanup);
  res.on("close", cleanup);
});

module.exports = {
  unreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications,
};
