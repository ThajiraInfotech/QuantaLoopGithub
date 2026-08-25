const { AppError } = require("../../utils/AppError");
const { toGstStateCode, normalizeAppStateCode } = require("./gst-state-codes");

const GST_RATE = 0.18;
const GSTIN_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

const TAX_TYPES = Object.freeze({
  CGST_SGST: "cgst_sgst",
  IGST: "igst",
  EXPORT_ZERO_RATED: "export_zero_rated",
});

function paiseFromMajor(amountMajor) {
  return Math.round(Number(amountMajor) * 100);
}

function majorFromPaise(paise) {
  return Number((Number(paise) / 100).toFixed(2));
}

function splitInclusiveGst(amountInclusivePaise) {
  const inclusive = Math.round(Number(amountInclusivePaise));
  if (!Number.isFinite(inclusive) || inclusive <= 0) {
    throw new AppError("Invalid inclusive amount", 400, "INVALID_TAX_AMOUNT");
  }
  const taxablePaise = Math.round(inclusive / (1 + GST_RATE));
  const totalGstPaise = inclusive - taxablePaise;
  return { taxablePaise, totalGstPaise };
}

function validateGstin(gstin, placeOfSupplyGstCode) {
  const value = String(gstin || "")
    .trim()
    .toUpperCase();
  if (!value) return null;
  if (!GSTIN_REGEX.test(value)) {
    throw new AppError("GSTIN format is invalid", 400, "INVALID_GSTIN");
  }
  if (
    placeOfSupplyGstCode &&
    value.slice(0, 2) !== String(placeOfSupplyGstCode)
  ) {
    throw new AppError(
      "GSTIN state code does not match the billing state",
      400,
      "GSTIN_STATE_MISMATCH"
    );
  }
  return value;
}

/**
 * Tax determination for a GST-inclusive catalog price.
 * Foreign treatment is configuration-driven (not auto zero from country alone).
 */
function calculateTaxBreakdown({
  amountInclusivePaise,
  buyerCountry,
  buyerStateCode,
  supplierStateCode,
  gstRegistered,
  gstin,
  exportTreatment,
  sacCode,
  currency = "INR",
}) {
  const country = String(buyerCountry || "IN")
    .trim()
    .toUpperCase();
  const supplierApp = normalizeAppStateCode(supplierStateCode);
  const supplierGst = toGstStateCode(supplierApp);
  if (!supplierGst) {
    throw new AppError(
      "Supplier billing state is not configured",
      503,
      "BILLING_SUPPLIER_STATE_INVALID"
    );
  }

  const inclusivePaise = Math.round(Number(amountInclusivePaise));
  const base = {
    currency: String(currency || "INR").toUpperCase(),
    amountInclusivePaise: inclusivePaise,
    amountInclusive: majorFromPaise(inclusivePaise),
    gstRate: GST_RATE,
    sacCode: sacCode || null,
    supplierStateCode: supplierApp,
    supplierGstStateCode: supplierGst,
  };

  if (country !== "IN") {
    const treatment = String(exportTreatment || "zero_rated_lut")
      .trim()
      .toLowerCase();
    if (treatment === "manual_review" || treatment === "disabled") {
      throw new AppError(
        "Overseas billing is not enabled yet. Please contact support.",
        400,
        "EXPORT_BILLING_NOT_ENABLED"
      );
    }
    if (treatment !== "zero_rated_lut") {
      throw new AppError(
        "Unsupported export tax treatment configuration",
        503,
        "INVALID_EXPORT_TREATMENT"
      );
    }
    // Eligible export under configured LUT treatment: full amount is service
    // value — do not divide by 1.18.
    return {
      ...base,
      taxType: TAX_TYPES.EXPORT_ZERO_RATED,
      taxTreatment: "export_zero_rated_lut",
      placeOfSupply: country,
      placeOfSupplyGstCode: null,
      buyerStateCode: "",
      buyerGstStateCode: null,
      taxablePaise: inclusivePaise,
      taxableAmount: majorFromPaise(inclusivePaise),
      cgstPaise: 0,
      sgstPaise: 0,
      igstPaise: 0,
      totalGstPaise: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalGstAmount: 0,
      gstin: null,
      isExport: true,
    };
  }

  const buyerApp = normalizeAppStateCode(buyerStateCode);
  const buyerGst = toGstStateCode(buyerApp);
  if (!buyerApp || !buyerGst) {
    throw new AppError(
      "A valid Indian billing state is required",
      400,
      "BILLING_STATE_REQUIRED"
    );
  }

  const normalizedGstin = gstRegistered
    ? validateGstin(gstin, buyerGst)
    : null;
  if (gstRegistered && !normalizedGstin) {
    throw new AppError("GSTIN is required for GST-registered buyers", 400, "GSTIN_REQUIRED");
  }

  const { taxablePaise, totalGstPaise } = splitInclusiveGst(inclusivePaise);
  const isIntraState = buyerGst === supplierGst;
  const half = Math.round(totalGstPaise / 2);
  const cgstPaise = isIntraState ? half : 0;
  const sgstPaise = isIntraState ? totalGstPaise - half : 0;
  const igstPaise = isIntraState ? 0 : totalGstPaise;

  return {
    ...base,
    taxType: isIntraState ? TAX_TYPES.CGST_SGST : TAX_TYPES.IGST,
    taxTreatment: isIntraState ? "intra_state" : "inter_state",
    placeOfSupply: buyerApp,
    placeOfSupplyGstCode: buyerGst,
    buyerStateCode: buyerApp,
    buyerGstStateCode: buyerGst,
    taxablePaise,
    taxableAmount: majorFromPaise(taxablePaise),
    cgstPaise,
    sgstPaise,
    igstPaise,
    totalGstPaise,
    cgstAmount: majorFromPaise(cgstPaise),
    sgstAmount: majorFromPaise(sgstPaise),
    igstAmount: majorFromPaise(igstPaise),
    totalGstAmount: majorFromPaise(totalGstPaise),
    gstin: normalizedGstin,
    isExport: false,
  };
}

module.exports = {
  GST_RATE,
  GSTIN_REGEX,
  TAX_TYPES,
  paiseFromMajor,
  majorFromPaise,
  splitInclusiveGst,
  validateGstin,
  calculateTaxBreakdown,
};
