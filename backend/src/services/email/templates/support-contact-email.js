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
  const safeLogoUrl = escapeHtml(logoUrl);

  const subject = `[Support] ${categoryLabel} — ${name}`;

  const metaRows = [
    ["Name", safeName],
    [
      "Email",
      `<a href="mailto:${safeEmail}" style="color:#2BAA6B;text-decoration:none;">${safeEmail}</a>`,
    ],
    ["Category", safeCategory],
    ["Source", safeSource],
  ];
  if (safeCompany) metaRows.push(["Company", safeCompany]);
  if (safeUserId) metaRows.push(["User ID", `<span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:12px;">${safeUserId}</span>`]);
  if (safePageUrl) {
    metaRows.push([
      "Page",
      `<a href="${safePageUrl}" style="color:#2BAA6B;text-decoration:none;word-break:break-all;">${safePageUrl}</a>`,
    ]);
  }

  const metaHtml = metaRows
    .map(
      ([label, value], index) =>
        `<tr>
          <td style="padding:12px 0;font-size:13px;color:#5C6670;width:110px;vertical-align:top;border-top:${index === 0 ? "none" : "1px solid #E2E7EB"};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${label}</td>
          <td style="padding:12px 0;font-size:14px;color:#0F1416;font-weight:500;vertical-align:top;border-top:${index === 0 ? "none" : "1px solid #E2E7EB"};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${value}</td>
        </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
  <style type="text/css">
    :root { color-scheme: light; supported-color-schemes: light; }
  </style>
</head>
<body style="margin:0;padding:0;background:#EEF1F3;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    New support request: ${safeCategory} from ${safeName}.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#EEF1F3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
          <!-- Brand bar -->
          <tr>
            <td style="height:4px;background:#2BAA6B;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <!-- Card -->
          <tr>
            <td style="background:#FFFFFF;border-left:1px solid #E2E7EB;border-right:1px solid #E2E7EB;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <!-- Logo -->
                <tr>
                  <td bgcolor="#FFFFFF" style="padding:28px 40px 24px;text-align:left;background-color:#FFFFFF;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" bgcolor="#FFFFFF" style="background-color:#FFFFFF;border-collapse:collapse;">
                      <tr>
                        <td bgcolor="#FFFFFF" style="background-color:#FFFFFF;padding:4px 0;">
                          <img src="${safeLogoUrl}" alt="Quanta Loop" width="160" height="66" style="display:block;width:160px;height:auto;max-width:160px;border:0;outline:none;text-decoration:none;background-color:#FFFFFF;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Divider -->
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:#E2E7EB;font-size:0;line-height:0;">&nbsp;</div>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:32px 40px 8px;">
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#2BAA6B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Support request
                    </p>
                    <h1 style="margin:0 0 24px;font-size:26px;line-height:1.25;font-weight:700;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      ${safeCategory}
                    </h1>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
                      ${metaHtml}
                    </table>
                  </td>
                </tr>
                <!-- Message -->
                <tr>
                  <td style="padding:0 40px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F6F7;border:1px solid #E2E7EB;border-radius:10px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#5C6670;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            Message
                          </p>
                          <p style="margin:0;font-size:15px;line-height:1.65;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            ${safeDescription}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Reply tip -->
                <tr>
                  <td style="padding:0 40px 36px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#E8F7EF;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;line-height:1.55;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            Reply to this email to respond directly to <strong>${safeName}</strong>.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F4F6F7;border:1px solid #E2E7EB;border-top:none;padding:24px 40px;">
              <p style="margin:0 0 6px;font-size:12px;line-height:1.5;color:#5C6670;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                Quanta Loop — Recoverable Material Network
              </p>
              <p style="margin:0;font-size:12px;line-height:1.5;color:#8A939C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                © ${year} Quanta Loop. All rights reserved.
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
    "Quanta Loop — Support request",
    "",
    `Category: ${categoryLabel}`,
    `Name: ${name}`,
    `Email: ${email}`,
    `Source: ${sourceLabel}`,
  ];
  if (companyName) textLines.push(`Company: ${companyName}`);
  if (userId) textLines.push(`User ID: ${userId}`);
  if (pageUrl) textLines.push(`Page: ${pageUrl}`);
  textLines.push("", "Message:", description, "", `Reply to: ${email}`, "", `© ${year} Quanta Loop`);

  return {
    subject,
    html,
    text: textLines.join("\n"),
  };
}

module.exports = { buildSupportContactEmail, CATEGORY_LABELS, SOURCE_LABELS };
