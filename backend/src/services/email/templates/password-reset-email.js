function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildPasswordResetEmail({ resetUrl, logoUrl }) {
  const year = new Date().getFullYear();
  const safeUrl = escapeHtml(resetUrl);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Reset your Quanta Loop password</title>
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
    Reset your Quanta Loop password. This link expires in 30 minutes.
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
                          <img src="${logoUrl}" alt="Quanta Loop" width="160" height="66" style="display:block;width:160px;height:auto;max-width:160px;border:0;outline:none;text-decoration:none;background-color:#FFFFFF;" />
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
                      Account security
                    </p>
                    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:700;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Reset your password
                    </h1>
                    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#5C6670;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      We received a request to reset the password for your Quanta Loop account. Use the button below to choose a new password.
                    </p>
                  </td>
                </tr>
                <!-- CTA -->
                <tr>
                  <td align="center" style="padding:0 40px 28px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                      <tr>
                        <td align="center" bgcolor="#2BAA6B" style="background-color:#2BAA6B;border-radius:10px;">
                          <a href="${safeUrl}" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;line-height:1.4;color:#FFFFFF;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            Reset Password
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Expiry notice -->
                <tr>
                  <td style="padding:0 40px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#E8F7EF;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;line-height:1.55;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            This link expires in <strong>30 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Fallback URL -->
                <tr>
                  <td style="padding:0 40px 36px;">
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#8A939C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      If the button does not work, copy and paste this link into your browser:
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.6;word-break:break-all;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      <a href="${safeUrl}" style="color:#2BAA6B;text-decoration:none;">${safeUrl}</a>
                    </p>
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

  const text = `Quanta Loop — Account security

Reset your password

We received a request to reset the password for your Quanta Loop account. Open the link below to choose a new password.

${resetUrl}

This link expires in 30 minutes. If you did not request a password reset, you can ignore this email.

© ${year} Quanta Loop`;

  return {
    subject: "Reset your Quanta Loop password",
    html,
    text,
  };
}

module.exports = { buildPasswordResetEmail };
