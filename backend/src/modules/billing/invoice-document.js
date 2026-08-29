function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatMoney(amount, currency = "INR") {
  const code = String(currency || "INR").toUpperCase();
  if (code === "USD") {
    return `$${Number(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatInvoiceDate(value) {
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "—";
  }
}

function buildAmountRows(invoice) {
  const money = (value) => formatMoney(value, invoice.currency);
  const rows = [];
  if (!invoice.isExport) {
    rows.push({
      label: "Taxable value",
      value: money(invoice.taxableAmount),
    });
    if (invoice.taxType === "cgst_sgst") {
      rows.push(
        { label: "CGST @ 9%", value: money(invoice.cgstAmount) },
        { label: "SGST @ 9%", value: money(invoice.sgstAmount) }
      );
    } else if (invoice.taxType === "igst") {
      rows.push({ label: "IGST @ 18%", value: money(invoice.igstAmount) });
    }
  } else {
    rows.push(
      {
        label: "Service value (export)",
        value: money(invoice.amountInclusive),
      },
      { label: "GST", value: money(0) }
    );
  }
  return rows;
}

function buildInvoiceHtml(invoice, { logoUrl } = {}) {
  const year = new Date().getFullYear();
  const buyer = invoice.buyer || {};
  const seller = invoice.seller || {};
  const address = buyer.address || {};
  const invoiceDate = formatInvoiceDate(invoice.invoiceDate);
  const safeInvoiceNumber = escapeHtml(invoice.invoiceNumber);
  const safeLogoUrl = escapeHtml(logoUrl || "");
  const amountRows = buildAmountRows(invoice);

  const buyerAddressLines = [
    address.line1,
    address.line2,
    [address.city, address.state, address.pincode].filter(Boolean).join(", "),
    address.country,
  ]
    .filter(Boolean)
    .map((line) => escapeHtml(line));

  const amountRowsHtml = amountRows
    .map(
      (row) => `
                      <tr>
                        <td style="padding:10px 0;font-size:14px;color:#5C6670;border-bottom:1px solid #E2E7EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${escapeHtml(row.label)}</td>
                        <td style="padding:10px 0;font-size:14px;color:#0F1416;text-align:right;border-bottom:1px solid #E2E7EB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${row.value}</td>
                      </tr>`
    )
    .join("");

  const logoBlock = safeLogoUrl
    ? `<img src="${safeLogoUrl}" alt="Quanta Loop" width="160" height="66" style="display:block;width:160px;height:auto;max-width:160px;border:0;outline:none;text-decoration:none;background-color:#FFFFFF;" />`
    : `<span style="font-size:18px;font-weight:700;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Quanta Loop</span>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>Tax Invoice ${safeInvoiceNumber}</title>
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
    Tax invoice ${safeInvoiceNumber} from Quanta Loop — total ${escapeHtml(formatMoney(invoice.amountInclusive, invoice.currency))}.
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#EEF1F3;padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;">
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
                          ${logoBlock}
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
                <!-- Header -->
                <tr>
                  <td style="padding:32px 40px 8px;">
                    <p style="margin:0 0 8px;font-size:12px;line-height:1.4;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#2BAA6B;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Tax invoice
                    </p>
                    <h1 style="margin:0 0 8px;font-size:26px;line-height:1.25;font-weight:700;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      ${safeInvoiceNumber}
                    </h1>
                    <p style="margin:0 0 28px;font-size:14px;line-height:1.5;color:#5C6670;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                      Invoice date: ${escapeHtml(invoiceDate)}
                    </p>
                  </td>
                </tr>
                <!-- Parties -->
                <tr>
                  <td style="padding:0 40px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      <tr>
                        <td width="50%" valign="top" style="padding-right:12px;">
                          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8A939C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Seller</p>
                          <p style="margin:0;font-size:14px;line-height:1.6;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <strong>${escapeHtml(seller.legalName)}</strong><br />
                            ${
                              seller.operatedBy
                                ? `<span style="color:#5C6670;">Operated by ${escapeHtml(seller.operatedBy)}</span><br />`
                                : ""
                            }
                            ${seller.gstin ? `GSTIN: ${escapeHtml(seller.gstin)}<br />` : ""}
                            ${seller.address ? `${escapeHtml(seller.address)}<br />` : ""}
                            ${escapeHtml(seller.stateName || seller.stateCode || "")}
                          </p>
                        </td>
                        <td width="50%" valign="top" style="padding-left:12px;">
                          <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#8A939C;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Bill to</p>
                          <p style="margin:0;font-size:14px;line-height:1.6;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <strong>${escapeHtml(buyer.legalName)}</strong><br />
                            ${buyer.gstin ? `GSTIN: ${escapeHtml(buyer.gstin)}<br />` : ""}
                            ${buyerAddressLines.join("<br />")}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Meta -->
                <tr>
                  <td style="padding:0 40px 24px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#F4F6F7;border:1px solid #E2E7EB;border-radius:10px;">
                      <tr>
                        <td style="padding:16px 18px;">
                          <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <strong>Description:</strong> ${escapeHtml(invoice.description)}
                          </p>
                          <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <strong>Place of supply:</strong> ${escapeHtml(invoice.placeOfSupply || "—")}
                          </p>
                          <p style="margin:0;font-size:14px;line-height:1.55;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            <strong>SAC:</strong> ${escapeHtml(invoice.sacCode || "—")}
                            ${
                              invoice.isExport
                                ? `<br /><strong>Tax treatment:</strong> Export of services`
                                : ""
                            }
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Amounts -->
                <tr>
                  <td style="padding:0 40px 12px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                      ${amountRowsHtml}
                      <tr>
                        <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">Total</td>
                        <td style="padding:14px 0 0;font-size:15px;font-weight:700;color:#0F1416;text-align:right;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">${formatMoney(invoice.amountInclusive, invoice.currency)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Payment ref -->
                <tr>
                  <td style="padding:12px 40px 36px;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#E8F7EF;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 18px;">
                          <p style="margin:0;font-size:13px;line-height:1.55;color:#0F1416;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
                            Payment reference: <strong>${escapeHtml(invoice.razorpayPaymentId || "—")}</strong>
                            ${
                              invoice.razorpayOrderId
                                ? `<br />Order ID: <strong>${escapeHtml(invoice.razorpayOrderId)}</strong>`
                                : ""
                            }
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
                ${
                  seller.operatedBy
                    ? `<br />Operated by ${escapeHtml(seller.operatedBy)}`
                    : ""
                }
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
}

function buildInvoiceEmailText(invoice) {
  const parts = [
    "Quanta Loop — Tax invoice",
    "",
    `Tax Invoice ${invoice.invoiceNumber}`,
    `Date: ${formatInvoiceDate(invoice.invoiceDate)}`,
    `Bill to: ${invoice.buyer?.legalName || ""}`,
    `Place of supply: ${invoice.placeOfSupply || "—"}`,
    `Total: ${formatMoney(invoice.amountInclusive, invoice.currency)}`,
    `Payment ID: ${invoice.razorpayPaymentId || "—"}`,
    invoice.razorpayOrderId ? `Order ID: ${invoice.razorpayOrderId}` : null,
  ].filter(Boolean);
  return parts.join("\n");
}

module.exports = {
  buildInvoiceHtml,
  buildInvoiceEmailText,
};
