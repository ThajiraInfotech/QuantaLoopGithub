/**
 * Membership free-trial entitlement checks (no DB / no Razorpay).
 * Run: npm run test:membership-trial
 */
const assert = require("node:assert/strict");

const {
  accessStateFromSubscription,
  accessStateFromTrial,
  getSubscriptionAccessState,
  isAccountReadyForTrial,
  normalizeTrialDays,
} = require("../modules/subscriptions/subscription-access.service");

const now = new Date("2026-08-14T00:00:00.000Z");
const future = new Date("2026-09-13T00:00:00.000Z");
const past = new Date("2026-07-01T00:00:00.000Z");

function readyAccount(overrides = {}) {
  return {
    _id: "user-1",
    role: "material_provider",
    emailVerified: true,
    authProvider: "local",
    hasLocalPassword: true,
    materialTypes: ["Plastic"],
    preferredMaterialCategories: ["Plastic"],
    country: "IN",
    state: "Tamil Nadu",
    location: "Chennai",
    trialConsumed: false,
    trialEndsAt: null,
    trialStartedAt: null,
    ...overrides,
  };
}

function queryReturning(value) {
  return {
    sort() {
      return this;
    },
    select() {
      return this;
    },
    async lean() {
      return value;
    },
  };
}

async function main() {
  assert.equal(normalizeTrialDays(undefined), 30);
  assert.equal(normalizeTrialDays(0), 0);
  assert.equal(normalizeTrialDays(45), 45);

  assert.equal(isAccountReadyForTrial(readyAccount()), true);
  assert.equal(
    isAccountReadyForTrial(readyAccount({ materialTypes: [], preferredMaterialCategories: [] })),
    false
  );
  assert.equal(
    isAccountReadyForTrial(readyAccount({ emailVerified: false })),
    false
  );

  const activeTrial = accessStateFromTrial({ trialEndsAt: future, now });
  assert.equal(activeTrial.entitled, true);
  assert.equal(activeTrial.reason, "TRIAL_ACTIVE");
  assert.equal(activeTrial.isTrial, true);
  assert.equal(activeTrial.accessSource, "trial");
  assert.equal(activeTrial.expiringSoon, false);
  assert.equal(activeTrial.daysRemaining, 30);

  const trialEndingSoon = accessStateFromTrial({
    trialEndsAt: new Date("2026-08-20T00:00:00.000Z"),
    now,
  });
  assert.equal(trialEndingSoon.entitled, true);
  assert.equal(trialEndingSoon.daysRemaining, 6);
  assert.equal(trialEndingSoon.expiringSoon, true);

  const expiredTrial = accessStateFromTrial({ trialEndsAt: past, now });
  assert.equal(expiredTrial.entitled, false);
  assert.equal(expiredTrial.reason, "TRIAL_EXPIRED");

  // Paid still wins over trial.
  const paid = accessStateFromSubscription({
    role: "verified_buyer",
    subscription: {
      catalogPlanId: "annual_access",
      status: "active",
      currentEndAt: new Date("2027-08-14T00:00:00.000Z"),
    },
    now,
  });
  assert.equal(paid.entitled, true);
  assert.equal(paid.accessSource, "paid");
  assert.equal(paid.isTrial, false);

  let started = false;
  let findOneCalls = 0;
  const subscriptionModel = {
    findOne() {
      findOneCalls += 1;
      return queryReturning(null);
    },
  };
  const userModel = {
    findById() {
      return queryReturning(readyAccount());
    },
    findOneAndUpdate() {
      started = true;
      return queryReturning(
        readyAccount({
          trialConsumed: true,
          trialStartedAt: now,
          trialEndsAt: future,
        })
      );
    },
  };

  const startedAccess = await getSubscriptionAccessState({
    userId: "user-1",
    role: "material_provider",
    now,
    trialDays: 30,
    subscriptionModel,
    userModel,
  });
  assert.equal(started, true);
  assert.equal(startedAccess.entitled, true);
  assert.equal(startedAccess.reason, "TRIAL_ACTIVE");
  assert.equal(startedAccess.isTrial, true);

  // Already consumed + expired → no restart.
  let restartAttempted = false;
  const expiredUserModel = {
    findById() {
      return queryReturning(
        readyAccount({
          trialConsumed: true,
          trialEndsAt: past,
          trialStartedAt: past,
        })
      );
    },
    findOneAndUpdate() {
      restartAttempted = true;
      return queryReturning(null);
    },
  };
  const expiredAccess = await getSubscriptionAccessState({
    userId: "user-1",
    role: "material_provider",
    now,
    trialDays: 30,
    subscriptionModel,
    userModel: expiredUserModel,
  });
  assert.equal(restartAttempted, false);
  assert.equal(expiredAccess.entitled, false);
  assert.equal(expiredAccess.reason, "TRIAL_EXPIRED");

  // trialDays=0 disables auto-start.
  let disabledStart = false;
  const disabledAccess = await getSubscriptionAccessState({
    userId: "user-1",
    role: "material_provider",
    now,
    trialDays: 0,
    subscriptionModel,
    userModel: {
      findById() {
        return queryReturning(readyAccount());
      },
      findOneAndUpdate() {
        disabledStart = true;
        return queryReturning(null);
      },
    },
  });
  assert.equal(disabledStart, false);
  assert.equal(disabledAccess.entitled, false);

  // Admin bypass unchanged.
  const admin = await getSubscriptionAccessState({
    userId: "admin-1",
    role: "admin",
    now,
    subscriptionModel: {
      findOne() {
        throw new Error("admin must not query");
      },
    },
    userModel: {
      findById() {
        throw new Error("admin must not query users");
      },
    },
  });
  assert.equal(admin.entitled, true);
  assert.equal(admin.reason, "ADMIN_BYPASS");

  process.stdout.write("Membership trial checks passed\n");
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});
