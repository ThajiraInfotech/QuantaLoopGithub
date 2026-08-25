function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatInr(amount) {
  return `₹${Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildInvoiceHtml(invoice) {
  const buyer = invoice.buyer || {};
  const seller = invoice.seller || {};
  const address = buyer.address || {};
  const lines = [];
  if (!invoice.isExport) {
    lines.push(
      `<tr><td>Taxable value</td><td style="text-align:right">${formatInr(invoice.taxableAmount)}</td></tr>`
    );
    if (invoice.taxType === "cgst_sgst") {
      lines.push(
        `<tr><td>CGST @ 9%</td><td style="text-align:right">${formatInr(invoice.cgstAmount)}</td></tr>`,
        `<tr><td>SGST @ 9%</td><td style="text-align:right">${formatInr(invoice.sgstAmount)}</td></tr>`
      );
    } else if (invoice.taxType === "igst") {
      lines.push(
        `<tr><td>IGST @ 18%</td><td style="text-align:right">${formatInr(invoice.igstAmount)}</td></tr>`
      );
    }
  } else {
    lines.push(
      `<tr><td>Service value (export)</td><td style="text-align:right">${formatInr(invoice.amountInclusive)}</td></tr>`,
      `<tr><td>GST</td><td style="text-align:right">${formatInr(0)}</td></tr>`
    );
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title></head>
<body style="font-family:Arial,sans-serif;color:#18181b;line-height:1.5;max-width:640px;margin:0 auto;padding:24px">
  <h1 style="font-size:20px;margin:0 0 4px">Tax Invoice</h1>
  <p style="margin:0 0 16px;color:#52525b">${escapeHtml(invoice.invoiceNumber)} · ${escapeHtml(
    new Date(invoice.invoiceDate).toISOString().slice(0, 10)
  )}</p>
  <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
    <tr>
      <td style="vertical-align:top;width:50%;padding-right:12px">
        <strong>Seller</strong><br/>
        ${escapeHtml(seller.legalName)}<br/>
        ${seller.gstin ? `GSTIN: ${escapeHtml(seller.gstin)}<br/>` : ""}
        ${seller.address ? `${escapeHtml(seller.address)}<br/>` : ""}
        ${escapeHtml(seller.stateName || seller.stateCode || "")}
      </td>
      <td style="vertical-align:top;width:50%">
        <strong>Bill to</strong><br/>
        ${escapeHtml(buyer.legalName)}<br/>
        ${buyer.gstin ? `GSTIN: ${escapeHtml(buyer.gstin)}<br/>` : ""}
        ${escapeHtml(address.line1)}<br/>
        ${address.line2 ? `${escapeHtml(address.line2)}<br/>` : ""}
        ${escapeHtml([address.city, address.state, address.pincode].filter(Boolean).join(", "))}<br/>
        ${escapeHtml(address.country || "")}
      </td>
    </tr>
  </table>
  <p style="margin:0 0 8px"><strong>Description:</strong> ${escapeHtml(invoice.description)}</p>
  <p style="margin:0 0 8px"><strong>Place of supply:</strong> ${escapeHtml(
    invoice.placeOfSupply || "—"
  )}</p>
  <p style="margin:0 0 16px"><strong>SAC:</strong> ${escapeHtml(
    invoice.sacCode || "Pending CA confirmation"
  )}${
    invoice.isExport
      ? `<br/><strong>Tax treatment:</strong> Export of services (configured)`
      : ""
  }</p>
  <table style="width:100%;border-collapse:collapse">
    ${lines.join("")}
    <tr>
      <td style="padding-top:8px;border-top:1px solid #e4e4e7"><strong>Total</strong></td>
      <td style="padding-top:8px;border-top:1px solid #e4e4e7;text-align:right"><strong>${formatInr(
        invoice.amountInclusive
      )}</strong></td>
    </tr>
  </table>
  <p style="margin-top:24px;font-size:12px;color:#71717a">
    Payment reference: ${escapeHtml(invoice.razorpayPaymentId || "—")}
  </p>
</body>
</html>`;
}

function buildInvoiceEmailText(invoice) {
  const parts = [
    `Tax Invoice ${invoice.invoiceNumber}`,
    `Date: ${new Date(invoice.invoiceDate).toISOString().slice(0, 10)}`,
    `Bill to: ${invoice.buyer?.legalName || ""}`,
    `Place of supply: ${invoice.placeOfSupply || "—"}`,
    `Total: ₹${Number(invoice.amountInclusive).toFixed(2)}`,
    `Payment ID: ${invoice.razorpayPaymentId || "—"}`,
  ];
  return parts.join("\n");
}

module.exports = {
  buildInvoiceHtml,
  buildInvoiceEmailText,
};
