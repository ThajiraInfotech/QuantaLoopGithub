const assert = require("node:assert/strict");

const {
  accessStateFromSubscription,
  getSubscriptionAccessState,
} = require("../modules/subscriptions/subscription-access.service");
const {
  createRequireActiveSubscription,
} = require("../middleware/requireActiveSubscription");
const {
  requireCompletedOnboarding,
} = require("../middleware/requireCompletedOnboarding");

const now = new Date("2026-08-14T00:00:00.000Z");
const future = new Date("2027-08-14T00:00:00.000Z");
const past = new Date("2025-08-14T00:00:00.000Z");

function subscription(overrides = {}) {
  return {
    catalogPlanId: "annual_access",
    status: "active",
    currentEndAt: future,
    cancelAtCycleEnd: false,
    ...overrides,
  };
}

function queryReturning(value) {
  return {
    sort() {
      return this;
    },
    async lean() {
      return value;
    },
  };
}

async function runMiddleware(middleware, req) {
  return new Promise((resolve, reject) => {
    middleware(req, {}, (error) => {
      if (error && error.code !== "SUBSCRIPTION_REQUIRED") reject(error);
      else resolve(error || null);
    });
  });
}

async function runAnyMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (error) => resolve(error || null));
  });
}

function completedAccount(overrides = {}) {
  return {
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
  };
}

async function main() {
  const active = accessStateFromSubscription({
    role: "material_provider",
    subscription: subscription(),
    now,
  });
  assert.equal(active.entitled, true);
  assert.equal(active.reason, "ACTIVE_SUBSCRIPTION");
  assert.equal(active.plan, "annual_access");

  const ending = accessStateFromSubscription({
    role: "verified_buyer",
    subscription: subscription({ cancelAtCycleEnd: true }),
    now,
  });
  assert.equal(ending.entitled, true);

  // One annual charge settles the whole term, so Razorpay reports "completed".
  const completed = accessStateFromSubscription({
    role: "verified_buyer",
    subscription: subscription({ status: "completed" }),
    now,
  });
  assert.equal(completed.entitled, true);
  assert.equal(completed.reason, "ACTIVE_SUBSCRIPTION");

  const completedTermOver = accessStateFromSubscription({
    role: "verified_buyer",
    subscription: subscription({ status: "completed", currentEndAt: past }),
    now,
  });
  assert.equal(completedTermOver.entitled, false);
  assert.equal(completedTermOver.reason, "SUBSCRIPTION_EXPIRED");

  const cancelled = accessStateFromSubscription({
    role: "verified_buyer",
    subscription: subscription({ status: "cancelled" }),
    now,
  });
  assert.equal(cancelled.entitled, false);

  // Renewal notice window: members are warned 10 days out, not earlier.
  const endsInTenDays = accessStateFromSubscription({
    role: "material_provider",
    subscription: subscription({
      currentEndAt: new Date("2026-08-24T00:00:00.000Z"),
    }),
    now,
  });
  assert.equal(endsInTenDays.entitled, true);
  assert.equal(endsInTenDays.daysRemaining, 10);
  assert.equal(endsInTenDays.expiringSoon, true);

  const endsInElevenDays = accessStateFromSubscription({
    role: "material_provider",
    subscription: subscription({
      currentEndAt: new Date("2026-08-25T00:00:00.000Z"),
    }),
    now,
  });
  assert.equal(endsInElevenDays.daysRemaining, 11);
  assert.equal(endsInElevenDays.expiringSoon, false);

  const fullYear = accessStateFromSubscription({
    role: "material_provider",
    subscription: subscription(),
    now,
  });
  assert.equal(fullYear.daysRemaining, 365);
  assert.equal(fullYear.expiringSoon, false);

  const processing = accessStateFromSubscription({
    role: "material_provider",
    subscription: subscription({ status: "authenticated" }),
    now,
  });
  assert.equal(processing.entitled, false);
  assert.equal(processing.reason, "PAYMENT_PROCESSING");

  const expired = accessStateFromSubscription({
    role: "material_provider",
    subscription: subscription({ currentEndAt: past }),
    now,
  });
  assert.equal(expired.entitled, false);
  assert.equal(expired.reason, "SUBSCRIPTION_EXPIRED");
  assert.equal(expired.daysRemaining, null);
  assert.equal(expired.expiringSoon, false);

  const admin = accessStateFromSubscription({
    role: "admin",
    subscription: null,
    now,
  });
  assert.equal(admin.entitled, true);
  assert.equal(admin.reason, "ADMIN_BYPASS");
  const adminWithoutLookup = await getSubscriptionAccessState({
    userId: "admin-1",
    role: "admin",
    now,
    subscriptionModel: {
      findOne() {
        throw new Error("Admin access must not query subscriptions");
      },
    },
  });
  assert.equal(adminWithoutLookup.entitled, true);

  const queries = [];
  const olderStillValid = subscription();
  const fakeModel = {
    findOne(query) {
      queries.push(query);
      return queryReturning(olderStillValid);
    },
  };
  const anyValid = await getSubscriptionAccessState({
    userId: "user-1",
    role: "material_provider",
    now,
    subscriptionModel: fakeModel,
  });
  assert.equal(anyValid.entitled, true);
  assert.equal(queries.length, 1);
  assert.deepEqual(queries[0].status, { $in: ["active", "completed"] });
  assert.deepEqual(queries[0].currentEndAt, { $gt: now });

  const deniedMiddleware = createRequireActiveSubscription({
    resolveAccessState: async () => processing,
  });
  const denied = await runMiddleware(deniedMiddleware, {
    user: { id: "user-1", role: "material_provider" },
  });
  assert.equal(denied.statusCode, 403);
  assert.equal(denied.code, "SUBSCRIPTION_REQUIRED");
  assert.deepEqual(denied.details.accessState, processing);

  const allowedMiddleware = createRequireActiveSubscription({
    resolveAccessState: async () => active,
  });
  const allowed = await runMiddleware(allowedMiddleware, {
    user: { id: "user-1", role: "verified_buyer" },
  });
  assert.equal(allowed, null);

  const unverified = await runAnyMiddleware(requireCompletedOnboarding, {
    user: { id: "user-1", role: "material_provider" },
    account: completedAccount({ emailVerified: false }),
  });
  assert.equal(unverified.statusCode, 403);
  assert.equal(unverified.code, "EMAIL_VERIFICATION_REQUIRED");

  const incomplete = await runAnyMiddleware(requireCompletedOnboarding, {
    user: { id: "user-1", role: "material_provider" },
    account: completedAccount({
      materialTypes: [],
      preferredMaterialCategories: [],
    }),
  });
  assert.equal(incomplete.statusCode, 403);
  assert.equal(incomplete.code, "ONBOARDING_REQUIRED");

  const googleSetupRequired = await runAnyMiddleware(
    requireCompletedOnboarding,
    {
      user: { id: "user-1", role: "material_provider" },
      account: completedAccount({
        authProvider: "google",
        googleEmailVerified: true,
        hasLocalPassword: false,
      }),
    }
  );
  assert.equal(googleSetupRequired.statusCode, 403);
  assert.equal(googleSetupRequired.code, "ACCOUNT_SETUP_REQUIRED");

  const googleVerified = await runAnyMiddleware(requireCompletedOnboarding, {
    user: { id: "user-1", role: "material_provider" },
    account: completedAccount({
      emailVerified: false,
      authProvider: "google",
      googleEmailVerified: true,
    }),
  });
  assert.equal(googleVerified, null);

  const readyForCheckout = await runAnyMiddleware(
    requireCompletedOnboarding,
    {
      user: { id: "user-1", role: "material_provider" },
      account: completedAccount(),
    }
  );
  assert.equal(readyForCheckout, null);

  const adminBypass = await runAnyMiddleware(requireCompletedOnboarding, {
    user: { id: "admin-1", role: "admin" },
    account: { role: "admin" },
  });
  assert.equal(adminBypass, null);

  process.stdout.write("Subscription entitlement checks passed\n");
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
