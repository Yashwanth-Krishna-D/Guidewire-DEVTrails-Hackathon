async function fetchJson(url) {
  const r = await fetch(url, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

function weatherDisruption(tempC, windMs, rainMm1h) {
  const heavyRain = rainMm1h >= 15;
  const extremeWind = windMs >= 14;
  const heat = tempC >= 43;
  const cold = tempC <= 4;
  const triggered = heavyRain || extremeWind || heat || cold;
  let label = "Conditions within normal range";
  if (heavyRain) label = "Heavy precipitation — mobility disruption likely";
  else if (extremeWind) label = "High wind — safety / operations disruption";
  else if (heat) label = "Extreme heat advisory";
  else if (cold) label = "Cold stress advisory";
  return { triggered, label, heavyRain, extremeWind, heat, cold };
}

async function getWeatherAt(lat, lon, locationLabel = "") {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,precipitation,rain,wind_speed_10m&wind_speed_unit=ms`;

  try {
    const data = await fetchJson(url);
    const cur = data.current || {};
    const temp = cur.temperature_2m;
    const wind = cur.wind_speed_10m ?? 0;
    const rain = cur.rain ?? cur.precipitation ?? 0;
    const disruption = weatherDisruption(temp, wind, rain);
    return {
      location: locationLabel,
      source: "Open-Meteo",
      weather: {
        tempC: temp,
        windSpeedMs: wind,
        rainfall1h: rain,
        condition: disruption.triggered ? disruption.label : "Clear / moderate",
      },
      disruption: {
        triggered: disruption.triggered,
        label: disruption.label,
        type: "weather",
      },
    };
  } catch (err) {
    return { location: locationLabel, error: err.message, source: "open-meteo" };
  }
}

module.exports = { getWeatherAt, weatherDisruption };
