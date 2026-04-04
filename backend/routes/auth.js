const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  findUserByEmail,
  findUserByPhone,
  findUserById,
  createUser,
  nextId,
} = require("../store/fsStore");

const JWT_SECRET = process.env.JWT_SECRET || "riskora_dev_secret_change_me";
const JWT_EXPIRY = "7d";

function publicUser(u) {
  if (!u) return null;
  const { passwordHash, ...rest } = u;
  return rest;
}

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      dateOfBirth,
      stateCode,
      stateName,
      district,
      platform,
      hoursPerDay,
      daysActive,
      tierId,
    } = req.body;

    if (!name || !email || !phone || !password || !dateOfBirth) {
      return res.status(400).json({
        error: "name, email, phone, password, and dateOfBirth are required",
      });
    }
    if (!stateCode || !stateName || !district) {
      return res.status(400).json({ error: "stateCode, stateName, and district are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }
    const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRx.test(email)) return res.status(400).json({ error: "Invalid email format" });

    const { ageFromDob } = require("../services/premiumEngine");
    const age = ageFromDob(dateOfBirth);
    if (age == null) return res.status(400).json({ error: "Invalid dateOfBirth" });
    if (age < 18) return res.status(400).json({ error: "Must be at least 18 years old" });

    const em = email.toLowerCase();
    if (findUserByEmail(em)) return res.status(409).json({ error: "Email already registered" });
    if (findUserByPhone(phone)) return res.status(409).json({ error: "Phone number already registered" });

    const { computeWeeklyPremium, COVERAGE_TIERS } = require("../services/gigPremiumEngine");

    const tid = tierId && COVERAGE_TIERS[tierId] ? tierId : "POL-PRO";
    const sc = String(stateCode).toUpperCase();
    const plat = platform || "swiggy";
    const hpd = Number(hoursPerDay) || 8;
    const da = Number(daysActive) || 6;

    const wp = computeWeeklyPremium({
      stateCode: sc,
      stateName: String(stateName).trim(),
      district: String(district).trim(),
      platform: plat,
      hoursPerDay: hpd,
      daysActive: da,
      tierId: tid,
      liveSeverity: 0,
    });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = {
      id: nextId("usr"),
      name: String(name).trim(),
      email: em,
      phone: String(phone).trim(),
      passwordHash,
      dateOfBirth: String(dateOfBirth).slice(0, 10),
      validationCoefficient: 0.85,
      gigProfile: {
        stateCode: sc,
        stateName: String(stateName).trim(),
        district: String(district).trim(),
        platform: plat,
        hoursPerDay: hpd,
        daysActive: da,
        tierId: tid,
        weeklyPremiumInr: wp.weeklyPremiumInr,
        maxWeeklyPayout: wp.coverage.maxWeeklyPayout,
        subscriptionActive: true,
      },
      locationHistory: [],
      createdAt: new Date().toISOString(),
    };
    createUser(user);

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.status(201).json({
      message: "Registration successful",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Register error:", err.message);
    res.status(500).json({ error: "Registration failed", details: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = findUserByEmail(email);
    if (!user) return res.status(401).json({ error: "Invalid email or password" });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    res.json({
      message: "Login successful",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Login failed", details: err.message });
  }
});

const authMiddleware = require("../middleware/auth");
router.get("/me", authMiddleware, (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: publicUser(user) });
});

module.exports = router;
