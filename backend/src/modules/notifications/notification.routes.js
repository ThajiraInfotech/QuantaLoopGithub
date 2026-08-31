const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  unreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications,
} = require("./notification.controller");
const {
  getPushConfig,
  subscribePush,
  unsubscribePush,
} = require("./push-notification.controller");

function createNotificationsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/stream", requireAuth, streamNotifications);
  router.get("/push/config", requireAuth, getPushConfig);
  router.post("/push/subscribe", requireAuth, subscribePush);
  router.delete("/push/unsubscribe", requireAuth, unsubscribePush);
  router.get("/unread-count", requireAuth, unreadCount);
  router.get("/", requireAuth, listNotifications);
  router.patch("/read-all", requireAuth, markAllNotificationsRead);
  router.patch("/:id/read", requireAuth, markNotificationRead);

  return router;
}

module.exports = { createNotificationsRouter };
