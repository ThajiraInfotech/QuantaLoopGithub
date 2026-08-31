const { z } = require("zod");

const { sendSuccess } = require("../../utils/apiResponse");
const { AppError } = require("../../utils/AppError");
const { asyncHandler } = require("../../utils/asyncHandler");
const {
  countPushSubscriptionsForUser,
  getVapidPublicKey,
  isWebPushEnabled,
  removePushSubscription,
  savePushSubscription,
} = require("./push-notification.service");

const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

const pushUnsubscribeSchema = z.object({
  endpoint: z.string().url(),
});

const getPushConfig = asyncHandler(async (req, res) => {
  const publicKey = getVapidPublicKey();
  const enabled = isWebPushEnabled() && Boolean(publicKey);

  if (!enabled) {
    sendSuccess(res, { enabled: false, publicKey: null, subscribed: false }, "");
    return;
  }

  const count = await countPushSubscriptionsForUser(req.user.id);
  sendSuccess(
    res,
    { enabled: true, publicKey, subscribed: count > 0 },
    ""
  );
});

const subscribePush = asyncHandler(async (req, res, next) => {
  if (!isWebPushEnabled()) {
    next(
      new AppError(
        "Push notifications are not configured",
        503,
        "PUSH_DISABLED"
      )
    );
    return;
  }

  const parsed = pushSubscriptionSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new AppError("Invalid push subscription", 400, "INVALID_BODY"));
    return;
  }

  await savePushSubscription(
    req.user.id,
    parsed.data,
    String(req.headers["user-agent"] || "")
  );

  sendSuccess(res, { subscribed: true }, "Subscribed to push notifications");
});

const unsubscribePush = asyncHandler(async (req, res, next) => {
  const parsed = pushUnsubscribeSchema.safeParse(req.body);
  if (!parsed.success) {
    next(new AppError("Invalid request", 400, "INVALID_BODY"));
    return;
  }

  await removePushSubscription(req.user.id, parsed.data.endpoint);
  sendSuccess(res, { subscribed: false }, "Unsubscribed from push notifications");
});

module.exports = {
  getPushConfig,
  subscribePush,
  unsubscribePush,
};
