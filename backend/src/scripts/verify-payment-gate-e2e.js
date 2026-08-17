/**
 * E2E verification for the server-side payment boundary.
 * Starts the real Express app on an ephemeral port and uses temporary records.
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");

const { createApp } = require("../app");
const { signAccessToken } = require("../utils/jwt");
const { Subscription } = require("../modules/subscriptions/subscription.model");
const { User } = require("../modules/users/user.model");
const {
  connectSeedDatabase,
  disconnectSeedDatabase,
} = require("./utils/db");

const RUN_ID = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const PROTECTED_ROOTS = [
  "network",
  "materials",
  "interests",
  "conversations",
  "messages",
  "saved-materials",
  "reports",
  "opportunities",
  "recommendations",
  "reminders",
  "insights",
  "activity-signals",
  "activity",
  "notifications",
  "matches",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function tokenFor(user, env, overrides = {}) {
  return signAccessToken(
    {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
      ...overrides,
    },
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN
  );
}

async function request(baseUrl, path, token, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
}

function errorCode(result) {
  return result.body?.error?.code;
}

async function createTestUser(overrides = {}) {
  return User.create({
    name: "Payment Gate Test",
    companyName: `Gate Test ${RUN_ID}`,
    email: `payment-gate-${RUN_ID}-${Math.random()
      .toString(36)
      .slice(2, 7)}@test.local`,
    password: await bcrypt.hash("FlowTest123!", 4),
    role: "material_provider",
    emailVerified: true,
    authProvider: "local",
    hasLocalPassword: true,
    materialTypes: ["Plastic"],
    preferredMaterialCategories: ["Plastic"],
    country: "IN",
    state: "Tamil Nadu",
    location: "Chennai",
    ...overrides,
  });
}

async function main() {
  const env = await connectSeedDatabase();
  const users = [];
  let server;

  try {
    server = createApp({ ...env, NODE_ENV: "test" }).listen(0);
    await new Promise((resolve, reject) => {
      server.once("listening", resolve);
      server.once("error", reject);
    });
    const { port } = server.address();
    const baseUrl = `http://127.0.0.1:${port}/api/v1`;

    const unpaid = await createTestUser();
    const unverified = await createTestUser({ emailVerified: false });
    const incomplete = await createTestUser({
      materialTypes: [],
      preferredMaterialCategories: [],
      state: "",
      location: "",
    });
    const paid = await createTestUser();
    const expired = await createTestUser();
    const admin = await createTestUser({ role: "admin" });
    users.push(unpaid, unverified, incomplete, paid, expired, admin);

    const now = new Date();
    await Subscription.create([
      {
        user: paid._id,
        catalogPlanId: "annual_access",
        razorpayPlanId: "plan_e2e_paid",
        razorpaySubscriptionId: `sub_e2e_paid_${RUN_ID}`,
        idempotencyKey: `paid-${RUN_ID}`,
        checkoutState: "ready",
        status: "completed",
        currentStartAt: now,
        currentEndAt: new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000),
      },
      {
        user: expired._id,
        catalogPlanId: "annual_access",
        razorpayPlanId: "plan_e2e_expired",
        razorpaySubscriptionId: `sub_e2e_expired_${RUN_ID}`,
        idempotencyKey: `expired-${RUN_ID}`,
        checkoutState: "ready",
        status: "completed",
        currentStartAt: new Date(now.getTime() - 366 * 24 * 60 * 60 * 1000),
        currentEndAt: new Date(now.getTime() - 24 * 60 * 60 * 1000),
      },
    ]);

    const noToken = await request(
      baseUrl,
      "/network/__payment_gate_probe__"
    );
    assert(noToken.status === 401, `guest expected 401, got ${noToken.status}`);

    const unpaidToken = tokenFor(unpaid, env);
    for (const root of PROTECTED_ROOTS) {
      const denied = await request(
        baseUrl,
        `/${root}/__payment_gate_probe__`,
        unpaidToken
      );
      assert(
        denied.status === 403 &&
          errorCode(denied) === "SUBSCRIPTION_REQUIRED",
        `unpaid /${root} expected SUBSCRIPTION_REQUIRED, got ${denied.status} ${errorCode(
          denied
        )}`
      );
    }

    // A token claiming admin must not override the user's current DB role.
    const staleRole = await request(
      baseUrl,
      "/network/__payment_gate_probe__",
      tokenFor(unpaid, env, { role: "admin" })
    );
    assert(
      staleRole.status === 403 &&
        errorCode(staleRole) === "SUBSCRIPTION_REQUIRED",
      "database role must override stale token role"
    );

    const checkoutBody = JSON.stringify({ planCode: "annual_access" });
    const otpBlocked = await request(
      baseUrl,
      "/subscriptions/checkout",
      tokenFor(unverified, env),
      { method: "POST", body: checkoutBody }
    );
    assert(
      otpBlocked.status === 403 &&
        errorCode(otpBlocked) === "EMAIL_VERIFICATION_REQUIRED",
      `unverified checkout expected EMAIL_VERIFICATION_REQUIRED, got ${otpBlocked.status} ${errorCode(
        otpBlocked
      )}`
    );

    const onboardingBlocked = await request(
      baseUrl,
      "/subscriptions/checkout",
      tokenFor(incomplete, env),
      { method: "POST", body: checkoutBody }
    );
    assert(
      onboardingBlocked.status === 403 &&
        errorCode(onboardingBlocked) === "ONBOARDING_REQUIRED",
      `incomplete checkout expected ONBOARDING_REQUIRED, got ${onboardingBlocked.status} ${errorCode(
        onboardingBlocked
      )}`
    );

    for (const root of PROTECTED_ROOTS) {
      const allowed = await request(
        baseUrl,
        `/${root}/__payment_gate_probe__`,
        tokenFor(paid, env)
      );
      assert(
        allowed.status !== 401 &&
          errorCode(allowed) !== "SUBSCRIPTION_REQUIRED",
        `paid /${root} should pass payment gate, got ${allowed.status} ${errorCode(
          allowed
        )}`
      );
    }

    const expiredDenied = await request(
      baseUrl,
      "/network/__payment_gate_probe__",
      tokenFor(expired, env)
    );
    assert(
      expiredDenied.status === 403 &&
        errorCode(expiredDenied) === "SUBSCRIPTION_REQUIRED",
      "expired membership must be denied"
    );

    // Abandoning an unpaid signup removes the account so signup starts over.
    const discardable = await createTestUser();
    users.push(discardable);
    const discarded = await request(
      baseUrl,
      "/auth/signup",
      tokenFor(discardable, env),
      { method: "DELETE" }
    );
    assert(
      discarded.status === 200,
      `unpaid signup discard expected 200, got ${discarded.status}`
    );
    assert(
      (await User.findById(discardable._id).lean()) === null,
      "discarded signup must remove the user record"
    );

    // A member who paid must never lose the account through that path.
    const paidDiscard = await request(
      baseUrl,
      "/auth/signup",
      tokenFor(paid, env),
      { method: "DELETE" }
    );
    assert(
      paidDiscard.status === 409 &&
        errorCode(paidDiscard) === "SUBSCRIPTION_ALREADY_PAID",
      `paid discard expected SUBSCRIPTION_ALREADY_PAID, got ${paidDiscard.status} ${errorCode(
        paidDiscard
      )}`
    );
    assert(
      (await User.findById(paid._id).lean()) !== null,
      "paid member must survive a discard attempt"
    );

    const adminDiscard = await request(
      baseUrl,
      "/auth/signup",
      tokenFor(admin, env),
      { method: "DELETE" }
    );
    assert(
      adminDiscard.status === 403 && errorCode(adminDiscard) === "ADMIN_ACCOUNT",
      `admin discard expected ADMIN_ACCOUNT, got ${adminDiscard.status} ${errorCode(
        adminDiscard
      )}`
    );

    const guestDiscard = await request(baseUrl, "/auth/signup", null, {
      method: "DELETE",
    });
    assert(
      guestDiscard.status === 401,
      `guest discard expected 401, got ${guestDiscard.status}`
    );

    const adminAllowed = await request(
      baseUrl,
      "/network/__payment_gate_probe__",
      tokenFor(admin, env)
    );
    assert(
      adminAllowed.status !== 401 &&
        errorCode(adminAllowed) !== "SUBSCRIPTION_REQUIRED",
      `admin should bypass payment gate, got ${adminAllowed.status} ${errorCode(
        adminAllowed
      )}`
    );

    process.stdout.write(
      `Payment gate E2E passed: ${PROTECTED_ROOTS.length} platform route groups protected, unpaid signup discard verified\n`
    );
  } finally {
    const userIds = users.map((user) => user._id);
    if (userIds.length) {
      await Subscription.deleteMany({ user: { $in: userIds } });
      await User.deleteMany({ _id: { $in: userIds } });
    }
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await disconnectSeedDatabase();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
