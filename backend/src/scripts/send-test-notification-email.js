/**
 * Send sample in-app notification emails (preview links only).
 *
 * Usage:
 *   node src/scripts/send-test-notification-email.js --email=you@gmail.com
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const {
  sendNotificationEmail,
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
    process.env.NOTIFICATION_TEST_EMAIL ||
    env.EMAIL_FROM;

  if (!to) {
    throw new Error("Pass --email=you@example.com");
  }

  if (!isEmailConfigured(env)) {
    throw new Error("SMTP is not configured (SMTP_HOST + EMAIL_FROM required)");
  }

  const origin = String(env.CLIENT_ORIGIN).replace(/\/$/, "");

  const samples = [
    {
      title: "New opportunity for you",
      message:
        "A new Plastic Waste listing in Chennai matches your preferences.",
      actionUrl: `${origin}/dashboard/materials/preview-sample-material`,
      matchScore: 86,
      matchLabel: "Strong match",
    },
    {
      title: "Buyer waiting for your response",
      message:
        "GreenCycle Traders is interested in Recycled PET Flakes Grade A.",
      actionUrl: `${origin}/dashboard/interests?open=preview-sample-interest`,
    },
  ];

  console.log("Sending test notification emails…");
  console.log("  to:", to);

  for (const sample of samples) {
    await sendNotificationEmail(env, {
      to,
      recipientName: "Arshadh",
      ...sample,
    });
    console.log("  sent:", sample.title);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
