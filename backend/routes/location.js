// Session-scoped location update (signal integrity narrative for gig workers).
const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const { updateUser, findUserById } = require("../store/fsStore");

router.use(authMiddleware);

router.post("/update", (req, res) => {
  const { lat, lng, accuracy } = req.body;
  if (lat == null || lng == null) {
    return res.status(400).json({ error: "lat and lng are required" });
  }

  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const point = {
    lat: Number(lat),
    lng: Number(lng),
    accuracy: accuracy != null ? Number(accuracy) : null,
    at: new Date().toISOString(),
  };

  const history = Array.isArray(user.locationHistory) ? user.locationHistory.slice(-49) : [];
  history.push(point);

  const acc = point.accuracy;
  const validationCoefficient =
    acc != null && acc <= 35 ? 0.92 : acc != null && acc <= 80 ? 0.88 : 0.82;

  updateUser(user.id, {
    lastLocation: point,
    locationHistory: history,
    validationCoefficient,
  });

  res.json({
    ok: true,
    lastLocation: point,
    validationCoefficient,
    message: "Location recorded for active-session integrity (see README signal layer)",
  });
});

router.get("/history", (req, res) => {
  const user = findUserById(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ history: user.locationHistory || [] });
});

module.exports = router;
