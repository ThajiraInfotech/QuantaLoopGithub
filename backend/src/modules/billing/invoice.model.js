const mongoose = require("mongoose");

const buyerSnapshotSchema = new mongoose.Schema(
  {
    legalName: { type: String, trim: true, default: "" },
    billingEmail: { type: String, trim: true, default: "" },
    customerType: { type: String, trim: true, default: "business" },
    gstRegistered: { type: Boolean, default: false },
    gstin: { type: String, trim: true, default: null },
    taxId: { type: String, trim: true, default: null },
    address: {
      line1: { type: String, default: "" },
      line2: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      stateCode: { type: String, default: "" },
      pincode: { type: String, default: "" },
      country: { type: String, default: "IN" },
    },
  },
  { _id: false }
);

const sellerSnapshotSchema = new mongoose.Schema(
  {
    legalName: { type: String, trim: true, default: "" },
    operatedBy: { type: String, trim: true, default: null },
    gstin: { type: String, trim: true, default: null },
    address: { type: String, trim: true, default: null },
    stateCode: { type: String, trim: true, default: "" },
    stateName: { type: String, trim: true, default: "" },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    invoiceDate: { type: Date, required: true, index: true },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
      default: null,
      index: true,
    },
    catalogPlanId: { type: String, trim: true, default: "" },
    razorpayPaymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpaySubscriptionId: { type: String, trim: true, default: null },
    razorpayOrderId: { type: String, trim: true, default: null },
    status: {
      type: String,
      enum: ["issued", "cancelled"],
      default: "issued",
      index: true,
    },
    currency: { type: String, default: "INR" },
    description: { type: String, trim: true, default: "Annual platform access" },
    sacCode: { type: String, trim: true, default: null },
    placeOfSupply: { type: String, trim: true, default: "" },
    placeOfSupplyGstCode: { type: String, trim: true, default: null },
    taxType: { type: String, trim: true, default: "" },
    taxTreatment: { type: String, trim: true, default: "" },
    isExport: { type: Boolean, default: false },
    gstRate: { type: Number, default: 0.18 },
    amountInclusivePaise: { type: Number, required: true },
    taxablePaise: { type: Number, required: true },
    cgstPaise: { type: Number, default: 0 },
    sgstPaise: { type: Number, default: 0 },
    igstPaise: { type: Number, default: 0 },
    totalGstPaise: { type: Number, default: 0 },
    buyer: { type: buyerSnapshotSchema, required: true },
    seller: { type: sellerSnapshotSchema, required: true },
    htmlBody: { type: String, default: "" },
  },
  { timestamps: true }
);

invoiceSchema.index({ user: 1, invoiceDate: -1 });

function money(paise) {
  return Number((Number(paise || 0) / 100).toFixed(2));
}

function toPublicInvoice(doc) {
  if (!doc) return null;
  const o = doc.toObject ? doc.toObject() : doc;
  return {
    id: o._id.toString(),
    invoiceNumber: o.invoiceNumber,
    invoiceDate: o.invoiceDate,
    status: o.status,
    currency: o.currency,
    description: o.description,
    sacCode: o.sacCode,
    placeOfSupply: o.placeOfSupply,
    placeOfSupplyGstCode: o.placeOfSupplyGstCode,
    taxType: o.taxType,
    taxTreatment: o.taxTreatment,
    isExport: Boolean(o.isExport),
    gstRate: o.gstRate,
    amountInclusive: money(o.amountInclusivePaise),
    taxableAmount: money(o.taxablePaise),
    cgstAmount: money(o.cgstPaise),
    sgstAmount: money(o.sgstPaise),
    igstAmount: money(o.igstPaise),
    totalGstAmount: money(o.totalGstPaise),
    buyer: o.buyer,
    seller: o.seller,
    catalogPlanId: o.catalogPlanId,
    razorpayPaymentId: o.razorpayPaymentId,
    razorpaySubscriptionId: o.razorpaySubscriptionId,
    razorpayOrderId:
      o.razorpayOrderId ||
      (o.subscription && o.subscription.razorpayOrderId) ||
      null,
    subscriptionId: o.subscription ? String(o.subscription) : null,
    createdAt: o.createdAt,
  };
}

const Invoice = mongoose.model("Invoice", invoiceSchema);

module.exports = {
  Invoice,
  toPublicInvoice,
};
