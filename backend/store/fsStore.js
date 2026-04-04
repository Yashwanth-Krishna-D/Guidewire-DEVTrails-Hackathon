// File-backed persistence for Riskora (no external DB required).
const fs = require("fs");
const path = require("path");

const DATA_PATH = path.join(__dirname, "..", "data", "riskora.json");

function emptyDb() {
  return { users: [], userPolicies: [], claims: [], parametricPayouts: [] };
}

function load() {
  try {
    if (!fs.existsSync(DATA_PATH)) return emptyDb();
    const raw = fs.readFileSync(DATA_PATH, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data.users)) data.users = [];
    if (!Array.isArray(data.userPolicies)) data.userPolicies = [];
    if (!Array.isArray(data.claims)) data.claims = [];
    if (!Array.isArray(data.parametricPayouts)) data.parametricPayouts = [];
    return data;
  } catch {
    return emptyDb();
  }
}

function save(data) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  const tmp = `${DATA_PATH}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, DATA_PATH);
}

function nextId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// —— Users ——
function findUserByEmail(email) {
  const e = String(email).toLowerCase();
  return load().users.find((u) => u.email === e) || null;
}

function findUserByPhone(phone) {
  return load().users.find((u) => u.phone === phone) || null;
}

function findUserById(id) {
  return load().users.find((u) => u.id === id) || null;
}

function createUser(user) {
  const db = load();
  db.users.push(user);
  save(db);
  return user;
}

function updateUser(id, patch) {
  const db = load();
  const i = db.users.findIndex((u) => u.id === id);
  if (i === -1) return null;
  db.users[i] = { ...db.users[i], ...patch, updatedAt: new Date().toISOString() };
  save(db);
  return db.users[i];
}

// —— Policies ——
function listPoliciesForUser(userId) {
  return load().userPolicies.filter((p) => p.userId === userId);
}

function findPolicyById(id) {
  return load().userPolicies.find((p) => p.id === id) || null;
}

function createUserPolicy(row) {
  const db = load();
  db.userPolicies.push(row);
  save(db);
  return row;
}

function updateUserPolicy(id, patch) {
  const db = load();
  const i = db.userPolicies.findIndex((p) => p.id === id);
  if (i === -1) return null;
  db.userPolicies[i] = { ...db.userPolicies[i], ...patch, updatedAt: new Date().toISOString() };
  save(db);
  return db.userPolicies[i];
}

// —— Claims ——
function listClaimsForUser(userId) {
  return load().claims.filter((c) => c.userId === userId);
}

function findClaimById(id) {
  return load().claims.find((c) => c.id === id) || null;
}

function createClaim(row) {
  const db = load();
  db.claims.push(row);
  save(db);
  return row;
}

function updateClaim(id, patch) {
  const db = load();
  const i = db.claims.findIndex((c) => c.id === id);
  if (i === -1) return null;
  db.claims[i] = { ...db.claims[i], ...patch, updatedAt: new Date().toISOString() };
  save(db);
  return db.claims[i];
}

function listParametricPayoutsForUser(userId) {
  return load().parametricPayouts.filter((p) => p.userId === userId);
}

function createParametricPayout(row) {
  const db = load();
  db.parametricPayouts.push(row);
  save(db);
  return row;
}

module.exports = {
  DATA_PATH,
  load,
  save,
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
