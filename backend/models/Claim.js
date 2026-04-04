const mongoose = require("mongoose");

const claimSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    userId: String,
    title: String,
    status: { type: String, default: "pending" }, // pending, approved, rejected, paid
    amount: Number,
    reason: String,
    incidentDate: String,
    evidenceUrls: [String],
    reviewedBy: String,
    reviewedAt: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Claim", claimSchema);
