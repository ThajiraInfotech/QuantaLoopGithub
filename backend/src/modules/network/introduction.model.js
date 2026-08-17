const mongoose = require("mongoose");

const introductionSchema = new mongoose.Schema(
  {
    provider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: { type: String, trim: true, maxlength: 2000, default: "" },
    relatedMaterial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Material",
      default: null,
    },
  },
  { timestamps: true }
);

introductionSchema.index({ provider: 1, buyer: 1, createdAt: -1 });

const IntroductionRequest = mongoose.model(
  "IntroductionRequest",
  introductionSchema
);

module.exports = { IntroductionRequest };
