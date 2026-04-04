const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    id: { type: String, unique: true }, // Custom ID like usr_...
    name: String,
    email: { type: String, unique: true, lowercase: true },
    phone: { type: String, unique: true },
    passwordHash: String,
    dateOfBirth: String,
    validationCoefficient: { type: Number, default: 0.85 },
    gigProfile: {
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
    },
    locationHistory: [
      {
        lat: Number,
        lng: Number,
        timestamp: String,
        accuracy: Number,
        activity: String,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
