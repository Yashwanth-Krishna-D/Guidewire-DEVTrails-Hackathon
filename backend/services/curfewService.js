/**
 * Civil / regulatory disruption hints from public RSS headlines (no paid News API required).
 */

const FEEDS = [
  "https://timesofindia.indiatimes.com/rssfeeds/-2128838595.cms",
  "https://www.thehindu.com/news/national/feeder/default.rss",
];

const KEYWORDS = [
  "curfew",
  "section 144",
  "lockdown",
  "bandh",
  "hartal",
  "internet shutdown",
  "imposed restrictions",
];

async function fetchText(url) {
  const r = await fetch(url, { headers: { "User-Agent": "RiskoraDisruptionBot/1.0" } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.text();
}

function scanRss(xml) {
  const lower = xml.slice(0, 120000).toLowerCase();
  const hits = [];
  for (const kw of KEYWORDS) {
    if (lower.includes(kw)) hits.push(kw);
  }
  return hits;
}

async function getCurfewStatusForZone(zoneId) {
  const hitsAll = [];
  const errors = [];

  for (const url of FEEDS) {
    try {
      const xml = await fetchText(url);
      hitsAll.push(...scanRss(xml));
    } catch (e) {
      errors.push({ url, error: e.message });
    }
  }

  const unique = [...new Set(hitsAll)];
  const triggered = unique.length > 0;

  return {
    zone: zoneId,
    source: "RSS headlines (ToI / The Hindu)",
    disruption: {
      triggered,
      label: triggered
        ? `Headline signals possible civil/regulatory disruption (keywords: ${unique.slice(0, 5).join(", ")})`
        : "No strong civil-disruption keywords in recent feed sample",
      type: "civil",
      keywordHits: unique,
    },
    feedErrors: errors.length ? errors : undefined,
  };
}

module.exports = { getCurfewStatusForZone };
