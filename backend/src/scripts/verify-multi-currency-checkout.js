/**
 * DB-free checks for INR vs USD membership pricing at checkout.
 * Run from backend/: node src/scripts/verify-multi-currency-checkout.js
 */
const assert = require("node:assert/strict");

const {
  createSubscriptionCatalog,
  DEFAULT_USD_AMOUNT_CENTS,
} = require("../config/subscriptionCatalog");
const { calculateTaxBreakdown } = require("../modules/billing/gst.engine");
const {
  paymentUnlocksMembership,
} = require("../modules/subscriptions/subscription.service");
const {
  buildInvoiceHtml,
  buildInvoiceEmailText,
} = require("../modules/billing/invoice-document");

const catalog = createSubscriptionCatalog({});

const inr = catalog.getPlanForCountry("annual_access", "IN");
assert.equal(inr.currency, "INR");
assert.equal(inr.amountMinor, 699900);
assert.equal(inr.amount, 6999);

const usd = catalog.getPlanForCountry("annual_access", "US");
assert.equal(usd.currency, "USD");
assert.equal(usd.amountMinor, DEFAULT_USD_AMOUNT_CENTS);
assert.equal(usd.amount, 99);

const ae = catalog.getPlanForCountry("annual_access", "AE");
assert.equal(ae.currency, "USD");
assert.equal(ae.amountMinor, DEFAULT_USD_AMOUNT_CENTS);

assert.equal(catalog.getPlan("annual_access").currency, "INR");
assert.equal(catalog.getPlanForCurrency("annual_access", "USD").amountMinor, 9900);
assert.equal(catalog.getPlanForCurrency("annual_access", "INR").amountMinor, 699900);

const indiaTax = calculateTaxBreakdown({
  amountInclusivePaise: inr.amountMinor,
  buyerCountry: "IN",
  buyerStateCode: "TN",
  supplierStateCode: "TN",
  gstRegistered: false,
  exportTreatment: "zero_rated_lut",
  currency: "INR",
});
assert.equal(indiaTax.currency, "INR");
assert.equal(indiaTax.isExport, false);
assert.equal(indiaTax.taxType, "cgst_sgst");
assert.equal(indiaTax.amountInclusivePaise, 699900);

const usTax = calculateTaxBreakdown({
  amountInclusivePaise: usd.amountMinor,
  buyerCountry: "US",
  buyerStateCode: "",
  supplierStateCode: "TN",
  gstRegistered: false,
  exportTreatment: "zero_rated_lut",
  currency: "USD",
});
assert.equal(usTax.currency, "USD");
assert.equal(usTax.isExport, true);
assert.equal(usTax.taxType, "export_zero_rated");
assert.equal(usTax.amountInclusivePaise, 9900);
assert.equal(usTax.totalGstPaise, 0);

assert.equal(
  paymentUnlocksMembership(
    { status: "captured", amount: 699900, currency: "INR" },
    inr
  ),
  true
);
assert.equal(
  paymentUnlocksMembership(
    { status: "captured", amount: 9900, currency: "USD" },
    usd
  ),
  true
);
assert.equal(
  paymentUnlocksMembership(
    { status: "captured", amount: 9900, currency: "USD" },
    inr
  ),
  false
);
assert.equal(
  paymentUnlocksMembership(
    { status: "captured", amount: 699900, currency: "INR" },
    usd
  ),
  false
);

const usdInvoiceHtml = buildInvoiceHtml({
  invoiceNumber: "QL-TEST-USD",
  invoiceDate: new Date("2026-01-15"),
  currency: "USD",
  isExport: true,
  amountInclusive: 99,
  taxableAmount: 99,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  totalGstAmount: 0,
  placeOfSupply: "US",
  taxType: "export_zero_rated",
  buyer: { legalName: "Acme LLC", address: { country: "US", city: "Austin" } },
  seller: { legalName: "Quanta Loop" },
  razorpayPaymentId: "pay_test_usd",
});
assert.match(usdInvoiceHtml, /\$99\.00/);
assert.doesNotMatch(usdInvoiceHtml, /₹99/);

const inrInvoiceHtml = buildInvoiceHtml({
  invoiceNumber: "QL-TEST-INR",
  invoiceDate: new Date("2026-01-15"),
  currency: "INR",
  isExport: false,
  taxType: "cgst_sgst",
  amountInclusive: 6999,
  taxableAmount: 5931.36,
  cgstAmount: 533.82,
  sgstAmount: 533.82,
  igstAmount: 0,
  totalGstAmount: 1067.64,
  placeOfSupply: "TN",
  buyer: { legalName: "Acme India", address: { country: "IN", city: "Chennai" } },
  seller: { legalName: "Quanta Loop" },
  razorpayPaymentId: "pay_test_inr",
});
assert.match(inrInvoiceHtml, /₹6,999\.00/);

const usdText = buildInvoiceEmailText({
  invoiceNumber: "QL-TEST-USD",
  invoiceDate: new Date("2026-01-15"),
  currency: "USD",
  amountInclusive: 99,
  placeOfSupply: "US",
  buyer: { legalName: "Acme LLC" },
  razorpayPaymentId: "pay_test_usd",
});
assert.match(usdText, /\$99\.00/);

// Env override for USD list price
const catalogCustom = createSubscriptionCatalog({
  ANNUAL_ACCESS_USD_AMOUNT_CENTS: "14900",
});
assert.equal(
  catalogCustom.getPlanForCountry("annual_access", "GB").amountMinor,
  14900
);
assert.equal(catalogCustom.getPlanForCountry("annual_access", "IN").amountMinor, 699900);

process.stdout.write("verify-multi-currency-checkout: ok\n");
