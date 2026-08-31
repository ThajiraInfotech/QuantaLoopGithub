/**
 * Local-only: expire a user's free trial (and any paid term) so you can see the paywall.
 *
 * Usage (from backend/):
 *   node src/scripts/expire-trial-local.js --email=you@example.com
 *
 * Refuses to run when NODE_ENV=production.
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../modules/users/user.model");
const { Subscription } = require("../modules/subscriptions/subscription.model");
const {
  getSubscriptionAccessState,
} = require("../modules/subscriptions/subscription-access.service");

function argValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

async function main() {
  const env = loadEnv();
  if (env.NODE_ENV === "production") {
    throw new Error("Refusing to run: NODE_ENV is production");
  }

  const email = (argValue("email") || "").trim().toLowerCase();
  if (!email) {
    throw new Error("Required: --email=user@example.com");
  }

  await connectDatabase(env.MONGO_URI);

  const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const started = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);

  const user = await User.findOneAndUpdate(
    { email, role: { $ne: "admin" } },
    {
      $set: {
        trialStartedAt: started,
        trialEndsAt: past,
        trialConsumed: true,
      },
    },
    { new: true }
  ).select("email role trialEndsAt trialConsumed");

  if (!user) {
    throw new Error(`No non-admin user found for ${email}`);
  }

  const subResult = await Subscription.updateMany(
    { user: user._id },
    { $set: { status: "expired", currentEndAt: past } }
  );

  const access = await getSubscriptionAccessState({
    userId: user._id.toString(),
    role: user.role,
    trialDays: env.MEMBERSHIP_TRIAL_DAYS,
  });

  process.stdout.write(
    `Expired trial for ${user.email} (ends ${user.trialEndsAt.toISOString()})\n`
  );
  process.stdout.write(
    `Expired subscriptions: ${subResult.modifiedCount || subResult.nModified || 0}\n`
  );
  process.stdout.write(
    `Access now: entitled=${access.entitled} reason=${access.reason}\n`
  );
  process.stdout.write(
    "Logout/login locally, then open /dashboard — you should land on membership paywall.\n"
  );
  await require("mongoose").disconnect();
}

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
