const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const {
  computeWeeklyPremium,
  listStateRiskTable,
  listPlatforms,
  listTiers,
  PLATFORM_HOURLY_INR,
} = require("../services/gigPremiumEngine");
const { evaluateDisruptionsForPlace, calculatePayout } = require("../services/disruptionEngine");
const {
  findUserById,
  updateUser,
  listParametricPayoutsForUser,
  createParametricPayout,
  nextId,
} = require("../store/fsStore");

const LEGACY_ZONE = {
  "BLR-N": { stateCode: "KA", stateName: "Karnataka", district: "Bengaluru Rural" },
  "BLR-S": { stateCode: "KA", stateName: "Karnataka", district: "Bengaluru Urban" },
  "BLR-E": { stateCode: "KA", stateName: "Karnataka", district: "Bengaluru Urban" },
  "MUM-W": { stateCode: "MH", stateName: "Maharashtra", district: "Mumbai City" },
  "MUM-E": { stateCode: "MH", stateName: "Maharashtra", district: "Mumbai Suburban" },
  "DEL-C": { stateCode: "DL", stateName: "New Delhi", district: "New Delhi" },
  "HYD-C": { stateCode: "TG", stateName: "Telangana", district: "Hyderabad" },
  "CHE-N": { stateCode: "TN", stateName: "Tamil Nadu", district: "Chennai" },
};

router.get("/catalog", (_req, res) => {
  res.json({
    platforms: listPlatforms(),
    tiers: listTiers(),
    stateRisk: listStateRiskTable(),
  });
});

router.use(authMiddleware);

function accountAgeDays(user) {
  const t = new Date(user.createdAt || Date.now()).getTime();
  return Math.max(1, Math.floor((Date.now() - t) / (24 * 3600 * 1000)));
}

function ensureGigDefaults(user) {
  const g = user.gigProfile;
  if (g && g.stateCode && g.district && g.stateName) return g;
  if (g && g.zoneId && LEGACY_ZONE[g.zoneId]) {
    return { ...g, ...LEGACY_ZONE[g.zoneId], subscriptionActive: g.subscriptionActive !== false };
  }
  return {
    stateCode: "KA",
    stateName: "Karnataka",
    district: "Bengaluru Urban",
    platform: "swiggy",
    hoursPerDay: 8,
    daysActive: 6,
    tierId: "POL-PRO",
    subscriptionActive: true,
  };
}

router.get("/weekly-premium", async (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  const base = ensureGigDefaults(user);

  let liveSeverity = 0;
  if (req.query.live === "1") {
    try {
      const sn = req.query.stateName || base.stateName;
      const dist = req.query.district || base.district;
      const ev = await evaluateDisruptionsForPlace(sn, dist);
      liveSeverity = ev.severityCode || 0;
    } catch {
      liveSeverity = 0;
    }
  }

  const premium = computeWeeklyPremium({
    stateCode: req.query.stateCode || base.stateCode,
    stateName: req.query.stateName || base.stateName,
    district: req.query.district || base.district,
    platform: req.query.platform || base.platform,
    hoursPerDay: Number(req.query.hoursPerDay) || base.hoursPerDay,
    daysActive: Number(req.query.daysActive) || base.daysActive,
    tierId: req.query.tierId || base.tierId,
    liveSeverity,
  });

  res.json({
    premium,
    liveSeverityUsed: liveSeverity,
  });
});

router.patch("/profile", (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const cur = ensureGigDefaults(user);
  const next = {
    stateCode: (req.body.stateCode ?? cur.stateCode).toString().toUpperCase(),
    stateName: req.body.stateName ?? cur.stateName,
    district: req.body.district ?? cur.district,
    platform: req.body.platform ?? cur.platform,
    hoursPerDay: req.body.hoursPerDay != null ? Number(req.body.hoursPerDay) : cur.hoursPerDay,
    daysActive: req.body.daysActive != null ? Number(req.body.daysActive) : cur.daysActive,
    tierId: req.body.tierId ?? cur.tierId,
    subscriptionActive: req.body.subscriptionActive !== undefined ? !!req.body.subscriptionActive : cur.subscriptionActive,
  };

  if (!next.stateName || !next.district) {
    return res.status(400).json({ error: "stateName and district are required" });
  }

  const wp = computeWeeklyPremium(next);
  next.weeklyPremiumInr = wp.weeklyPremiumInr;
  next.maxWeeklyPayout = wp.coverage.maxWeeklyPayout;
  delete next.zoneId;

  updateUser(user.id, { gigProfile: next });
  const fresh = findUserById(user.id);
  const { passwordHash, ...pub } = fresh;
  res.json({ gigProfile: fresh.gigProfile, premium: wp, user: pub });
});

router.post("/payout/evaluate", async (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const g = ensureGigDefaults(user);
  if (g.subscriptionActive === false) {
    return res.status(400).json({ error: "Subscription not active" });
  }

  const payouts = listParametricPayoutsForUser(user.id);
  const today = new Date().toISOString().split("T")[0];
  const alreadyTriggeredToday = payouts.some(p => p.createdAt.startsWith(today));

  if (alreadyTriggeredToday) {
    return res.status(429).json({ 
      error: "Daily limit reached", 
      message: "You can only trigger a payout evaluation once per day." 
    });
  }

  let disruption;
  try {
    disruption = await evaluateDisruptionsForPlace(g.stateName, g.district);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }

  const hourly = PLATFORM_HOURLY_INR[g.platform] ?? PLATFORM_HOURLY_INR.other;
  const prior = listParametricPayoutsForUser(user.id).length;
  const validationCoefficient =
    typeof user.validationCoefficient === "number" ? user.validationCoefficient : 0.85;

  const calc = calculatePayout({
    hourlyEarningInr: hourly,
    tierId: g.tierId,
    disruption,
    accountAgeDays: accountAgeDays(user),
    parametricPayoutsCount: prior,
    validationCoefficient: req.body?.validationCoefficient ?? validationCoefficient,
  });

  let recorded = null;
  if (calc.eligible && calc.amount > 0) {
    recorded = createParametricPayout({
      id: nextId("pay"),
      userId: user.id,
      stateCode: g.stateCode,
      district: g.district,
      amount: calc.amount,
      severity: disruption.severity,
      fraudScore: calc.fraud?.score,
      createdAt: new Date().toISOString(),
    });
  }

  res.json({
    disruption,
    payout: calc,
    parametricPayoutRecord: recorded,
  });
});

router.get("/payouts", (req, res) => {
  res.json({ payouts: listParametricPayoutsForUser(req.userId) });
});

module.exports = router;
