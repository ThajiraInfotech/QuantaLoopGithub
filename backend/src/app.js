const path = require("path");

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const errorHandler = require("./middleware/errorHandler");
const notFound = require("./middleware/notFound");
const { authenticate } = require("./middleware/auth");
const {
  requireActiveSubscription,
} = require("./middleware/requireActiveSubscription");
const {
  requireCompletedOnboarding,
} = require("./middleware/requireCompletedOnboarding");
const { createAccessRouter } = require("./modules/access/access.routes");
const { createActivityRouter } = require("./modules/activity/activity.routes");
const { createAuthRouter } = require("./modules/auth/auth.routes");
const { createConversationsRouter } = require("./modules/conversations/conversation.routes");
const { createInterestsRouter } = require("./modules/interests/interest.routes");
const { createMatchesRouter } = require("./modules/matches/match.routes");
const { createMaterialsRouter } = require("./modules/materials/material.routes");
const { createMessagesRouter } = require("./modules/messages/message.routes");
const { createNetworkRouter } = require("./modules/network/network.routes");
const { createNotificationsRouter } = require("./modules/notifications/notification.routes");
const { createOpportunitiesRouter } = require("./modules/opportunities/opportunity.routes");
const { createRecommendationsRouter } = require("./modules/recommendations/recommendation.routes");
const { createRemindersRouter } = require("./modules/reminders/reminder.routes");
const { createActivitySignalsRouter } = require("./modules/activity-signals/activity-signals.routes");
const { createInsightsRouter } = require("./modules/activity-signals/insights.routes");
const { createProfileRouter } = require("./modules/profiles/profile.routes");
const { createReportsRouter } = require("./modules/reports/report.routes");
const { createSavedMaterialsRouter } = require("./modules/saved-materials/saved-material.routes");
const { createAdminRouter } = require("./modules/admin/admin.routes");
const { createVerificationRouter } = require("./modules/verification/verification.routes");
const { createLocationsRouter } = require("./modules/locations/location.routes");
const {
  createSubscriptionsRouter,
  createSubscriptionWebhookRouter,
} = require("./modules/subscriptions/subscription.routes");
const { createBillingRouter } = require("./modules/billing/billing.routes");
const { createSupportRouter } = require("./modules/support/support.routes");
const { LOCAL_UPLOAD_DIR } = require("./services/storage/material-image.service");
const {
  configureNotificationEmails,
} = require("./modules/notifications/notification.service");
const { sendInvoiceEmail } = require("./services/email/email.service");

function isPrivateLanHostname(hostname) {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]" ||
    /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(hostname)
  );
}

function isAllowedCorsOrigin(origin, env) {
  if (!origin) return true;
  if (origin === env.CLIENT_ORIGIN) return true;
  if (env.NODE_ENV === "production") return false;
  try {
    return isPrivateLanHostname(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function createApp(env) {
  const app = express();
  configureNotificationEmails(env);
  const requirePaidAccess = [
    authenticate({ jwtSecret: env.JWT_SECRET }),
    requireCompletedOnboarding,
    requireActiveSubscription,
  ];
  app.locals.env = env;
  app.disable("x-powered-by");
  // Behind Nginx on VPS so rate-limit / logs see real client IPs
  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  // Keep API / backend responses out of search indexes
  app.use((req, res, next) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive, nosnippet");
    next();
  });
  if (env.NODE_ENV !== "test") {
    app.use(morgan("combined"));
  }
  app.use(
    cors({
      origin(origin, callback) {
        callback(null, isAllowedCorsOrigin(origin, env));
      },
      credentials: true,
    })
  );
  app.use(
    "/api/v1/subscriptions/webhook",
    express.raw({ type: "application/json", limit: "256kb" }),
    createSubscriptionWebhookRouter(env)
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());
  app.use(
    "/uploads/materials",
    express.static(path.join(LOCAL_UPLOAD_DIR), {
      maxAge: env.NODE_ENV === "production" ? "7d" : 0,
      setHeaders(res) {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        res.setHeader("Access-Control-Allow-Origin", env.CLIENT_ORIGIN);
      },
    })
  );

  app.get("/", (req, res) => {
    res.type("text/plain").send("Quanta Loop Backend Running");
  });

  app.use("/api/v1/auth", createAuthRouter(env));
  app.use("/api/v1/profile", createProfileRouter(env));
  app.use("/api/v1/admin", createAdminRouter(env));
  app.use("/api/v1/verification", createVerificationRouter(env));
  app.use("/api/v1/access", createAccessRouter(env));
  app.use("/api/v1/subscriptions", createSubscriptionsRouter(env));
  app.use(
    "/api/v1/billing",
    createBillingRouter(env, {
      emailService: {
        sendInvoiceEmail: (payload) => sendInvoiceEmail(env, payload),
      },
    })
  );
  app.use("/api/v1/network", ...requirePaidAccess, createNetworkRouter(env));
  app.use("/api/v1/materials", ...requirePaidAccess, createMaterialsRouter(env));
  app.use("/api/v1/interests", ...requirePaidAccess, createInterestsRouter(env));
  app.use(
    "/api/v1/conversations",
    ...requirePaidAccess,
    createConversationsRouter(env)
  );
  app.use("/api/v1/messages", ...requirePaidAccess, createMessagesRouter(env));
  app.use(
    "/api/v1/saved-materials",
    ...requirePaidAccess,
    createSavedMaterialsRouter(env)
  );
  app.use("/api/v1/reports", ...requirePaidAccess, createReportsRouter(env));
  app.use(
    "/api/v1/opportunities",
    ...requirePaidAccess,
    createOpportunitiesRouter(env)
  );
  app.use(
    "/api/v1/recommendations",
    ...requirePaidAccess,
    createRecommendationsRouter(env)
  );
  app.use("/api/v1/reminders", ...requirePaidAccess, createRemindersRouter(env));
  app.use("/api/v1/insights", ...requirePaidAccess, createInsightsRouter(env));
  app.use(
    "/api/v1/activity-signals",
    ...requirePaidAccess,
    createActivitySignalsRouter(env)
  );
  app.use("/api/v1/activity", ...requirePaidAccess, createActivityRouter(env));
  app.use(
    "/api/v1/notifications",
    ...requirePaidAccess,
    createNotificationsRouter(env)
  );
  app.use("/api/v1/matches", ...requirePaidAccess, createMatchesRouter(env));
  app.use("/api/v1/locations", createLocationsRouter(env));
  app.use("/api/v1/support", createSupportRouter(env));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
