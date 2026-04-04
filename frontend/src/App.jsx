import { useState, useEffect, useCallback, useMemo } from "react";
import { getAllStates, getDistricts } from "india-state-district";
import * as api from "./api";
import "./App.css";

const inr = (n) =>
  n == null || Number.isNaN(Number(n))
    ? "-"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n));

const num = (n, d = 2) =>
  n == null || Number.isNaN(Number(n))
    ? "-"
    : Number(n).toLocaleString("en-IN", { maximumFractionDigits: d });

function Stat({ label, value, hint, className = "" }) {
  return (
    <div className={`stat ${className}`.trim()}>
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
      <div className="meter-num">
        {num(value, 0)} / {max}
      </div>
    </div>
  );
}

function InsightCard({ title, children }) {
  return (
    <div className="insight-card">
      <div className="insight-title">{title}</div>
      <div className="insight-body">{children}</div>
    </div>
  );
}

function ProgressRow({ label, value, pct = 0, tone = "blue" }) {
  const width = Math.max(0, Math.min(100, Number(pct) || 0));
  return (
    <div className="progress-row">
      <div className="progress-meta">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="progress-track">
        <div className={`progress-fill tone-${tone}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

function ThresholdRow({ label, value, current = 0, max = 100, threshold = 0, tone = "blue" }) {
  const width = max ? Math.max(0, Math.min(100, (Number(current) / Number(max)) * 100)) : 0;
  const marker = max ? Math.max(0, Math.min(100, (Number(threshold) / Number(max)) * 100)) : 0;
  return (
    <div className="progress-row threshold-row">
      <div className="progress-meta">
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div className="progress-track threshold-track">
        <div className={`progress-fill tone-${tone}`} style={{ width: `${width}%` }} />
        <div className="threshold-marker" style={{ left: `${marker}%` }} />
      </div>
      <div className="threshold-note">Trigger at {num(threshold, 0)}</div>
    </div>
  );
}

function StatusRow({ label, value, tone = "neutral" }) {
  return (
    <div className="status-row">
      <span>{label}</span>
      <strong className={`status-pill status-${tone}`}>{value}</strong>
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
  const payoutAmount = payoutEval?.payout?.amount ?? 0;
  const payoutCap = gp?.maxWeeklyPayout ?? 0;
  const aqiValue = aq?.value ?? 0;
  const tempValue = w?.tempC ?? 0;
  const windValue = w?.windSpeedMs ?? 0;
  const rainValue = w?.rainfall1h ?? 0;
  const stateRiskPct = Math.min(100, (Number(ctx?.stateRiskScore || 0) / 1) * 100);
  const workConsistencyPct = Math.min(100, (Number(pv?.Phi_r || 0) / 1.2) * 100);
  const locationTrustPct = Math.min(100, (Number(locLambda ?? user?.validationCoefficient ?? 0) / 1) * 100);
  const marginPct = Math.min(100, Number(pv?.M_percent || 0));
  const poolPct = Math.min(100, (Number(pv?.K || 0) / 4) * 100);
  const hourlyPct = Math.min(100, (Number(ctx?.hourlyRateInr || 0) / 120) * 100);
  const hoursPct = Math.min(100, (Number(ctx?.hoursPerDay || 0) / 14) * 100);
  const daysPct = Math.min(100, (Number(ctx?.daysActive || 0) / 7) * 100);
  const temperaturePct = Math.min(100, (Math.min(Math.abs(tempValue - 24), 20) / 20) * 100);
  const pm10Pct = Math.min(100, ((aq?.pm10 ?? 0) / 250) * 100);
  const activeSignalPct = Math.min(100, (activeSignals / 3) * 100);
  const payoutsPct = Math.min(100, (para.length / 10) * 100);
  const payoutAmountPct = payoutCap ? Math.min(100, (payoutAmount / payoutCap) * 100) : 0;
  const fraudThreshold = 0.35;

  const tiers = catalog?.tiers || [];
  const platforms = catalog?.platforms || [];

  if (authBusy) {
    return (
      <div className="shell">
        <p className="muted">Loading...</p>
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
            Sign up
          </button>
          <button type="button" className={authTab === "login" ? "on" : ""} onClick={() => setAuthTab("login")}>
            Sign in
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
                Delivery app
                <select value={reg.platform} onChange={(e) => setReg({ ...reg, platform: e.target.value })}>
                  {(platforms.length ? platforms : [{ id: "zomato" }, { id: "swiggy" }]).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Plan
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
                Work hours per day
                <input
                  type="number"
                  min={4}
                  max={14}
                  value={reg.hoursPerDay}
                  onChange={(e) => setReg({ ...reg, hoursPerDay: Number(e.target.value) })}
                />
              </label>
              <label>
                Working days per week
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
              Create my account
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
              Sign in
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
            Update work details
          </button>
          <button type="button" className="btn-ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      {dashErr && <div className="banner banner-err">{dashErr}</div>}

      <section className="panel">
        <div className="panel-head">
          <h2>Your plan and price</h2>
          <button type="button" className="btn-sm" disabled={busy.premium} onClick={refreshDashboard}>
            {busy.premium ? "..." : "Refresh"}
          </button>
        </div>
        <div className="stat-grid plan-grid">
          <Stat
            className="stat-hero stat-payment"
            label="Your weekly payment"
            value={`Rs. ${inr(premiumLive?.premium?.weeklyPremiumInr)}`}
            hint={`Live risk ${premiumLive?.liveSeverityUsed ?? "-"}`}
          />
          <Stat className="stat-hero stat-support" label="Maximum weekly support" value={`Rs. ${inr(gp?.maxWeeklyPayout)}`} />
          <Stat className="stat-key" label="Expected income loss" value={num(pv?.L_e)} />
          <Stat className="stat-key" label="Area risk level" value={num(pv?.V_s)} hint={`+${num(pv?.V_s_liveBoost, 3)} live`} />
        </div>
        <div className="insight-grid">
          <InsightCard title="Work pattern">
            <ProgressRow label="Estimated pay per hour" value={`Rs. ${inr(ctx?.hourlyRateInr)}`} pct={hourlyPct} tone="blue" />
            <ProgressRow label="Work hours per day" value={num(ctx?.hoursPerDay, 0)} pct={hoursPct} tone="amber" />
            <ProgressRow label="Working days per week" value={num(ctx?.daysActive, 0)} pct={daysPct} tone="green" />
            <ProgressRow label="Work consistency" value={num(pv?.Phi_r)} pct={workConsistencyPct} tone="violet" />
          </InsightCard>
          <InsightCard title="Pricing drivers">
            <ProgressRow label="Risk in your state" value={num(ctx?.stateRiskScore, 3)} pct={stateRiskPct} tone="blue" />
            <ProgressRow
              label="Location trust score"
              value={locLambda != null ? num(locLambda, 3) : num(user?.validationCoefficient, 3)}
              pct={locationTrustPct}
              tone="green"
            />
            <ProgressRow label="Service margin" value={pv?.M_percent != null ? `${pv.M_percent}%` : "-"} pct={marginPct} tone="amber" />
            <ProgressRow label="Shared pool factor" value={num(pv?.K, 2)} pct={poolPct} tone="rose" />
          </InsightCard>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Live conditions in your area</h2>
          <button type="button" className="btn-sm" disabled={busy.signals} onClick={() => refreshDashboard()}>
            {busy.signals ? "..." : "Refresh"}
          </button>
        </div>
        <div className="stat-grid stat-grid-4 live-grid">
          <Stat className="stat-hero live-primary" label="Air quality score" value={num(aq?.value, 0)} />
          <Stat className="stat-key" label="Current temperature (C)" value={num(w?.tempC, 1)} />
          <Stat className="stat-key" label="Risk signals active" value={activeSignals} />
        </div>
        <div className="insight-grid insight-grid-compact">
          <InsightCard title="Trigger thresholds">
            <ThresholdRow label="Air quality" value={num(aq?.value, 0)} current={aqiValue} max={300} threshold={200} tone="rose" />
            <ThresholdRow
              label="PM2.5 dust"
              value={aq?.pm25 != null ? num(aq.pm25, 0) : "-"}
              current={aq?.pm25 ?? 0}
              max={200}
              threshold={150}
              tone="amber"
            />
            <ThresholdRow label="Wind speed" value={num(w?.windSpeedMs, 2)} current={windValue} max={20} threshold={14} tone="blue" />
            <ThresholdRow label="Rain in last hour" value={num(w?.rainfall1h, 2)} current={rainValue} max={20} threshold={15} tone="green" />
          </InsightCard>
          <InsightCard title="Signal status">
            <ProgressRow label="Temperature now" value={num(w?.tempC, 1)} pct={temperaturePct} tone="amber" />
            <ProgressRow label="Active signals" value={activeSignals} pct={activeSignalPct} tone="violet" />
            <StatusRow label="Restriction alert" value={civil ? "Restriction active" : "No restriction"} tone={civil ? "alert" : "ok"} />
            <ProgressRow label="PM10 dust" value={aq?.pm10 != null ? num(aq.pm10, 0) : "-"} pct={pm10Pct} tone="blue" />
          </InsightCard>
        </div>
        <BarMeter value={trig?.severityCode ?? 0} max={2} label="Today's disruption level" />
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Emergency support payout</h2>
          <button type="button" className="btn-sm" disabled={busy.payout} onClick={runPayout}>
            {busy.payout ? "..." : "Check now"}
          </button>
        </div>
        <div className="stat-grid stat-grid-4 payout-grid">
          <Stat className="stat-hero payout-primary" label="Can you get support now?" value={payoutEval?.payout ? (payoutEval.payout.eligible ? "Yes" : "No") : "-"} />
          <Stat className="stat-hero payout-amount" label="Amount (Rs.)" value={payoutEval?.payout ? inr(payoutEval.payout.amount) : "-"} />
        </div>
        <div className="insight-grid insight-grid-compact">
          <InsightCard title="Payout thresholds">
            <ThresholdRow
              label="Fraud hold score"
              value={fraudScore != null ? num(fraudScore, 3) : "-"}
              current={fraudScore ?? 0}
              max={0.5}
              threshold={fraudThreshold}
              tone="green"
            />
            <ThresholdRow
              label="Support used vs cap"
              value={payoutCap ? `${Math.round(payoutAmountPct)}%` : "-"}
              current={payoutAmount}
              max={payoutCap || 1}
              threshold={payoutCap || 0}
              tone="blue"
            />
          </InsightCard>
          <InsightCard title="Payout history">
            <ProgressRow label="Total payouts received" value={num(para.length, 0)} pct={payoutsPct} tone="amber" />
            <StatusRow
              label="Support status"
              value={payoutEval?.payout ? (payoutEval.payout.eligible ? "Eligible now" : "Not eligible now") : "Not checked yet"}
              tone={payoutEval?.payout ? (payoutEval.payout.eligible ? "ok" : "neutral") : "neutral"}
            />
          </InsightCard>
        </div>
        {payoutEval?.err && <div className="banner banner-err">{payoutEval.err}</div>}
        <table className="data-table">
          <thead>
            <tr>
              <th>Amount (Rs.)</th>
              <th>Received on</th>
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
                  <td>{p.createdAt ? new Date(p.createdAt).toLocaleString("en-IN") : "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {editOpen && (
        <div className="modal-back" onClick={() => setEditOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Your work details</h3>
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
                  Delivery app
                  <select value={gigEdit.platform} onChange={(e) => setGigEdit({ ...gigEdit, platform: e.target.value })}>
                    {(platforms.length ? platforms : [{ id: "zomato" }]).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.id}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Plan
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
                  Work hours per day
                  <input
                    type="number"
                    min={4}
                    max={14}
                    value={gigEdit.hoursPerDay}
                    onChange={(e) => setGigEdit({ ...gigEdit, hoursPerDay: Number(e.target.value) })}
                  />
                </label>
                <label>
                  Working days per week
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

