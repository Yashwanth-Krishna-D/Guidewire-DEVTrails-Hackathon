const mongoose = require("mongoose");

const parametricPayoutSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    userId: String,
    stateCode: String,
    district: String,
    amount: Number,
    severity: Number,
    fraudScore: Number,
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ParametricPayout", parametricPayoutSchema);
