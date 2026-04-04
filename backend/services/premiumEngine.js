// Actuarial-style premium: deterministic from inputs (coverage, age, region, product, term, deductible).

const PRODUCTS = {
  AUTO: {
    id: "AUTO",
    name: "Motor — comprehensive",
    description: "Own-damage + third-party liability (illustrative pricing).",
    minCoverage: 50_000,
    maxCoverage: 2_000_000,
    baseRatePer1000: 5.2,
    termYearsOptions: [1, 2, 3],
  },
  HOME: {
    id: "HOME",
    name: "Home contents & structure",
    description: "Fire, theft, and named perils (illustrative).",
    minCoverage: 200_000,
    maxCoverage: 10_000_000,
    baseRatePer1000: 1.85,
    termYearsOptions: [1, 3, 5],
  },
  HEALTH: {
    id: "HEALTH",
    name: "Individual health indemnity",
    description: "Inpatient cover; community-rated adjustments by age band.",
    minCoverage: 100_000,
    maxCoverage: 2_500_000,
    baseRatePer1000: 6.4,
    termYearsOptions: [1],
  },
};

/** Relative loss cost by territory (ISO-style territory factor, simplified). */
const REGION_FACTORS = {
  IN_MH_MUM: { label: "Mumbai, MH", factor: 1.12 },
  IN_KA_BLR: { label: "Bengaluru, KA", factor: 1.06 },
  IN_DL_NCT: { label: "Delhi NCT", factor: 1.09 },
  IN_TN_CHN: { label: "Chennai, TN", factor: 1.04 },
  IN_TG_HYD: { label: "Hyderabad, TG", factor: 1.02 },
  IN_DEFAULT: { label: "India — other", factor: 1.0 },
};

function parseISODate(iso) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function ageFromDob(isoDob, asOf = new Date()) {
  const d = parseISODate(isoDob);
  if (!d) return null;
  let age = asOf.getFullYear() - d.getFullYear();
  const m = asOf.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < d.getDate())) age -= 1;
  return Math.max(0, age);
}

function ageBandFactor(age, productId) {
  if (age == null) return { factor: 1.15, band: "unknown" };
  if (productId === "HEALTH") {
    if (age < 18) return { factor: 0.72, band: "minor" };
    if (age < 36) return { factor: 1.0, band: "18-35" };
    if (age < 51) return { factor: 1.28, band: "36-50" };
    if (age < 66) return { factor: 1.62, band: "51-65" };
    return { factor: 2.05, band: "66+" };
  }
  if (productId === "AUTO") {
    if (age < 22) return { factor: 1.35, band: "<22" };
    if (age < 30) return { factor: 1.12, band: "22-29" };
    if (age < 55) return { factor: 1.0, band: "30-54" };
    return { factor: 0.95, band: "55+" };
  }
  // HOME
  if (age < 30) return { factor: 1.05, band: "<30" };
  if (age < 50) return { factor: 1.0, band: "30-49" };
  return { factor: 0.98, band: "50+" };
}

function deductibleFactor(deductible, productId) {
  const d = Number(deductible) || 0;
  if (productId === "HEALTH") {
    if (d >= 50_000) return { factor: 0.82, label: "₹50k+ deductible" };
    if (d >= 25_000) return { factor: 0.9, label: "₹25k deductible" };
    if (d >= 10_000) return { factor: 0.96, label: "₹10k deductible" };
    return { factor: 1.0, label: "standard" };
  }
  if (productId === "AUTO") {
    if (d >= 15_000) return { factor: 0.88, label: "₹15k excess" };
    if (d >= 5_000) return { factor: 0.94, label: "₹5k excess" };
    return { factor: 1.0, label: "standard" };
  }
  if (d >= 25_000) return { factor: 0.93, label: "₹25k deductible" };
  return { factor: 1.0, label: "standard" };
}

function termFactor(termYears, productId) {
  const t = Number(termYears) || 1;
  if (productId === "AUTO" && t === 3) return { factor: 2.75, label: "3-year bundle" };
  if (productId === "AUTO" && t === 2) return { factor: 1.9, label: "2-year" };
  if (productId === "HOME" && t === 5) return { factor: 4.5, label: "5-year" };
  if (productId === "HOME" && t === 3) return { factor: 2.75, label: "3-year" };
  return { factor: t, label: `${t} year(s)` };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

/**
 * Returns annual premium and full breakdown. Throws string errors for validation.
 */
function calculatePremiumQuote(input) {
  const {
    productId,
    coverageAmount,
    dateOfBirth,
    regionCode,
    deductible = 0,
    termYears = 1,
  } = input;

  const product = PRODUCTS[productId];
  if (!product) throw new Error(`Unknown product: ${productId}`);

  const cov = Number(coverageAmount);
  if (!Number.isFinite(cov) || cov < product.minCoverage || cov > product.maxCoverage) {
    throw new Error(
      `coverageAmount must be between ${product.minCoverage} and ${product.maxCoverage} for ${productId}`
    );
  }

  if (!product.termYearsOptions.includes(Number(termYears))) {
    throw new Error(`termYears must be one of: ${product.termYearsOptions.join(", ")}`);
  }

  const age = ageFromDob(dateOfBirth);
  if (age == null || age < 18) throw new Error("dateOfBirth required (policyholder must be 18+)");

  const region = REGION_FACTORS[regionCode] || REGION_FACTORS.IN_DEFAULT;
  const baseComponent = (cov / 1000) * product.baseRatePer1000;
  const ageF = ageBandFactor(age, productId);
  const dedF = deductibleFactor(deductible, productId);
  const regF = region.factor;
  const termF = termFactor(termYears, productId);

  const annualBeforeTax = baseComponent * ageF.factor * dedF.factor * regF;
  const totalForTerm = annualBeforeTax * termF.factor;
  const gstRate = 0.18;
  const premiumWithGst = totalForTerm * (1 + gstRate);

  return {
    productId,
    productName: product.name,
    coverageAmount: cov,
    termYears: Number(termYears),
    regionCode,
    regionLabel: region.label,
    age,
    annualPremiumBeforeTax: round2(annualBeforeTax),
    termPremiumBeforeTax: round2(totalForTerm),
    gstRate,
    premiumPayable: round2(premiumWithGst),
    monthlyEquivalent: round2(premiumWithGst / Math.max(1, Number(termYears) * 12)),
    breakdown: {
      basePer1000: product.baseRatePer1000,
      baseComponent: round2(baseComponent),
      ageBand: ageF.band,
      ageFactor: ageF.factor,
      deductibleLabel: dedF.label,
      deductibleFactor: dedF.factor,
      regionFactor: regF,
      termLabel: termF.label,
      termMultiplier: termF.factor,
      formula:
        "(coverage/1000)×baseRate×ageFactor×deductibleFactor×regionFactor×(term multiplier); then +18% GST",
    },
  };
}

function listProducts() {
  return Object.values(PRODUCTS).map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    minCoverage: p.minCoverage,
    maxCoverage: p.maxCoverage,
    termYearsOptions: p.termYearsOptions,
  }));
}

function listRegions() {
  return Object.entries(REGION_FACTORS).map(([code, v]) => ({ code, label: v.label, factor: v.factor }));
}

module.exports = {
  PRODUCTS,
  REGION_FACTORS,
  calculatePremiumQuote,
  listProducts,
  listRegions,
  ageFromDob,
};
