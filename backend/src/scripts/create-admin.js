/**
 * Create or promote a single platform admin. Safe for production.
 *
 * Does NOT seed demo data, clear users, or touch payments.
 * Requires explicit confirmation: CREATE_ADMIN_CONFIRM=YES
 *
 * Usage (from backend/):
 *   CREATE_ADMIN_CONFIRM=YES node src/scripts/create-admin.js \
 *     --email=ops@quantaloop.in \
 *     --password='StrongPassHere!' \
 *     --name='Platform Admin'
 *
 * If the email already exists, role is promoted to admin and password is updated.
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const { loadEnv } = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../modules/users/user.model");

const SALT_ROUNDS = 12;

function argValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function assertConfirmed() {
  if (process.env.CREATE_ADMIN_CONFIRM !== "YES") {
    throw new Error(
      "Refusing to run. Set CREATE_ADMIN_CONFIRM=YES to create/promote an admin."
    );
  }
}

async function main() {
  assertConfirmed();
  const env = loadEnv();
  await connectDatabase(env.MONGO_URI);

  const email = (argValue("email") || "").trim().toLowerCase();
  const password = argValue("password") || "";
  const name = (argValue("name") || "Platform Administrator").trim();
  const companyName = (argValue("company") || "Quanta Loop").trim();

  if (!email || !email.includes("@")) {
    throw new Error("Required: --email=you@company.com");
  }
  if (!password || password.length < 10) {
    throw new Error("Required: --password=... (min 10 characters)");
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const existing = await User.findOne({ email });

  if (existing) {
    const previousRole = existing.role;
    existing.role = "admin";
    existing.password = hashed;
    existing.hasLocalPassword = true;
    existing.emailVerified = true;
    existing.accountStatus = "active";
    existing.verificationStatus = "verified";
    if (!existing.name?.trim()) existing.name = name;
    if (!existing.companyName?.trim()) existing.companyName = companyName;
    await existing.save();
    process.stdout.write(
      `Promoted existing user to admin: ${email} (was: ${previousRole})\n`
    );
  } else {
    await User.create({
      name,
      companyName,
      email,
      password: hashed,
      role: "admin",
      authProvider: "local",
      hasLocalPassword: true,
      emailVerified: true,
      verificationStatus: "verified",
      accountStatus: "active",
      industryType: "Platform operations",
      profileCompletion: 100,
    });
    process.stdout.write(`Created admin user: ${email}\n`);
  }

  process.stdout.write("Login at https://www.quantaloop.in/login then open /admin\n");
  await require("mongoose").disconnect();
}

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
