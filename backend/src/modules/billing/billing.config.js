function createBillingConfig(env = {}) {
  const supplierStateCode = String(env.BILLING_SUPPLIER_STATE_CODE || "TN")
    .trim()
    .toUpperCase();
  const supplierStateName = String(
    env.BILLING_SUPPLIER_STATE || "Tamil Nadu"
  ).trim();
  const supplierGstin = String(env.BILLING_SUPPLIER_GSTIN || "")
    .trim()
    .toUpperCase();
  const sacCode = String(env.BILLING_SAC_CODE || "").trim() || null;
  const exportTreatment = String(
    env.BILLING_EXPORT_TREATMENT || "zero_rated_lut"
  )
    .trim()
    .toLowerCase();
  const invoicePrefix = String(env.BILLING_INVOICE_PREFIX || "QL").trim() || "QL";
  const sellerLegalName = String(
    env.BILLING_SELLER_LEGAL_NAME || "Quanta Loop"
  ).trim();
  const sellerAddress = String(env.BILLING_SELLER_ADDRESS || "").trim();

  return Object.freeze({
    supplierStateCode,
    supplierStateName,
    supplierGstin: supplierGstin || null,
    sacCode,
    exportTreatment,
    invoicePrefix,
    sellerLegalName,
    sellerAddress: sellerAddress || null,
  });
}

module.exports = { createBillingConfig };
