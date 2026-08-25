const nodemailer = require("nodemailer");

const { buildEmailVerificationEmail } = require("./templates/email-verification-email");
const { buildGoogleAccountEmail } = require("./templates/google-account-email");
const { buildNotificationEmail } = require("./templates/notification-email");
const { buildPasswordResetEmail } = require("./templates/password-reset-email");

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

function logoUrl(env) {
  return `${env.CLIENT_ORIGIN}/quantaloop%20logo.png`;
}

async function deliverEmail(env, { to, subject, html, text, devLabel }) {
  const transport = createTransport(env);

  if (!transport) {
    if (env.NODE_ENV !== "production") {
      process.stdout.write(`[email:dev] ${devLabel} for ${to}:\n${text}\n`);
      return;
    }
    throw new Error("Email service is not configured");
  }

  await transport.sendMail({
    from: `"${env.EMAIL_FROM_NAME}" <${env.EMAIL_FROM}>`,
    to,
    subject,
    html,
    text,
  });
}

async function sendPasswordResetEmail(env, { to, resetUrl }) {
  const { subject, html, text } = buildPasswordResetEmail({
    resetUrl,
    supportEmail: env.SUPPORT_EMAIL,
    logoUrl: logoUrl(env),
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: "Password reset link",
  });
}

async function sendGoogleAccountEmail(env, { to, loginUrl, setPasswordUrl }) {
  const { subject, html, text } = buildGoogleAccountEmail({
    loginUrl,
    setPasswordUrl,
    supportEmail: env.SUPPORT_EMAIL,
    logoUrl: logoUrl(env),
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: "Google account notice",
  });
}

async function sendEmailVerificationEmail(env, { to, otp }) {
  const { subject, html, text } = buildEmailVerificationEmail({
    otp,
    supportEmail: env.SUPPORT_EMAIL,
    logoUrl: logoUrl(env),
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: "Email verification OTP",
  });
}

async function sendNotificationEmail(
  env,
  { to, recipientName, title, message, actionUrl, matchScore, matchLabel }
) {
  const { subject, html, text } = buildNotificationEmail({
    recipientName,
    title,
    message,
    actionUrl,
    supportEmail: env.SUPPORT_EMAIL,
    logoUrl: logoUrl(env),
    matchScore,
    matchLabel,
  });

  await deliverEmail(env, {
    to,
    subject,
    html,
    text,
    devLabel: `Notification: ${title}`,
  });
}

async function sendInvoiceEmail(env, { to, invoiceNumber, html, text }) {
  await deliverEmail(env, {
    to,
    subject: `Tax invoice ${invoiceNumber} — Quanta Loop`,
    html,
    text,
    devLabel: `Invoice ${invoiceNumber}`,
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendGoogleAccountEmail,
  sendEmailVerificationEmail,
  sendNotificationEmail,
  sendInvoiceEmail,
  isEmailConfigured,
};
