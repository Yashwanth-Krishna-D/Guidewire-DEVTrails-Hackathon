async function fetchJson(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`Geocoding HTTP ${r.status}`);
  return r.json();
}

function searchUrl(name) {
  const q = encodeURIComponent(name);
  return `https://geocoding-api.open-meteo.com/v1/search?name=${q}&count=3&country=India&language=en`;
}

/** Map india-state-district labels to Open-Meteo-friendly search terms */
const DISTRICT_SEARCH_SYNONYM = {
  "bengaluru urban": "Bangalore",
  "bengaluru rural": "Bangalore",
  "mumbai city": "Mumbai",
  "mumbai suburban": "Mumbai",
  "new delhi": "Delhi",
  "central delhi": "Delhi",
  "north delhi": "Delhi",
  "south delhi": "Delhi",
  "east delhi": "Delhi",
  "west delhi": "Delhi",
  "north west delhi": "Delhi",
  "south west delhi": "Delhi",
  "shahdara": "Delhi",
  "north east delhi": "Delhi",
  "hyderabad": "Hyderabad",
  "chennai": "Chennai",
  "kolkata": "Kolkata",
  "pune": "Pune",
  "ahmedabad": "Ahmedabad",
};

function searchTerms(stateName, district) {
  const d = String(district || "").trim();
  const s = String(stateName || "").trim();
  const key = d.toLowerCase();
  const syn = DISTRICT_SEARCH_SYNONYM[key];
  const out = [];
  if (syn) out.push(syn);
  if (d) out.push(d);
  if (d && s) out.push(`${d} ${s}`);
  if (/bengaluru/i.test(d) && !out.includes("Bangalore")) out.push("Bangalore");
  if (s) out.push(s);
  if (s) out.push(`${s} India`);
  return [...new Set(out)];
}

async function resolveLatLon(stateName, district) {
  for (const term of searchTerms(stateName, district)) {
    if (!term) continue;
    try {
      const data = await fetchJson(searchUrl(term));
      const hit = data.results?.[0];
      if (hit?.latitude != null && hit?.longitude != null) {
        return {
          lat: hit.latitude,
          lon: hit.longitude,
          label: hit.name,
          queryUsed: term,
        };
      }
    } catch {
      /* next */
    }
  }
  throw new Error("Could not resolve location");
}

module.exports = { resolveLatLon };
