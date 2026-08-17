function buildGoogleAccountEmail({ loginUrl, setPasswordUrl, supportEmail, logoUrl }) {
  const year = new Date().getFullYear();

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign in to Quanta Loop</title>
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
              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;color:#0F172A;">This account uses Google Sign-In</h1>
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#64748B;">
                We received a password reset request, but your Quanta Loop account was created with Google. Continue with Google to sign in, or set a password if you also want email login.
              </p>
              <p style="margin:0 0 12px;text-align:center;">
                <a href="${loginUrl}" style="display:inline-block;background:#22B573;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:12px;">
                  Continue with Google
                </a>
              </p>
              <p style="margin:0 0 20px;text-align:center;font-size:14px;color:#64748B;">or</p>
              <p style="margin:0 0 24px;text-align:center;">
                <a href="${setPasswordUrl}" style="display:inline-block;border:1px solid #CBD5E1;color:#0F172A;text-decoration:none;font-size:15px;font-weight:600;padding:13px 24px;border-radius:12px;">
                  Set a Password
                </a>
              </p>
              <p style="margin:0;font-size:13px;line-height:1.6;color:#64748B;">
                The set-password link expires in <strong style="color:#0F172A;">30 minutes</strong>. If you did not request this, you can ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 28px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#64748B;text-align:center;">
                Support: <a href="mailto:${supportEmail}" style="color:#22B573;text-decoration:none;">${supportEmail}</a><br />
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

  const text = `This Quanta Loop account uses Google Sign-In.\n\nSign in: ${loginUrl}\nSet a password: ${setPasswordUrl}\n\nSupport: ${supportEmail}`;

  return {
    subject: "Your Quanta Loop account uses Google Sign-In",
    html,
    text,
  };
}

module.exports = { buildGoogleAccountEmail };
