/**
 * Ensure a single platform admin: asm@quantaloop.in
 * Demotes every other admin. Safe for the shared Atlas DB used locally/live.
 *
 *   CREATE_ADMIN_CONFIRM=YES node src/scripts/ensure-single-admin.js
 */
require("dotenv").config();

const bcrypt = require("bcryptjs");
const { loadEnv } = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../modules/users/user.model");

const SALT_ROUNDS = 12;
const ADMIN_EMAIL = "asm@quantaloop.in";
const ADMIN_PASSWORD = "Asm@quantaloop@2026";
const ADMIN_NAME = "ASM Holdings";
const ADMIN_COMPANY = "Quanta Loop";

async function main() {
  if (process.env.CREATE_ADMIN_CONFIRM !== "YES") {
    throw new Error("Set CREATE_ADMIN_CONFIRM=YES to run this script.");
  }

  const env = loadEnv();
  await connectDatabase(env.MONGO_URI);

  const hashed = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
  let admin = await User.findOne({ email: ADMIN_EMAIL });

  if (admin) {
    admin.role = "admin";
    admin.password = hashed;
    admin.hasLocalPassword = true;
    admin.emailVerified = true;
    admin.accountStatus = "active";
    admin.verificationStatus = "verified";
    if (!admin.name?.trim()) admin.name = ADMIN_NAME;
    if (!admin.companyName?.trim()) admin.companyName = ADMIN_COMPANY;
    await admin.save();
    process.stdout.write(`Updated admin: ${ADMIN_EMAIL}\n`);
  } else {
    admin = await User.create({
      name: ADMIN_NAME,
      companyName: ADMIN_COMPANY,
      email: ADMIN_EMAIL,
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
    process.stdout.write(`Created admin: ${ADMIN_EMAIL}\n`);
  }

  const demoted = await User.updateMany(
    { role: "admin", email: { $ne: ADMIN_EMAIL } },
    { $set: { role: "material_provider" } }
  );

  const admins = await User.find({ role: "admin" }).select("email name");
  process.stdout.write(
    `Demoted other admins: ${demoted.modifiedCount}\n` +
      `Admin count now: ${admins.length}\n` +
      admins.map((a) => `  - ${a.email}`).join("\n") +
      "\n"
  );

  await require("mongoose").disconnect();
}

main().catch((err) => {
  process.stderr.write(`${err.message || err}\n`);
  process.exit(1);
});
