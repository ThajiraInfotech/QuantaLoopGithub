function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const CATEGORY_LABELS = {
  onboarding: "Onboarding",
  matching: "Materials & matching",
  billing: "Billing & membership",
  technical: "Technical",
  other: "Other",
};

const SOURCE_LABELS = {
  public: "Public contact page",
  onboarding: "Onboarding",
  dashboard: "Product dashboard",
};

function buildSupportContactEmail({
  name,
  email,
  category,
  description,
  companyName,
  source,
  pageUrl,
  userId,
  logoUrl,
}) {
  const year = new Date().getFullYear();
  const categoryLabel = CATEGORY_LABELS[category] || category;
  const sourceLabel = SOURCE_LABELS[source] || source;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safeCategory = escapeHtml(categoryLabel);
  const safeDescription = escapeHtml(description).replace(/\n/g, "<br />");
  const safeCompany = companyName ? escapeHtml(companyName) : null;
  const safeSource = escapeHtml(sourceLabel);
  const safePageUrl = pageUrl ? escapeHtml(pageUrl) : null;
  const safeUserId = userId ? escapeHtml(userId) : null;

  const subject = `[Support] ${categoryLabel} — ${name}`;

  const metaRows = [
    ["Name", safeName],
    ["Email", `<a href="mailto:${safeEmail}" style="color:#22B573;text-decoration:none;">${safeEmail}</a>`],
    ["Category", safeCategory],
    ["Source", safeSource],
  ];
  if (safeCompany) metaRows.push(["Company", safeCompany]);
  if (safeUserId) metaRows.push(["User ID", safeUserId]);
  if (safePageUrl) {
    metaRows.push([
      "Page",
      `<a href="${safePageUrl}" style="color:#22B573;text-decoration:none;word-break:break-all;">${safePageUrl}</a>`,
    ]);
  }

  const metaHtml = metaRows
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:8px 0;font-size:13px;color:#64748B;width:120px;vertical-align:top;">${label}</td>
          <td style="padding:8px 0;font-size:14px;color:#0F172A;font-weight:500;">${value}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
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
              <p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:#64748B;">New support request</p>
              <h1 style="margin:0 0 20px;font-size:22px;line-height:1.3;font-weight:700;color:#0F172A;">${safeCategory}</h1>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
                ${metaHtml}
              </table>
              <div style="padding:16px 18px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;">
                <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:#64748B;">Message</p>
                <p style="margin:0;font-size:15px;line-height:1.65;color:#0F172A;">${safeDescription}</p>
              </div>
              <p style="margin:20px 0 0;font-size:13px;line-height:1.6;color:#64748B;">
                Reply to this email to respond directly to ${safeName}.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;text-align:center;">
                Quanta Loop support inbox<br />
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

  const textLines = [
    "New support request",
    "",
    `Category: ${categoryLabel}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Source: ${sourceLabel}`,
  ];
  if (companyName) textLines.push(`Company: ${companyName}`);
  if (userId) textLines.push(`User ID: ${userId}`);
  if (pageUrl) textLines.push(`Page: ${pageUrl}`);
  textLines.push("", "Message:", description, "", `Reply to: ${email}`);

  return {
    subject,
    html,
    text: textLines.join("\n"),
  };
}

module.exports = { buildSupportContactEmail, CATEGORY_LABELS, SOURCE_LABELS };
