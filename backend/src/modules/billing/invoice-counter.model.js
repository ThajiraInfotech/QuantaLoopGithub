const mongoose = require("mongoose");

const invoiceCounterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    seq: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

const InvoiceCounter = mongoose.model("InvoiceCounter", invoiceCounterSchema);

async function nextInvoiceNumber(prefix = "QL", at = new Date()) {
  const year = at.getUTCFullYear();
  const key = `${prefix}-${year}`;
  const counter = await InvoiceCounter.findOneAndUpdate(
    { key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  const seq = String(counter.seq).padStart(6, "0");
  return `${prefix}-${year}-${seq}`;
}

module.exports = { InvoiceCounter, nextInvoiceNumber };
