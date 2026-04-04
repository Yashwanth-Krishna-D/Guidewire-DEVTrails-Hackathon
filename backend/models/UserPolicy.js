const mongoose = require("mongoose");

const userPolicySchema = new mongoose.Schema(
  {
    id: { type: String, unique: true },
    userId: String,
    stateCode: String,
    stateName: String,
    district: String,
    platform: String,
    hoursPerDay: Number,
    daysActive: Number,
    tierId: String,
    weeklyPremiumInr: Number,
    maxWeeklyPayout: Number,
    subscriptionActive: { type: Boolean, default: true },
    activatedAt: { type: String, default: () => new Date().toISOString() },
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserPolicy", userPolicySchema);
