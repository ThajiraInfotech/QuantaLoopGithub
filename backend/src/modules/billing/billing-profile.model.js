const mongoose = require("mongoose");

const billingAddressSchema = new mongoose.Schema(
  {
    line1: { type: String, trim: true, default: "", maxlength: 200 },
    line2: { type: String, trim: true, default: "", maxlength: 200 },
    city: { type: String, trim: true, default: "", maxlength: 120 },
    state: { type: String, trim: true, default: "", maxlength: 80 },
    stateCode: { type: String, trim: true, default: "", maxlength: 8 },
    pincode: { type: String, trim: true, default: "", maxlength: 20 },
    country: { type: String, trim: true, default: "IN", maxlength: 8, uppercase: true },
  },
  { _id: false }
);

const taxQuoteSchema = new mongoose.Schema(
  {
    catalogPlanId: { type: String, trim: true, default: "" },
    currency: { type: String, trim: true, default: "INR" },
    amountInclusivePaise: { type: Number, default: 0 },
    taxablePaise: { type: Number, default: 0 },
    cgstPaise: { type: Number, default: 0 },
    sgstPaise: { type: Number, default: 0 },
    igstPaise: { type: Number, default: 0 },
    totalGstPaise: { type: Number, default: 0 },
    taxType: { type: String, trim: true, default: "" },
    taxTreatment: { type: String, trim: true, default: "" },
    placeOfSupply: { type: String, trim: true, default: "" },
    placeOfSupplyGstCode: { type: String, trim: true, default: null },
    sacCode: { type: String, trim: true, default: null },
    isExport: { type: Boolean, default: false },
    quotedAt: { type: Date, default: null },
  },
  { _id: false }
);

const billingProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    legalName: { type: String, required: true, trim: true, maxlength: 200 },
    billingEmail: { type: String, trim: true, lowercase: true, default: "", maxlength: 200 },
    customerType: {
      type: String,
      enum: ["individual", "business"],
      default: "business",
    },
    gstRegistered: { type: Boolean, default: false },
    gstin: { type: String, trim: true, uppercase: true, default: "", maxlength: 15 },
    address: { type: billingAddressSchema, default: () => ({}) },
    taxId: { type: String, trim: true, default: "", maxlength: 40 },
    pendingTaxQuote: { type: taxQuoteSchema, default: null },
  },
  { timestamps: true }
);

function toPublicBillingProfile(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id.toString(),
    legalName: o.legalName || "",
    billingEmail: o.billingEmail || "",
    customerType: o.customerType || "business",
    gstRegistered: Boolean(o.gstRegistered),
    gstin: o.gstin || "",
    address: {
      line1: o.address?.line1 || "",
      line2: o.address?.line2 || "",
      city: o.address?.city || "",
      state: o.address?.state || "",
      stateCode: o.address?.stateCode || "",
      pincode: o.address?.pincode || "",
      country: (o.address?.country || "IN").toUpperCase(),
    },
    taxId: o.taxId || "",
    updatedAt: o.updatedAt || null,
  };
}

const BillingProfile = mongoose.model("BillingProfile", billingProfileSchema);

module.exports = {
  BillingProfile,
  toPublicBillingProfile,
};
