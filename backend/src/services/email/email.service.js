const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

const { buildEmailVerificationEmail } = require("./templates/email-verification-email");
const { buildGoogleAccountEmail } = require("./templates/google-account-email");
const { buildNotificationEmail } = require("./templates/notification-email");
const { buildPasswordResetEmail } = require("./templates/password-reset-email");
const { buildPasswordResetOtpEmail } = require("./templates/password-reset-otp-email");
const { buildSupportContactEmail } = require("./templates/support-contact-email");
const { buildInvoiceHtml } = require("../../modules/billing/invoice-document");

const LOGO_CID = "quantaloop-logo@quantaloop";
const LOGO_EMAIL_PATH = path.join(
  __dirname,
  "..",
  "..",
  "..",
  "assets",
  "quantaloop-logo-email.png"
);

function isEmailConfigured(env) {
  return Boolean(env.SMTP_HOST && env.EMAIL_FROM);
}

function createTransport(env) {
  if (!isEmailConfigured(env)) return null;

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT ?? (env.SMTP_SECURE ? 465 : 587),
    secure: env.SMTP_SECURE ?? false,
    auth:
      env.SMTP_USER && env.SMTP_PASS
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
  });
}

/** Public URL fallback (works only when CLIENT_ORIGIN is reachable by mail clients). */
function logoUrl(env) {
  return `${env.CLIENT_ORIGIN}/quantaloop%20logo.png`;
}

/** Inline CID so logos render even when CLIENT_ORIGIN is localhost. */
function logoCidUrl() {
  return `cid:${LOGO_CID}`;
}

function getLogoAttachment() {
  if (!fs.existsSync(LOGO_EMAIL_PATH)) return null;
  return {
    filename: "quantaloop-logo.png",
    path: LOGO_EMAIL_PATH,
    cid: LOGO_CID,
    contentDisposition: "inline",
    contentType: "image/png",
  };
}

async function deliverEmail(
  env,
  { to, subject, html, text, devLabel, replyTo, attachLogo }
) {
  const transport = createTransport(env);

  if (!transport) {
    if (env.NODE_ENV !== "production") {
      process.stdout.write(`[email:dev] ${devLabel} for ${to}:\n${text}\n`);
      return;
    }
    throw new Error("Email service is not configured");
  }

  const attachments = [];
  if (attachLogo) {
    const logo = getLogoAttachment();
    if (logo) attachments.push(logo);
  }

  await transport.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
    ...(attachments.length ? { attachments } : {}),
  });
}

async function sendPasswordResetEmail(env, { to, resetUrl }) {
  const logo = getLogoAttachment();
  const { subject, html, text } = buildPasswordResetEmail({
    resetUrl,
    logoUrl: logo ? logoCidUrl() : logoUrl(env),
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: "Password reset link",
    attachLogo: Boolean(logo),
  });
}

async function sendPasswordResetOtpEmail(env, { to, otp }) {
  const logo = getLogoAttachment();
  const { subject, html, text } = buildPasswordResetOtpEmail({
    otp,
    logoUrl: logo ? logoCidUrl() : logoUrl(env),
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: "Password reset OTP",
    attachLogo: Boolean(logo),
  });
}

async function sendGoogleAccountEmail(env, { to, loginUrl, setPasswordUrl }) {
  const logo = getLogoAttachment();
  const { subject, html, text } = buildGoogleAccountEmail({
    loginUrl,
    setPasswordUrl,
    logoUrl: logo ? logoCidUrl() : logoUrl(env),
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: "Google account notice",
    attachLogo: Boolean(logo),
  });
}

async function sendEmailVerificationEmail(env, { to, otp }) {
  const logo = getLogoAttachment();
  const { subject, html, text } = buildEmailVerificationEmail({
    otp,
    logoUrl: logo ? logoCidUrl() : logoUrl(env),
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: "Email verification OTP",
    attachLogo: Boolean(logo),
  });
}

async function sendNotificationEmail(
  env,
  { to, recipientName, title, message, actionUrl, matchScore, matchLabel }
) {
  const logo = getLogoAttachment();
  const { subject, html, text } = buildNotificationEmail({
    recipientName,
    title,
    message,
    actionUrl,
    logoUrl: logo ? logoCidUrl() : logoUrl(env),
    matchScore,
    matchLabel,
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: `Notification: ${title}`,
    attachLogo: Boolean(logo),
  });
}

async function sendInvoiceEmail(env, { to, invoiceNumber, html, text, invoice }) {
  const logo = getLogoAttachment();
  const resolvedLogoUrl = logo ? logoCidUrl() : logoUrl(env);
  const finalHtml = invoice
    ? buildInvoiceHtml(invoice, { logoUrl: resolvedLogoUrl })
    : html;

  await deliverEmail(env, {
    to,
    subject: `Tax invoice ${invoiceNumber} — Quanta Loop`,
    html: finalHtml,
    text,
    devLabel: `Invoice ${invoiceNumber}`,
    attachLogo: Boolean(logo && invoice),
  });
}

async function sendSupportContactEmail(
  env,
  {
    name,
    email,
    category,
    description,
    companyName,
    source,
    pageUrl,
    userId,
    to,
  }
) {
  const logo = getLogoAttachment();
  const { subject, html, text } = buildSupportContactEmail({
    name,
    email,
    category,
    description,
    companyName,
    source,
    pageUrl,
    userId,
    logoUrl: logo ? logoCidUrl() : logoUrl(env),
  });

  await deliverEmail(env, {
    to: to || env.SUPPORT_EMAIL,
    subject,
    html,
    text,
    replyTo: email,
    devLabel: `Support contact from ${email}`,
    attachLogo: Boolean(logo),
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendPasswordResetOtpEmail,
  sendGoogleAccountEmail,
  sendEmailVerificationEmail,
  sendNotificationEmail,
  sendInvoiceEmail,
  sendSupportContactEmail,
  isEmailConfigured,
};
