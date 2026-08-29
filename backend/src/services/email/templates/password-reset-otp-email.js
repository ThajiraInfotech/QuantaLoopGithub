function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildOtpDigits(otp) {
  return String(otp)
    .split("")
    .map(
      (digit) => `
                  <td align="center" valign="middle" style="padding:0 4px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="border-collapse:separate;">
                      <tr>
                        <td align="center" valign="middle" width="44" height="52" style="width:44px;height:52px;background:#F4F6F7;border:1px solid #E2E7EB;border-radius:10px;font-size:22px;font-weight:700;color:#0F1416;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">
                          ${escapeHtml(digit)}
                        </td>
                      </tr>
                    </table>
                  </td>`
    )
    .join("");
}

function buildPasswordResetOtpEmail({ otp, logoUrl }) {
  const year = new Date().getFullYear();
  const safeOtp = escapeHtml(otp);
  const digitCells = buildOtpDigits(otp);

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
    Your Quanta Loop password reset code is ${safeOtp}. It expires in 10 minutes.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#EEF1F3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
          <tr>
            <td style="height:4px;background:#2BAA6B;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:#FFFFFF;border-left:1px solid #E2E7EB;border-right:1px solid #E2E7EB;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
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
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px;background:#E2E7EB;font-size:0;line-height:0;">&nbsp;</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:32px 40px 8px;">
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#2BAA6B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Password reset
                    </p>
                    <h1 style="margin:0 0 16px;font-size:26px;line-height:1.25;font-weight:700;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Use this code to set a new password
                    </h1>
                    <p style="margin:0 0 28px;font-size:15px;line-height:1.65;color:#5C6670;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Enter the one-time code below on the password reset screen, then choose your new password. For your security, do not share this code with anyone.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding:0 40px 28px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                      <tr>
                        ${digitCells}
                      </tr>
                    </table>
                    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#5C6670;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Or copy this code: <strong style="color:#0F1416;letter-spacing:0.12em;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;">${safeOtp}</strong>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 40px 36px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#E8F7EF;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;line-height:1.55;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            This code expires in <strong>10 minutes</strong>. If you did not request a password reset, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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

  const text = `Quanta Loop — Password reset

Use this code to set a new password

Your password reset code is: ${otp}

This code expires in 10 minutes. If you did not request a password reset, you can ignore this email.

© ${year} Quanta Loop`;

  return {
    subject: "Your Quanta Loop password reset code",
    html,
    text,
  };
}

module.exports = { buildPasswordResetOtpEmail };
