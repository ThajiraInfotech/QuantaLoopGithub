/**
 * Send a sample password-reset email (does not create a real reset token).
 *
 * Usage:
 *   node src/scripts/send-test-password-reset-email.js --email=you@gmail.com
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const {
  sendPasswordResetEmail,
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
    process.env.PASSWORD_RESET_TEST_EMAIL ||
    env.EMAIL_FROM;

  if (!to) {
    throw new Error("Pass --email=you@example.com");
  }

  if (!isEmailConfigured(env)) {
    throw new Error("SMTP is not configured (SMTP_HOST + EMAIL_FROM required)");
  }

  const resetUrl = `${String(env.CLIENT_ORIGIN).replace(/\/$/, "")}/reset-password?token=preview-sample-token`;

  console.log("Sending test password-reset email…");
  console.log("  to:", to);
  console.log("  resetUrl:", resetUrl);

  await sendPasswordResetEmail(env, { to, resetUrl });

  console.log("Sent successfully.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
