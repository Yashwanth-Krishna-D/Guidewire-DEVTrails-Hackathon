async function fetchJson(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function aqiLabel(v) {
  if (v == null) return "Unknown";
  if (v <= 50) return "Good";
  if (v <= 100) return "Moderate";
  if (v <= 150) return "Unhealthy for sensitive";
  if (v <= 200) return "Unhealthy";
  if (v <= 300) return "Very unhealthy";
  return "Hazardous";
}

async function getAqiAt(lat, lon, locationLabel = "") {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi,pm10,pm2_5`;

  try {
    const data = await fetchJson(url);
    const cur = data.current || {};
    const value = cur.us_aqi ?? cur.pm2_5 ?? 0;
    const pm25 = cur.pm2_5;
    const pm10 = cur.pm10;
    const triggered = value >= 200 || (pm25 != null && pm25 >= 150);
    return {
      location: locationLabel,
      source: "Open-Meteo Air Quality",
      aqi: {
        value: Math.round(value),
        label: aqiLabel(value),
        pm25: pm25 != null ? Math.round(pm25) : null,
        pm10: pm10 != null ? Math.round(pm10) : null,
      },
      disruption: {
        triggered,
        label: triggered ? "Severe air quality — health / outdoor work disruption" : aqiLabel(value),
        type: "aqi",
      },
    };
  } catch (err) {
    return { location: locationLabel, error: err.message, source: "open-meteo-air" };
  }
}

module.exports = { getAqiAt };
