/**
 * DB-free checks for GST inclusive math and place-of-supply paths.
 * Run: npm run test:billing-gst
 */
const assert = require("assert");
const {
  calculateTaxBreakdown,
  splitInclusiveGst,
} = require("../modules/billing/gst.engine");

const AMOUNT = 699900; // ₹6,999 in paise

const split = splitInclusiveGst(AMOUNT);
assert.strictEqual(split.taxablePaise, 593136);
assert.strictEqual(split.totalGstPaise, 106764);

const tn = calculateTaxBreakdown({
  amountInclusivePaise: AMOUNT,
  buyerCountry: "IN",
  buyerStateCode: "TN",
  supplierStateCode: "TN",
  gstRegistered: false,
  exportTreatment: "zero_rated_lut",
});
assert.strictEqual(tn.taxType, "cgst_sgst");
assert.strictEqual(tn.taxablePaise, 593136);
assert.strictEqual(tn.cgstPaise, 53382);
assert.strictEqual(tn.sgstPaise, 53382);
assert.strictEqual(tn.igstPaise, 0);
assert.strictEqual(tn.placeOfSupplyGstCode, "33");

const ka = calculateTaxBreakdown({
  amountInclusivePaise: AMOUNT,
  buyerCountry: "IN",
  buyerStateCode: "KA",
  supplierStateCode: "TN",
  gstRegistered: true,
  gstin: "29AABCU9603R1ZX",
  exportTreatment: "zero_rated_lut",
});
assert.strictEqual(ka.taxType, "igst");
assert.strictEqual(ka.igstPaise, 106764);
assert.strictEqual(ka.cgstPaise, 0);
assert.strictEqual(ka.placeOfSupplyGstCode, "29");

const exportInvoice = calculateTaxBreakdown({
  amountInclusivePaise: AMOUNT,
  buyerCountry: "AE",
  buyerStateCode: "",
  supplierStateCode: "TN",
  gstRegistered: false,
  exportTreatment: "zero_rated_lut",
});
assert.strictEqual(exportInvoice.taxType, "export_zero_rated");
assert.strictEqual(exportInvoice.taxablePaise, AMOUNT);
assert.strictEqual(exportInvoice.totalGstPaise, 0);

let blocked = false;
try {
  calculateTaxBreakdown({
    amountInclusivePaise: AMOUNT,
    buyerCountry: "US",
    supplierStateCode: "TN",
    exportTreatment: "manual_review",
  });
} catch (error) {
  blocked = error.code === "EXPORT_BILLING_NOT_ENABLED";
}
assert.ok(blocked, "manual_review export must block checkout");

process.stdout.write("verify-billing-gst: ok\n");
