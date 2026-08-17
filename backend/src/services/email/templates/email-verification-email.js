function buildEmailVerificationEmail({ otp, supportEmail, logoUrl }) {
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Verify your Quanta Loop email</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #E2E8F0;">
              <img src="${logoUrl}" alt="Quanta Loop" width="160" style="height:auto;max-width:160px;" />
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;color:#0F172A;">Verify your email address</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#64748B;">
                Welcome to Quanta Loop. Enter this verification code on the verify-email page to activate your account.
              </p>
              <p style="margin:0 0 24px;text-align:center;">
                <span style="display:inline-block;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:16px 28px;font-size:32px;font-weight:700;letter-spacing:0.35em;color:#0F172A;">
                  ${otp}
                </span>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">
                This code expires in <strong style="color:#0F172A;">10 minutes</strong>. If you did not create an account, you can ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;text-align:center;">
                Need help? Contact <a href="mailto:${supportEmail}" style="color:#22B573;text-decoration:none;">${supportEmail}</a><br />
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

  const text = `Verify your Quanta Loop email\n\nYour verification code is: ${otp}\n\nThis code expires in 10 minutes.\n\nSupport: ${supportEmail}`;

  return {
    subject: "Your Quanta Loop verification code",
    html,
    text,
  };
}

module.exports = { buildEmailVerificationEmail };
