const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    status: {
      type: String,
      enum: ["processing", "processed", "failed"],
      default: "processing",
      index: true,
    },
    payload: { type: mongoose.Schema.Types.Mixed, default: {} },
    attempts: { type: Number, default: 1, min: 1 },
    processedAt: { type: Date, default: null },
    lastError: { type: String, default: null, maxlength: 1000 },
  },
  { timestamps: true, minimize: false }
);

const WebhookEvent = mongoose.model("RazorpayWebhookEvent", webhookEventSchema);

module.exports = { WebhookEvent };
