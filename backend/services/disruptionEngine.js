const { getWeatherAt } = require("./weatherService");
const { getAqiAt } = require("./aqiService");
const { getCurfewStatusForZone } = require("./curfewService");
const { resolveLatLon } = require("./geoResolve");
const { COVERAGE_TIERS, PLATFORM_HOURLY_INR } = require("./gigPremiumEngine");

function severityFromSources(weather, aqi, curfew) {
  const triggers = [];
  if (weather?.disruption?.triggered) triggers.push("weather");
  if (aqi?.disruption?.triggered) triggers.push("aqi");
  if (curfew?.disruption?.triggered) triggers.push("civil");
  if (triggers.length >= 2) return { severity: "red", code: 2 };
  if (triggers.length === 1) return { severity: "yellow", code: 1 };
  return { severity: "none", code: 0 };
}

async function evaluateDisruptionsAt(lat, lon, locationLabel) {
  const label = locationLabel || `${lat.toFixed(2)},${lon.toFixed(2)}`;
  const [weather, aqi, curfew] = await Promise.all([
    getWeatherAt(lat, lon, label),
    getAqiAt(lat, lon, label),
    getCurfewStatusForZone(label),
  ]);

  const { severity, code } = severityFromSources(weather, aqi, curfew);
  const overallTriggered = code > 0;

  const parts = [];
  if (weather?.disruption?.triggered) parts.push("weather");
  if (aqi?.disruption?.triggered) parts.push("air quality");
  if (curfew?.disruption?.triggered) parts.push("civil/regulatory signals");

  const summary = overallTriggered
    ? `Active disruption signals: ${parts.join(", ")}`
    : "No parametric triggers from live feeds for this location";

  return {
    lat,
    lon,
    locationLabel: label,
    overallTriggered,
    severity,
    severityCode: code,
    summary,
    sources: { weather, aqi, curfew },
    evaluatedAt: new Date().toISOString(),
  };
}

async function evaluateDisruptionsForPlace(stateName, district) {
  const resolved = await resolveLatLon(stateName, district);
  const locLabel = `${district}, ${stateName}`;
  return evaluateDisruptionsAt(resolved.lat, resolved.lon, resolved.label || locLabel);
}

function computeFraudPreScore({ accountAgeDays = 90, parametricPayoutsCount = 0, validationCoefficient = 0.85 }) {
  const ageFactor = Math.min(1, accountAgeDays / 180);
  const claimsFactor = Math.min(1, parametricPayoutsCount / 10);
  const score = Math.max(0, 0.5 - ageFactor * 0.2 + claimsFactor * 0.15 - validationCoefficient * 0.25);
  return { score: Math.round(score * 1000) / 1000, ageFactor, claimsFactor, validationCoefficient };
}

function calculatePayout(input) {
  const {
    hourlyEarningInr,
    tierId = "POL-PLUS",
    disruption,
    accountAgeDays = 90,
    parametricPayoutsCount = 0,
    validationCoefficient = 0.85,
  } = input;

  const tier = COVERAGE_TIERS[tierId] || COVERAGE_TIERS["POL-PLUS"];
  const fraud = computeFraudPreScore({ accountAgeDays, parametricPayoutsCount, validationCoefficient });

  if (!disruption?.overallTriggered) {
    return {
      eligible: false,
      amount: 0,
      reason: "No verified disruption event",
      fraud,
    };
  }

  if (fraud.score > 0.35) {
    return {
      eligible: false,
      amount: 0,
      reason: "Held pending verification",
      fraud,
    };
  }

  const sev = disruption.severityCode || 0;
  const severityMultiplier = sev >= 2 ? 1.0 : sev >= 1 ? 0.55 : 0;
  const hoursLost = sev >= 2 ? 6 : sev >= 1 ? 3 : 0;
  const raw = hoursLost * hourlyEarningInr * tier.multiplier * severityMultiplier;
  const amount = Math.min(Math.round(raw), tier.maxWeeklyPayout);

  return {
    eligible: amount > 0,
    amount,
    reason: `~${hoursLost}h equivalent at current severity`,
    fraud,
  };
}

module.exports = {
  evaluateDisruptionsAt,
  evaluateDisruptionsForPlace,
  calculatePayout,
  computeFraudPreScore,
  severityFromSources,
  resolveLatLon,
};
