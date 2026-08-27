/**
 * Send a sample Google-account notice email (preview links only).
 *
 * Usage:
 *   node src/scripts/send-test-google-account-email.js --email=you@gmail.com
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const {
  sendGoogleAccountEmail,
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
    process.env.GOOGLE_ACCOUNT_TEST_EMAIL ||
    env.EMAIL_FROM;

  if (!to) {
    throw new Error("Pass --email=you@example.com");
  }

  if (!isEmailConfigured(env)) {
    throw new Error("SMTP is not configured (SMTP_HOST + EMAIL_FROM required)");
  }

  const origin = String(env.CLIENT_ORIGIN).replace(/\/$/, "");
  const loginUrl = `${origin}/login`;
  const setPasswordUrl = `${origin}/reset-password?token=preview-sample-token`;

  console.log("Sending test Google-account email…");
  console.log("  to:", to);
  console.log("  loginUrl:", loginUrl);
  console.log("  setPasswordUrl:", setPasswordUrl);

  await sendGoogleAccountEmail(env, { to, loginUrl, setPasswordUrl });

  console.log("Sent successfully.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
