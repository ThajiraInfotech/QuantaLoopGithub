/**
 * Send a sample support-contact email (preview only).
 * By default goes to SUPPORT_EMAIL; pass --email= to preview elsewhere.
 *
 * Usage:
 *   node src/scripts/send-test-support-contact-email.js --email=you@gmail.com
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const {
  sendSupportContactEmail,
  isEmailConfigured,
} = require("../services/email/email.service");

function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

async function main() {
  const env = loadEnv();
  const to = parseArg("email") || env.SUPPORT_EMAIL || env.EMAIL_FROM;

  if (!to) {
    throw new Error("Pass --email=you@example.com");
  }

  if (!isEmailConfigured(env)) {
    throw new Error("SMTP is not configured (SMTP_HOST + EMAIL_FROM required)");
  }

  const origin = String(env.CLIENT_ORIGIN).replace(/\/$/, "");

  console.log("Sending test support-contact email…");
  console.log("  to:", to);

  await sendSupportContactEmail(env, {
    to,
    name: "Arshadh Ahamed",
    email: "arshadh0777@gmail.com",
    category: "matching",
    description:
      "Hi team,\n\nI am trying to find recycled PET flake suppliers in Tamil Nadu. The match results look incomplete for my filters. Can you help check this?\n\nThanks.",
    companyName: "Quanta Loop Preview Co",
    source: "dashboard",
    pageUrl: `${origin}/dashboard/support`,
    userId: "preview-user-id",
  });

  console.log("Sent successfully.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
