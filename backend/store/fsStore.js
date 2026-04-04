// MongoDB-backed persistence for Riskora (replaces local JSON storage).
const User = require("../models/User");
const UserPolicy = require("../models/UserPolicy");
const Claim = require("../models/Claim");
const ParametricPayout = require("../models/ParametricPayout");

function nextId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// —— Users ——
async function findUserByEmail(email) {
  const e = String(email).toLowerCase();
  return await User.findOne({ email: e });
}

async function findUserByPhone(phone) {
  return await User.findOne({ phone });
}

async function findUserById(id) {
  return await User.findOne({ id });
}

async function createUser(userData) {
  const user = new User(userData);
  return await user.save();
}

async function updateUser(id, patch) {
  return await User.findOneAndUpdate(
    { id },
    { $set: { ...patch, updatedAt: new Date().toISOString() } },
    { new: true }
  );
}

// —— Policies ——
async function listPoliciesForUser(userId) {
  return await UserPolicy.find({ userId });
}

async function findPolicyById(id) {
  return await UserPolicy.findOne({ id });
}

async function createUserPolicy(policyData) {
  const policy = new UserPolicy(policyData);
  return await policy.save();
}

async function updateUserPolicy(id, patch) {
  return await UserPolicy.findOneAndUpdate(
    { id },
    { $set: { ...patch, updatedAt: new Date().toISOString() } },
    { new: true }
  );
}

// —— Claims ——
async function listClaimsForUser(userId) {
  return await Claim.find({ userId });
}

async function findClaimById(id) {
  return await Claim.findOne({ id });
}

async function createClaim(claimData) {
  const claim = new Claim(claimData);
  return await claim.save();
}

async function updateClaim(id, patch) {
  return await Claim.findOneAndUpdate(
    { id },
    { $set: { ...patch, updatedAt: new Date().toISOString() } },
    { new: true }
  );
}

// —— Parametric Payouts ——
async function listParametricPayoutsForUser(userId) {
  return await ParametricPayout.find({ userId });
}

async function createParametricPayout(payoutData) {
  const payout = new ParametricPayout(payoutData);
  return await payout.save();
}

module.exports = {
  nextId,
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  listPoliciesForUser,
  findPolicyById,
  createUserPolicy,
  updateUserPolicy,
  listClaimsForUser,
  findClaimById,
  createClaim,
  updateClaim,
  updateUser,
  listParametricPayoutsForUser,
  createParametricPayout,
};
