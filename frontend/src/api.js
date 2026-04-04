const ORIGIN = (import.meta.env.VITE_API_ORIGIN || "http://localhost:4000").replace(/\/$/, "");
const API_BASE = `${ORIGIN}/api`;

export async function apiFetch(path, opts = {}) {
  const token = localStorage.getItem("riskora_token");
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

export function fetchHealth() {
  return fetch(`${ORIGIN}/health`).then((r) => r.json());
}

export const register = (body) =>
  apiFetch("/auth/register", { method: "POST", body: JSON.stringify(body) });
export const login = (body) =>
  apiFetch("/auth/login", { method: "POST", body: JSON.stringify(body) });
export const getMe = () => apiFetch("/auth/me");

export function getGigCatalog() {
  return fetch(`${API_BASE}/gig/catalog`).then((r) => r.json());
}

export function fetchTriggers(stateName, district, refresh) {
  const q = new URLSearchParams({ stateName, district });
  if (refresh) q.set("refresh", "1");
  return fetch(`${API_BASE}/triggers/all?${q}`).then((r) => r.json());
}

export const getWeeklyPremium = (query) => {
  const q = new URLSearchParams(query).toString();
  return apiFetch(`/gig/weekly-premium?${q}`);
};

export const patchGigProfile = (body) =>
  apiFetch("/gig/profile", { method: "PATCH", body: JSON.stringify(body) });

export const evaluateParametricPayout = (body) =>
  apiFetch("/gig/payout/evaluate", { method: "POST", body: JSON.stringify(body || {}) });

export const listParametricPayouts = () => apiFetch("/gig/payouts");

export const updateLocation = (lat, lng, accuracy) =>
  apiFetch("/location/update", { method: "POST", body: JSON.stringify({ lat, lng, accuracy }) });
