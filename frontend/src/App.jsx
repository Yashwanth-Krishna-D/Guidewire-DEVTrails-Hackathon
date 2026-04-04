import { useState, useEffect, useCallback, useMemo } from "react";
import { getAllStates, getDistricts } from "india-state-district";
import * as api from "./api";
import "./App.css";

const inr = (n) =>
  n == null || Number.isNaN(Number(n)) ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n));

const num = (n, d = 2) =>
  n == null || Number.isNaN(Number(n)) ? "—" : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d });

function Stat({ label, value, hint }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {hint != null && hint !== "" && <div className="stat-hint">{hint}</div>}
    </div>
  );
}

function BarMeter({ value, max = 2, label }) {
  const pct = max ? Math.min(100, (Number(value) / max) * 100) : 0;
  return (
    <div className="meter">
      <div className="meter-label">{label}</div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="meter-num">{num(value, 0)} / {max}</div>
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState(null);
  const [catalog, setCatalog] = useState(null);
  const [user, setUser] = useState(null);
  const [authBusy, setAuthBusy] = useState(true);

  const states = useMemo(() => getAllStates(), []);

  const [reg, setReg] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    dateOfBirth: "1990-01-14",
    stateCode: "",
    stateName: "",
    district: "",
    platform: "swiggy",
    hoursPerDay: 8,
    daysActive: 6,
    tierId: "POL-PRO",
  });

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [authTab, setAuthTab] = useState("register");
  const [authMsg, setAuthMsg] = useState("");

  const [premiumLive, setPremiumLive] = useState(null);
  const [trig, setTrig] = useState(null);
  const [payoutEval, setPayoutEval] = useState(null);
  const [para, setPara] = useState([]);
  const [locLambda, setLocLambda] = useState(null);
  const [busy, setBusy] = useState({ signals: false, premium: false, payout: false });
  const [dashErr, setDashErr] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [gigEdit, setGigEdit] = useState({});
  const [editMsg, setEditMsg] = useState("");

  useEffect(() => {
    if (states.length && !reg.stateCode) {
      const s = states[0];
      const d0 = getDistricts(s.code)[0] || "";
      setReg((r) => ({ ...r, stateCode: s.code, stateName: s.name, district: d0 }));
    }
  }, [states, reg.stateCode]);

  useEffect(() => {
    api.fetchHealth().then(setHealth).catch(() => setHealth({ status: "down" }));
    api.getGigCatalog().then(setCatalog).catch(() => {});
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("riskora_token");
    if (!t) {
      setAuthBusy(false);
      return;
    }
    api
      .getMe()
      .then((r) => setUser(r.user))
      .catch(() => localStorage.removeItem("riskora_token"))
      .finally(() => setAuthBusy(false));
  }, []);

  const gp = user?.gigProfile;

  useEffect(() => {
    if (!gp) return;
    setGigEdit({
      stateCode: gp.stateCode,
      stateName: gp.stateName,
      district: gp.district,
      platform: gp.platform,
      hoursPerDay: gp.hoursPerDay,
      daysActive: gp.daysActive,
      tierId: gp.tierId,
    });
  }, [gp]);

  const refreshDashboard = useCallback(async () => {
    if (!gp?.stateName || !gp?.district) return;
    setDashErr("");
    setBusy((b) => ({ ...b, signals: true, premium: true }));
    try {
      const [t, pr] = await Promise.all([
        api.fetchTriggers(gp.stateName, gp.district),
        api.getWeeklyPremium({ live: "1" }),
      ]);
      setTrig(t);
      setPremiumLive(pr);
      const payouts = await api.listParametricPayouts();
      setPara(payouts.payouts || []);
    } catch (e) {
      setDashErr(e.message || String(e));
    } finally {
      setBusy((b) => ({ ...b, signals: false, premium: false }));
    }
  }, [gp?.stateName, gp?.district]);

  useEffect(() => {
    if (user && gp?.stateName && gp?.district) refreshDashboard();
  }, [user, gp?.stateName, gp?.district, refreshDashboard]);

  useEffect(() => {
    if (!user?.id || !navigator.geolocation) return;
    let w;
    const send = (pos) => {
      api
        .updateLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy)
        .then((res) => setLocLambda(res.validationCoefficient))
        .catch(() => setLocLambda(null));
    };
    navigator.geolocation.getCurrentPosition(send, () => setLocLambda(null), { timeout: 12000 });
    w = navigator.geolocation.watchPosition(send, () => {}, { maximumAge: 120000 });
    return () => w && navigator.geolocation.clearWatch(w);
  }, [user?.id]);

  const logout = () => {
    localStorage.removeItem("riskora_token");
    setUser(null);
    setTrig(null);
    setPremiumLive(null);
    setPayoutEval(null);
    setPara([]);
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setAuthMsg("");
    try {
      const r = await api.register({
        name: reg.name,
        email: reg.email,
        phone: reg.phone,
        password: reg.password,
        dateOfBirth: reg.dateOfBirth,
        stateCode: reg.stateCode,
        stateName: reg.stateName,
        district: reg.district,
        platform: reg.platform,
        hoursPerDay: reg.hoursPerDay,
        daysActive: reg.daysActive,
        tierId: reg.tierId,
      });
      localStorage.setItem("riskora_token", r.token);
      setUser(r.user);
    } catch (err) {
      setAuthMsg(err.message);
    }
  };

  const submitLogin = async (e) => {
    e.preventDefault();
    setAuthMsg("");
    try {
      const r = await api.login(loginForm);
      localStorage.setItem("riskora_token", r.token);
      setUser(r.user);
    } catch (err) {
      setAuthMsg(err.message);
    }
  };

  const runPayout = async () => {
    setBusy((b) => ({ ...b, payout: true }));
    setPayoutEval(null);
    try {
      const r = await api.evaluateParametricPayout({});
      setPayoutEval(r);
      const payouts = await api.listParametricPayouts();
      setPara(payouts.payouts || []);
      const me = await api.getMe();
      setUser(me.user);
    } catch (e) {
      setPayoutEval({ err: e.message });
    } finally {
      setBusy((b) => ({ ...b, payout: false }));
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setEditMsg("");
    try {
      const r = await api.patchGigProfile(gigEdit);
      setUser(r.user);
      setEditMsg("Saved.");
      setEditOpen(false);
      refreshDashboard();
    } catch (err) {
      setEditMsg(err.message);
    }
  };

  const districtsReg = reg.stateCode ? getDistricts(reg.stateCode) : [];
  const districtsEdit = gigEdit.stateCode ? getDistricts(gigEdit.stateCode) : [];

  const w = trig?.sources?.weather?.weather;
  const aq = trig?.sources?.aqi?.aqi;
  const civil = trig?.sources?.curfew?.disruption?.triggered ? 1 : 0;
  const activeSignals =
    (trig?.sources?.weather?.disruption?.triggered ? 1 : 0) +
    (trig?.sources?.aqi?.disruption?.triggered ? 1 : 0) +
    civil;

  const pv = premiumLive?.premium?.variables;
  const ctx = premiumLive?.premium?.context;
  const fraudScore = payoutEval?.payout?.fraud?.score;

  const tiers = catalog?.tiers || [];
  const platforms = catalog?.platforms || [];

  if (authBusy) {
    return (
      <div className="shell">
        <p className="muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="shell shell-auth">
        <header className="topbar">
          <h1>Riskora</h1>
          <span className={`dot ${health?.status === "ok" ? "ok" : "bad"}`} title="API" />
        </header>

        <div className="tabs">
          <button type="button" className={authTab === "register" ? "on" : ""} onClick={() => setAuthTab("register")}>
            Register
          </button>
          <button type="button" className={authTab === "login" ? "on" : ""} onClick={() => setAuthTab("login")}>
            Log in
          </button>
        </div>

        {authMsg && <div className="banner banner-err">{authMsg}</div>}

        {authTab === "register" ? (
          <form className="form-auth" onSubmit={submitRegister}>
            <label>
              Name
              <input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} required />
            </label>
            <label>
              Email
              <input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} required />
            </label>
            <label>
              Phone
              <input value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} required />
            </label>
            <label>
              Date of birth
              <input type="date" value={reg.dateOfBirth} onChange={(e) => setReg({ ...reg, dateOfBirth: e.target.value })} required />
            </label>
            <label>
              State
              <select
                value={reg.stateCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const s = states.find((x) => x.code === code);
                  const ds = getDistricts(code);
                  setReg({
                    ...reg,
                    stateCode: code,
                    stateName: s?.name || "",
                    district: ds[0] || "",
                  });
                }}
              >
                {states.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              District
              <select value={reg.district} onChange={(e) => setReg({ ...reg, district: e.target.value })} required>
                {districtsReg.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <div className="row2">
              <label>
                Platform
                <select value={reg.platform} onChange={(e) => setReg({ ...reg, platform: e.target.value })}>
                  {(platforms.length ? platforms : [{ id: "zomato" }, { id: "swiggy" }]).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tier
                <select value={reg.tierId} onChange={(e) => setReg({ ...reg, tierId: e.target.value })}>
                  {(tiers.length ? tiers : [{ id: "POL-PLUS" }]).map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="row2">
              <label>
                Hours / day
                <input
                  type="number"
                  min={4}
                  max={14}
                  value={reg.hoursPerDay}
                  onChange={(e) => setReg({ ...reg, hoursPerDay: Number(e.target.value) })}
                />
              </label>
              <label>
                Days / week
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={reg.daysActive}
                  onChange={(e) => setReg({ ...reg, daysActive: Number(e.target.value) })}
                />
              </label>
            </div>
            <button type="submit" className="btn-primary">
              Create account
            </button>
          </form>
        ) : (
          <form className="form-auth" onSubmit={submitLogin}>
            <label>
              Email
              <input type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} required />
            </label>
            <label>
              Password
              <input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} required />
            </label>
            <button type="submit" className="btn-primary">
              Log in
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="topbar">
        <h1>Riskora</h1>
        <div className="topbar-meta">
          <span className={`dot ${health?.status === "ok" ? "ok" : "bad"}`} />
          <span className="meta-text">
            {gp?.district}, {gp?.stateName}
          </span>
          <span className="meta-text">{user.name}</span>
          <button type="button" className="btn-ghost" onClick={() => setEditOpen(true)}>
            Edit profile
          </button>
          <button type="button" className="btn-ghost" onClick={logout}>
            Out
          </button>
        </div>
      </header>

      {dashErr && <div className="banner banner-err">{dashErr}</div>}

      <section className="panel">
        <div className="panel-head">
          <h2>Pricing & pool</h2>
          <button type="button" className="btn-sm" disabled={busy.premium} onClick={refreshDashboard}>
            {busy.premium ? "…" : "Refresh"}
          </button>
        </div>
        <div className="stat-grid">
          <Stat label="Weekly premium (P_w)" value={`₹${inr(premiumLive?.premium?.weeklyPremiumInr)}`} hint={`λ live ${premiumLive?.liveSeverityUsed ?? "—"}`} />
          <Stat label="L_e (expected loss base)" value={num(pv?.L_e)} />
          <Stat label="V_s (volatility)" value={num(pv?.V_s)} hint={`+${num(pv?.V_s_liveBoost, 3)} live`} />
          <Stat label="Φ_r (reliability)" value={num(pv?.Phi_r)} />
          <Stat label="K (pool norm)" value={num(pv?.K, 2)} />
          <Stat label="M (margin)" value={pv?.M_percent != null ? `${pv.M_percent}%` : "—"} />
          <Stat label="Max weekly payout cap" value={`₹${inr(gp?.maxWeeklyPayout)}`} />
          <Stat label="State risk score" value={num(ctx?.stateRiskScore, 3)} hint={gp?.stateCode} />
          <Stat label="Hourly rate (platform)" value={`₹${inr(ctx?.hourlyRateInr)}`} hint={gp?.platform} />
          <Stat label="Hours / day" value={num(ctx?.hoursPerDay, 0)} />
          <Stat label="Days active / wk" value={num(ctx?.daysActive, 0)} />
          <Stat label="Validation λ (GPS)" value={locLambda != null ? num(locLambda, 3) : num(user?.validationCoefficient, 3)} />
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Live environment</h2>
          <button type="button" className="btn-sm" disabled={busy.signals} onClick={() => refreshDashboard()}>
            {busy.signals ? "…" : "Refresh"}
          </button>
        </div>
        <div className="stat-grid stat-grid-4">
          <Stat label="Air temp (°C)" value={num(w?.tempC, 1)} />
          <Stat label="Wind (m/s)" value={num(w?.windSpeedMs, 2)} />
          <Stat label="Rain 1h (mm)" value={num(w?.rainfall1h, 2)} />
          <Stat label="US AQI" value={num(aq?.value, 0)} />
          <Stat label="PM2.5 (µg/m³)" value={aq?.pm25 != null ? num(aq.pm25, 0) : "—"} />
          <Stat label="PM10 (µg/m³)" value={aq?.pm10 != null ? num(aq.pm10, 0) : "—"} />
          <Stat label="Civil signal (0/1)" value={civil} />
          <Stat label="Active signal channels" value={activeSignals} />
        </div>
        <BarMeter value={trig?.severityCode ?? 0} max={2} label="Disruption severity index" />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Parametric payout</h2>
          <button type="button" className="btn-sm" disabled={busy.payout} onClick={runPayout}>
            {busy.payout ? "…" : "Evaluate"}
          </button>
        </div>
        <div className="stat-grid stat-grid-4">
          <Stat label="Eligible" value={payoutEval?.payout ? (payoutEval.payout.eligible ? "Yes" : "No") : "—"} />
          <Stat label="Amount (₹)" value={payoutEval?.payout ? inr(payoutEval.payout.amount) : "—"} />
          <Stat label="Fraud pre-score" value={fraudScore != null ? num(fraudScore, 3) : "—"} />
          <Stat label="Payouts recorded" value={num(para.length, 0)} />
        </div>
        {payoutEval?.err && <div className="banner banner-err">{payoutEval.err}</div>}
        <table className="data-table">
          <thead>
            <tr>
              <th>Amount (₹)</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {para.length === 0 ? (
              <tr>
                <td colSpan={2} className="muted">
                  No payouts yet.
                </td>
              </tr>
            ) : (
              para.map((p) => (
                <tr key={p.id}>
                  <td>{inr(p.amount)}</td>
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {editOpen && (
        <div className="modal-back" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Work profile</h3>
            <form onSubmit={saveProfile} className="form-auth">
              <label>
                State
                <select
                  value={gigEdit.stateCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    const s = states.find((x) => x.code === code);
                    const ds = getDistricts(code);
                    setGigEdit({
                      ...gigEdit,
                      stateCode: code,
                      stateName: s?.name || "",
                      district: ds[0] || gigEdit.district,
                    });
                  }}
                >
                  {states.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                District
                <select value={gigEdit.district} onChange={(e) => setGigEdit({ ...gigEdit, district: e.target.value })} required>
                  {districtsEdit.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </label>
              <div className="row2">
                <label>
                  Platform
                  <select value={gigEdit.platform} onChange={(e) => setGigEdit({ ...gigEdit, platform: e.target.value })}>
                    {(platforms.length ? platforms : [{ id: "zomato" }]).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tier
                  <select value={gigEdit.tierId} onChange={(e) => setGigEdit({ ...gigEdit, tierId: e.target.value })}>
                    {(tiers.length ? tiers : [{ id: "POL-PLUS" }]).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.id}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="row2">
                <label>
                  Hours / day
                  <input
                    type="number"
                    min={4}
                    max={14}
                    value={gigEdit.hoursPerDay}
                    onChange={(e) => setGigEdit({ ...gigEdit, hoursPerDay: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Days / week
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={gigEdit.daysActive}
                    onChange={(e) => setGigEdit({ ...gigEdit, daysActive: Number(e.target.value) })}
                  />
                </label>
              </div>
              {editMsg && <div className={editMsg === "Saved." ? "banner banner-ok" : "banner banner-err"}>{editMsg}</div>}
              <div className="row2">
                <button type="submit" className="btn-primary">
                  Save
                </button>
                <button type="button" className="btn-ghost" onClick={() => setEditOpen(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
