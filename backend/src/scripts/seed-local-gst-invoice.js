/**
 * Local GST / invoice check — NO Razorpay keys required.
 *
 * Seeds a billing profile + tax invoice for an existing user so you can verify:
 * - Admin → /admin/invoices
 * - Profile → Payments & invoices
 *
 * Usage (from backend/):
 *   node src/scripts/seed-local-gst-invoice.js --email=user@example.com
 *   node src/scripts/seed-local-gst-invoice.js --email=user@example.com --state=KA
 *   node src/scripts/seed-local-gst-invoice.js --email=user@example.com --export
 *
 * Safe: only writes Quanta Loop DB records. Does not call Razorpay / live payments.
 */
require("dotenv").config();

const { loadEnv } = require("../config/env");
const { connectDatabase } = require("../config/database");
const { User } = require("../modules/users/user.model");
const { createSubscriptionCatalog } = require("../config/subscriptionCatalog");
const { createBillingService } = require("../modules/billing/billing.service");
const { Subscription } = require("../modules/subscriptions/subscription.model");
const { sendInvoiceEmail } = require("../services/email/email.service");
const { Invoice, toPublicInvoice } = require("../modules/billing/invoice.model");
const {
  buildInvoiceHtml,
  buildInvoiceEmailText,
} = require("../modules/billing/invoice-document");

function argValue(name) {
  const prefix = `--${name}=`;
  const hit = process.argv.find((a) => a.startsWith(prefix));
  return hit ? hit.slice(prefix.length) : null;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

async function main() {
  const env = loadEnv();
  if (env.NODE_ENV === "production") {
    throw new Error(
      "Refusing to run seed-local-gst-invoice.js when NODE_ENV=production"
    );
  }

  const email = (argValue("email") || "").trim().toLowerCase();
  if (!email) {
    throw new Error(
      "Pass --email=your@testuser.com (an existing local account email)"
    );
  }

  const isExport = hasFlag("export");
  const stateCode = (argValue("state") || "TN").trim().toUpperCase();
  const stateName =
    stateCode === "TN"
      ? "Tamil Nadu"
      : stateCode === "KA"
        ? "Karnataka"
        : stateCode;

  await connectDatabase(env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error(`No user found for email: ${email}`);
  }

  const catalog = createSubscriptionCatalog(env);
  const billing = createBillingService({
    env,
    catalog,
    emailService: {
      sendInvoiceEmail: (payload) => sendInvoiceEmail(env, payload),
    },
  });
  const plan = catalog.getPlan("annual_access");

  if (hasFlag("resend")) {
    const latest = await Invoice.findOne({ user: user._id }).sort({
      invoiceDate: -1,
    });
    if (!latest) {
      throw new Error("No invoice found to resend for this user");
    }
    const publicInvoice = toPublicInvoice(latest);
    const html =
      latest.htmlBody || buildInvoiceHtml(publicInvoice);
    await sendInvoiceEmail(env, {
      to: latest.buyer?.billingEmail || user.email,
      invoiceNumber: latest.invoiceNumber,
      html,
      text: buildInvoiceEmailText(publicInvoice),
      invoice: publicInvoice,
    });
    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          resent: true,
          to: latest.buyer?.billingEmail || user.email,
          invoiceNumber: latest.invoiceNumber,
        },
        null,
        2
      ) + "\n"
    );
    return;
  }

  const profileInput = isExport
    ? {
        legalName: user.companyName || user.name,
        billingEmail: user.email,
        customerType: "business",
        gstRegistered: false,
        gstin: "",
        taxId: "",
        address: {
          line1: "Office 12, Business Bay",
          line2: "",
          city: "Dubai",
          state: "",
          stateCode: "",
          pincode: "00000",
          country: "AE",
        },
      }
    : {
        legalName: user.companyName || user.name,
        billingEmail: user.email,
        customerType: "business",
        gstRegistered: false,
        gstin: "",
        taxId: "",
        address: {
          line1: "Local test billing address",
          line2: "",
          city: user.location || "Coimbatore",
          state: stateName,
          stateCode,
          pincode: "641001",
          country: "IN",
        },
      };

  const { profile, taxPreview } = await billing.upsertProfile(
    user._id,
    profileInput,
    { email: user.email }
  );

  const paymentId = `pay_local_${Date.now()}`;
  let subscription = await Subscription.findOne({
    user: user._id,
    catalogPlanId: "annual_access",
  }).sort({ createdAt: -1 });

  if (!subscription) {
    subscription = await Subscription.create({
      user: user._id,
      catalogPlanId: "annual_access",
      razorpayPlanId: "order_checkout",
      razorpayOrderId: `order_local_${Date.now()}`,
      latestPaymentId: paymentId,
      idempotencyKey: `local-gst:${user._id}:${Date.now()}`,
      checkoutState: "ready",
      status: "active",
      currentStartAt: new Date(),
      currentEndAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    });
  } else {
    subscription.latestPaymentId = paymentId;
    subscription.status = "active";
    if (!subscription.currentEndAt || subscription.currentEndAt < new Date()) {
      subscription.currentStartAt = new Date();
      subscription.currentEndAt = new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000
      );
    }
    await subscription.save();
  }

  const invoice = await billing.issueInvoiceForPayment({
    userId: user._id,
    subscription,
    paymentId,
    payment: {
      id: paymentId,
      status: "captured",
      amount: plan.amountMinor,
      currency: plan.currency,
      created_at: Math.floor(Date.now() / 1000),
      order_id: subscription.razorpayOrderId,
    },
  });

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        note: "No Razorpay call made. Check Admin → Invoices and Profile → Payments.",
        user: { id: String(user._id), email: user.email },
        billingProfile: {
          legalName: profile.legalName,
          country: profile.address.country,
          stateCode: profile.address.stateCode,
        },
        taxPreview,
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          taxType: invoice.taxType,
          taxableAmount: invoice.taxableAmount,
          cgstAmount: invoice.cgstAmount,
          sgstAmount: invoice.sgstAmount,
          igstAmount: invoice.igstAmount,
          amountInclusive: invoice.amountInclusive,
          isExport: invoice.isExport,
        },
        open: {
          admin: "http://localhost:3000/admin/invoices",
          profile: "http://localhost:3000/dashboard/profile",
        },
      },
      null,
      2
    ) + "\n"
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exit(1);
  });
