function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildNotificationEmail({
  recipientName,
  title,
  message,
  actionUrl,
  supportEmail,
  logoUrl,
  matchScore,
  matchLabel,
}) {
  const year = new Date().getFullYear();
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeName = escapeHtml(recipientName || "there");
  const safeUrl = escapeHtml(actionUrl);
  const matchBadge =
    typeof matchScore === "number" && matchScore >= 75
      ? `<p style="margin:0 0 20px;text-align:center;">
          <span style="display:inline-block;background:#ECFDF5;border:1px solid #A7F3D0;border-radius:999px;padding:8px 16px;font-size:13px;font-weight:600;color:#047857;">
            ${escapeHtml(matchLabel || "Strong match")} · ${matchScore}% fit
          </span>
        </p>`
      : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #E2E8F0;">
              <img src="${escapeHtml(logoUrl)}" alt="Quanta Loop" width="160" style="height:auto;max-width:160px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748B;">Hi ${safeName},</p>
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;color:#0F172A;">${safeTitle}</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#64748B;">${safeMessage}</p>
              ${matchBadge}
              <p style="margin:0 0 8px;text-align:center;">
                <a href="${safeUrl}" style="display:inline-block;background:#22B573;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:14px 24px;border-radius:12px;">
                  View in Quanta Loop
                </a>
              </p>
              <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#94A3B8;text-align:center;word-break:break-all;">
                Or open: <a href="${safeUrl}" style="color:#22B573;text-decoration:none;">${safeUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;text-align:center;">
                You received this because activity on Quanta Loop affects your account.<br />
                Need help? Contact <a href="mailto:${escapeHtml(supportEmail)}" style="color:#22B573;text-decoration:none;">${escapeHtml(supportEmail)}</a><br />
                © ${year} Quanta Loop
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const matchLine =
    typeof matchScore === "number" && matchScore >= 75
      ? `\nMatch: ${matchLabel || "Strong match"} (${matchScore}% fit)\n`
      : "";

  const text = `Hi ${recipientName || "there"},

${title}

${message}
${matchLine}
View in Quanta Loop: ${actionUrl}

Support: ${supportEmail}`;

  return {
    subject: title,
    html,
    text,
  };
}

module.exports = { buildNotificationEmail };
