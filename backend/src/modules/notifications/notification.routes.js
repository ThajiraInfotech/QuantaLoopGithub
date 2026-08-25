const express = require("express");

const { authenticate } = require("../../middleware/auth");
const {
  unreadCount,
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  streamNotifications,
} = require("./notification.controller");

function createNotificationsRouter(env) {
  const router = express.Router();
  const requireAuth = authenticate({ jwtSecret: env.JWT_SECRET });

  router.get("/stream", requireAuth, streamNotifications);
  router.get("/unread-count", requireAuth, unreadCount);
  router.get("/", requireAuth, listNotifications);
  router.patch("/read-all", requireAuth, markAllNotificationsRead);
  router.patch("/:id/read", requireAuth, markNotificationRead);

  return router;
}

module.exports = { createNotificationsRouter };
