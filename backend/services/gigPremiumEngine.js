/**
 * Weekly premium: P_w = ((L_e · V_s) · Φ_r / K) · (1 + M) · tierMultiplier
 * Location risk from Indian state code (aligns with india-state-district on the client).
 */

const STATE_BASE_RISK = {
  AP: 0.55,
  AR: 0.48,
  AS: 0.58,
  BR: 0.62,
  CG: 0.52,
  GA: 0.42,
  GJ: 0.6,
  HR: 0.58,
  HP: 0.44,
  JH: 0.55,
  KA: 0.52,
  KL: 0.5,
  MP: 0.54,
  MH: 0.78,
  MN: 0.46,
  ML: 0.48,
  MZ: 0.45,
  NL: 0.47,
  OD: 0.56,
  PB: 0.57,
  RJ: 0.59,
  SK: 0.43,
  TN: 0.58,
  TG: 0.53,
  TR: 0.49,
  UP: 0.64,
  UK: 0.48,
  WB: 0.61,
  AN: 0.4,
  CH: 0.55,
  DH: 0.5,
  JK: 0.52,
  LA: 0.42,
  LD: 0.4,
  DL: 0.88,
  PY: 0.46,
};

const PLATFORM_HOURLY_INR = {
  swiggy: 92,
};

const COVERAGE_TIERS = {
  "POL-BASIC": { label: "Riskora-BASIC", multiplier: 0.30, maxWeeklyPayout: 1000 },
  "POL-PRO": { label: "Riskora-PRO", multiplier: 0.45, maxWeeklyPayout: 3000 },
  "POL-PRESTIGE": { label: "Riskora-PRESTIGE", multiplier: 0.75, maxWeeklyPayout: 5000 },
};

const K_POOL = 3.2;

function stateRisk(stateCode) {
  if (!stateCode) return 0.5;
  const c = String(stateCode).toUpperCase();
  return STATE_BASE_RISK[c] ?? 0.5;
}

function disruptionProbabilityFromRisk(r) {
  if (r > 0.7) return 0.9;
  if (r > 0.5) return 0.4;
  return 0.2;
}

function phiReliability(daysActive) {
  const d = Number(daysActive) || 0;
  if (d >= 5) return { Phi_r: 0.88, label: "high engagement (5–7 days)" };
  if (d >= 3) return { Phi_r: 1.05, label: "medium engagement" };
  return { Phi_r: 1.2, label: "low engagement (<3 days)" };
}

function marginM(risk) {
  const m = risk > 0.7 ? 0.32 : 0.25;
  return { M: m, mPct: Math.round(m * 100) };
}

function volatilityScore(risk, liveSeverity = 0) {
  const base = 0.8 + risk * 0.6;
  const boost = liveSeverity >= 2 ? 0.15 : liveSeverity >= 1 ? 0.08 : 0;
  return { Vs: Math.min(2.2, base + boost), base, liveBoost: boost };
}

function computeWeeklyPremium(input) {
  const {
    stateCode = "KA",
    platform = "swiggy",
    hoursPerDay = 8,
    daysActive = 6,
    tierId = "POL-PRO",
    liveSeverity = 0,
    stateName,
    district,
  } = input;

  const risk = stateRisk(stateCode);
  const pDist = disruptionProbabilityFromRisk(risk);
  const Ehourly = PLATFORM_HOURLY_INR[platform] ?? PLATFORM_HOURLY_INR.other;
  const hPred = Math.min(Number(hoursPerDay) * 0.35, 4);
  const Le = 7 * hPred * Ehourly * pDist;

  const { Vs, base: vsBase, liveBoost } = volatilityScore(risk, liveSeverity);
  const { Phi_r, label: phiLabel } = phiReliability(daysActive);
  const { M, mPct } = marginM(risk);

  const tier = COVERAGE_TIERS[tierId] || COVERAGE_TIERS["POL-PRO"];
  const inner = (Le * Vs * Phi_r) / K_POOL;
  const Pw = Math.round(inner * (1 + M) * tier.multiplier);

  return {
    weeklyPremiumInr: Pw,
    variables: {
      L_e: Math.round(Le * 100) / 100,
      V_s: Math.round(Vs * 100) / 100,
      V_s_base: Math.round(vsBase * 100) / 100,
      V_s_liveBoost: liveBoost,
      Phi_r,
      Phi_r_label: phiLabel,
      K: K_POOL,
      M,
      M_percent: mPct,
      tierMultiplier: tier.multiplier,
      tierId,
      tierLabel: tier.label,
    },
    coverage: {
      maxWeeklyPayout: tier.maxWeeklyPayout,
    },
    context: {
      stateCode: String(stateCode).toUpperCase(),
      stateName: stateName || null,
      district: district || null,
      stateRiskScore: risk,
      disruptionProbability: pDist,
      hourlyRateInr: Ehourly,
      platform,
      hoursPerDay: Number(hoursPerDay),
      daysActive: Number(daysActive),
      predictedHighRiskHours: Math.round(hPred * 100) / 100,
    },
  };
}

function listStateRiskTable() {
  return Object.entries(STATE_BASE_RISK).map(([code, baseRisk]) => ({ code, baseRisk }));
}

function listPlatforms() {
  return Object.entries(PLATFORM_HOURLY_INR).map(([id, hourlyRateInr]) => ({ id, hourlyRateInr }));
}

function listTiers() {
  return Object.entries(COVERAGE_TIERS).map(([id, v]) => ({ id, ...v }));
}

module.exports = {
  STATE_BASE_RISK,
  PLATFORM_HOURLY_INR,
  COVERAGE_TIERS,
  K_POOL,
  computeWeeklyPremium,
  listStateRiskTable,
  listPlatforms,
  listTiers,
  stateRisk,
};
