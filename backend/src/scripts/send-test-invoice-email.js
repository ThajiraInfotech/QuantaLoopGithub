/**
 * Send a sample tax-invoice email (preview only — does not create a DB invoice).
 *
 * Usage:
 *   node src/scripts/send-test-invoice-email.js --email=you@gmail.com
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const {
  sendInvoiceEmail,
  isEmailConfigured,
} = require("../services/email/email.service");
const {
  buildInvoiceHtml,
  buildInvoiceEmailText,
} = require("../modules/billing/invoice-document");

function parseArg(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length).trim() : "";
}

async function main() {
  const env = loadEnv();
  const to =
    parseArg("email") ||
    process.env.INVOICE_TEST_EMAIL ||
    env.EMAIL_FROM;

  if (!to) {
    throw new Error("Pass --email=you@example.com");
  }

  if (!isEmailConfigured(env)) {
    throw new Error("SMTP is not configured (SMTP_HOST + EMAIL_FROM required)");
  }

  const invoice = {
    invoiceNumber: "QL-PREVIEW-2026-0001",
    invoiceDate: new Date(),
    description: "Annual network access",
    sacCode: "998599",
    placeOfSupply: "Tamil Nadu",
    taxType: "cgst_sgst",
    isExport: false,
    amountInclusive: 11800,
    taxableAmount: 10000,
    cgstAmount: 900,
    sgstAmount: 900,
    igstAmount: 0,
    buyer: {
      legalName: "Arshadh Preview Traders",
      gstin: "33AAAAA0000A1Z5",
      address: {
        line1: "12 Industrial Estate",
        line2: "Guindy",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600032",
        country: "IN",
      },
    },
    seller: {
      legalName: "Quanta Loop",
      gstin: "33BBBBB0000B1Z5",
      address: "Registered office, Chennai",
      stateName: "Tamil Nadu",
      stateCode: "TN",
    },
    razorpayPaymentId: "pay_preview_sample",
  };

  const html = buildInvoiceHtml(invoice, {
    logoUrl: `${String(env.CLIENT_ORIGIN).replace(/\/$/, "")}/quantaloop%20logo.png`,
  });

  console.log("Sending test invoice email…");
  console.log("  to:", to);
  console.log("  invoice:", invoice.invoiceNumber);

  await sendInvoiceEmail(env, {
    to,
    invoiceNumber: invoice.invoiceNumber,
    html,
    text: buildInvoiceEmailText(invoice),
    invoice,
  });

  console.log("Sent successfully.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
