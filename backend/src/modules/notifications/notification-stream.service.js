/** @typedef {import("express").Response} ExpressResponse */

/** @type {Map<string, Set<ExpressResponse>>} */
const subscribersByUser = new Map();

function subscribe(userId, res) {
  const key = String(userId);
  if (!subscribersByUser.has(key)) {
    subscribersByUser.set(key, new Set());
  }
  subscribersByUser.get(key).add(res);
}

function unsubscribe(userId, res) {
  const key = String(userId);
  const set = subscribersByUser.get(key);
  if (!set) return;
  set.delete(res);
  if (set.size === 0) subscribersByUser.delete(key);
}

function writeSse(res, event, payload) {
  if (res.writableEnded || res.destroyed) return false;
  try {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
    return true;
  } catch {
    return false;
  }
}

function publishToUser(userId, event, payload) {
  const set = subscribersByUser.get(String(userId));
  if (!set?.size) return;

  for (const res of [...set]) {
    const ok = writeSse(res, event, payload);
    if (!ok) {
      set.delete(res);
    }
  }
}

function publishNotificationSync(userId, feed) {
  publishToUser(userId, "sync", {
    unreadCount: feed.unreadCount,
    items: feed.items.slice(0, 25),
    at: new Date().toISOString(),
  });
}

function getActiveSubscriberCount(userId) {
  return subscribersByUser.get(String(userId))?.size ?? 0;
}

module.exports = {
  subscribe,
  unsubscribe,
  publishNotificationSync,
  getActiveSubscriberCount,
  writeSse,
};
