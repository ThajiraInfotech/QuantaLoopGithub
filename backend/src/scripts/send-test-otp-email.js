/**
 * Send a sample OTP verification email (does not create a user or OTP in DB).
 *
 * Usage:
 *   node src/scripts/send-test-otp-email.js --email=you@gmail.com
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const {
  sendEmailVerificationEmail,
  isEmailConfigured,
} = require("../services/email/email.service");

function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

async function main() {
  const env = loadEnv();
  const to =
    parseArg("email") ||
    process.env.OTP_TEST_EMAIL ||
    env.EMAIL_FROM;

  if (!to) {
    throw new Error("Pass --email=you@example.com");
  }

  if (!isEmailConfigured(env)) {
    throw new Error("SMTP is not configured (SMTP_HOST + EMAIL_FROM required)");
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  console.log("Sending test OTP email…");
  console.log("  to:", to);
  console.log("  otp:", otp);

  await sendEmailVerificationEmail(env, { to, otp });

  console.log("Sent successfully.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
