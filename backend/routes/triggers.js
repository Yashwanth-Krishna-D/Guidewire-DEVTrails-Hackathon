const router = require("express").Router();
const { evaluateDisruptionsForPlace } = require("../services/disruptionEngine");

const cache = new Map();
const CACHE_TTL_MS = 8 * 60 * 1000;

function getCached(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return e.data;
}
function setCache(key, data) {
  cache.set(key, { ts: Date.now(), data });
}

router.get("/all", async (req, res) => {
  const stateName = req.query.stateName;
  const district = req.query.district;
  if (!stateName || !district) {
    return res.status(400).json({ error: "stateName and district query parameters are required" });
  }
  const bypass = req.query.refresh === "1";
  const ck = `place:${stateName}|${district}`;
  if (!bypass) {
    const c = getCached(ck);
    if (c) return res.json({ ...c, cached: true });
  }
  try {
    const data = await evaluateDisruptionsForPlace(String(stateName), String(district));
    setCache(ck, data);
    res.json({ ...data, cached: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
