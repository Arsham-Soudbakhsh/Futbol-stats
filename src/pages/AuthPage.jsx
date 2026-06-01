import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  signIn,
  signUp,
  verifyInviteCode,
  consumeInviteCode,
} from "../lib/firebase";
import { useAuthStore } from "../store/authStore";
import "../pages/pages.css";

const POSITIONS = [
  { id: "GK",  label: "Goalkeeper", icon: "ti-hand-stop",        color: "#E8C76A" },
  { id: "DEF", label: "Defender",   icon: "ti-shield",           color: "#5E8C31" },
  { id: "MID", label: "Midfielder", icon: "ti-arrows-exchange",  color: "#60A5FA" },
  { id: "FWD", label: "Forward",    icon: "ti-ball-football",    color: "#C95B5B" },
];

const ROLES = [
  { id: "player",  label: "Player",  icon: "ti-user",         desc: "Track your stats"     },
  { id: "captain", label: "Captain", icon: "ti-shield-star",  desc: "Lead & rate your squad" },
];

export default function AuthPage() {
  const [mode, setMode]           = useState("signin");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPwd, setShowPwd]     = useState(false);
  const [fullName, setFullName]   = useState("");
  const [role, setRole]           = useState("player");
  const [position, setPosition]   = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const navigate = useNavigate();
  const { enterAsGuest, user }    = useAuthStore();

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);

  const handleGuest = () => { enterAsGuest(); navigate("/"); };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setRole("player");
    setPosition("");
    setInviteCode("");
  };

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    let inviteData = null;

    if (mode === "signup") {
      // ── BUG FIX: position is now required for BOTH player AND captain ──
      if (!position) {
        setError("Please select your position.");
        return;
      }
      if (!inviteCode.trim()) {
        setError("Invite code required.");
        return;
      }
      inviteData = await verifyInviteCode(inviteCode.trim());
      if (!inviteData)              { setError("Invalid or used invite code."); return; }
      if (inviteData.role !== role) { setError(`This code is for ${inviteData.role}.`); return; }
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        // ── BUG FIX: pass `position` for captains too (was `role === "player" ? position : null`) ──
        const u = await signUp(email, password, fullName, role, position);
        await consumeInviteCode(inviteCode.trim(), u.uid);
        navigate("/");
      }
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email":        "Invalid email address.",
        "auth/weak-password":        "Password must be at least 6 characters.",
        "auth/user-not-found":       "No account found with this email.",
        "auth/wrong-password":       "Incorrect password.",
        "auth/invalid-credential":   "Incorrect email or password.",
      };
      setError(msgs[err.code] || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <AuthStyles />

      {/* animated background */}
      <div className="auth-bg" aria-hidden>
        <div className="auth-bg__pitch" />
        <div className="auth-bg__blob auth-bg__blob--1" />
        <div className="auth-bg__blob auth-bg__blob--2" />
        <div className="auth-bg__blob auth-bg__blob--3" />
        <div className="auth-bg__grid" />
      </div>

      <div className="auth-wrap">
        {/* Left brand panel (hidden on small screens) */}
        <aside className="auth-brand">
          <div className="auth-brand__logo">
            <span className="auth-brand__logo-mark">
              <i className="ti ti-ball-football" />
            </span>
            <div>
              <div className="auth-brand__name">FutbolStats</div>
              <div className="auth-brand__tag">Captain · Squad · Glory</div>
            </div>
          </div>

          <div className="auth-brand__quote">
            <i className="ti ti-quote" />
            <p>“Track every pass, every goal, every legend in the making.”</p>
          </div>

          <ul className="auth-brand__features">
            <li><span><i className="ti ti-chart-radar" /></span> Player radars & weekly trends</li>
            <li><span><i className="ti ti-trophy" /></span> Best Team of the week, on a real pitch</li>
            <li><span><i className="ti ti-shield-star" /></span> Captain panel: pick squad &amp; rate teammates</li>
            <li><span><i className="ti ti-flame" /></span> Live leaderboards &amp; awards</li>
          </ul>

          <div className="auth-brand__foot">
            <span className="auth-dot" /> Season 2026 — Live
          </div>
        </aside>

        {/* Form card */}
        <main className="auth-card">
          <header className="auth-card__head">
            <div className="auth-card__logo">
              <span className="auth-card__logo-mark">
                <i className="ti ti-ball-football" />
              </span>
              <span className="auth-card__logo-name">FutbolStats</span>
            </div>

            <div className="auth-segment" role="tablist">
              <button
                role="tab"
                aria-selected={mode === "signin"}
                className={`auth-segment__btn ${mode === "signin" ? "is-active" : ""}`}
                onClick={() => switchMode("signin")}
                type="button"
              >
                <i className="ti ti-login-2" /> Sign in
              </button>
              <button
                role="tab"
                aria-selected={mode === "signup"}
                className={`auth-segment__btn ${mode === "signup" ? "is-active" : ""}`}
                onClick={() => switchMode("signup")}
                type="button"
              >
                <i className="ti ti-user-plus" /> Sign up
              </button>
              <span
                className="auth-segment__pill"
                style={{ transform: `translateX(${mode === "signup" ? "100%" : "0%"})` }}
              />
            </div>
          </header>

          <div className="auth-card__title">
            <h1>{mode === "signin" ? "Welcome back" : "Join the league"}</h1>
            <p>
              {mode === "signin"
                ? "Sign in to see your stats and weekly form."
                : "Create your account and step onto the pitch."}
            </p>
          </div>

          <form onSubmit={handle} className="auth-form">
            {mode === "signup" && (
              <Field icon="ti-id-badge-2" label="Full name">
                <input
                  className="auth-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Arsham Rezaei"
                  required
                />
              </Field>
            )}

            <Field icon="ti-mail" label="Email">
              <input
                className="auth-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </Field>

            <Field icon="ti-lock" label="Password">
              <input
                className="auth-input"
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
              />
              <button
                type="button"
                className="auth-eye"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Hide password" : "Show password"}
              >
                <i className={`ti ${showPwd ? "ti-eye-off" : "ti-eye"}`} />
              </button>
            </Field>

            {mode === "signup" && (
              <>
                {/* Role chooser */}
                <div className="auth-block">
                  <div className="auth-block__label">
                    <i className="ti ti-users" /> I am a
                  </div>
                  <div className="auth-role-grid">
                    {ROLES.map((r) => {
                      const active = role === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          className={`auth-role ${active ? "is-active" : ""}`}
                          onClick={() => { setRole(r.id); setInviteCode(""); }}
                        >
                          <span className="auth-role__icon">
                            <i className={`ti ${r.icon}`} />
                          </span>
                          <span className="auth-role__txt">
                            <strong>{r.label}</strong>
                            <small>{r.desc}</small>
                          </span>
                          <span className="auth-role__check">
                            <i className="ti ti-check" />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Position — now ALWAYS shown for both player & captain (BUG FIX) */}
                <div className="auth-block">
                  <div className="auth-block__label">
                    <i className="ti ti-map-pin" /> Your position
                    <span className="auth-block__hint">Captains pick their pitch role too</span>
                  </div>
                  <div className="auth-pos-grid">
                    {POSITIONS.map((p) => {
                      const active = position === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setPosition(p.id)}
                          className={`auth-pos ${active ? "is-active" : ""}`}
                          style={{
                            "--pc": p.color,
                          }}
                        >
                          <span className="auth-pos__icon"><i className={`ti ${p.icon}`} /></span>
                          <span className="auth-pos__id">{p.id}</span>
                          <span className="auth-pos__label">{p.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Invite code */}
                <Field icon="ti-key" label="Invite code">
                  <input
                    className="auth-input auth-input--mono"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="XXXX-XXXX"
                    required
                  />
                </Field>
                <div className="auth-hint">
                  <i className="ti ti-info-circle" /> Provided by your admin
                </div>
              </>
            )}

            {error && (
              <div className="auth-error">
                <i className="ti ti-alert-triangle" />
                <span>{error}</span>
              </div>
            )}

            <button className="auth-submit" disabled={loading} type="submit">
              <span className="auth-submit__bg" />
              <span className="auth-submit__txt">
                {loading ? (
                  <>
                    <span className="auth-spin" /> Please wait…
                  </>
                ) : mode === "signin" ? (
                  <>Sign in <i className="ti ti-arrow-right" /></>
                ) : (
                  <>Create account <i className="ti ti-sparkles" /></>
                )}
              </span>
            </button>
          </form>

          <div className="auth-divider">
            <span /><b>or</b><span />
          </div>

          <button className="auth-guest" type="button" onClick={handleGuest}>
            <i className="ti ti-eye" /> Continue as guest
          </button>

          <p className="auth-foot">
            {mode === "signin" ? (
              <>New here? <button type="button" onClick={() => switchMode("signup")}>Create an account</button></>
            ) : (
              <>Already a member? <button type="button" onClick={() => switchMode("signin")}>Sign in</button></>
            )}
          </p>
        </main>
      </div>
    </div>
  );
}

/* ── Small helpers ─────────────────────────────────────────── */
function Field({ icon, label, children }) {
  return (
    <label className="auth-field">
      <span className="auth-field__label">{label}</span>
      <span className="auth-field__wrap">
        <i className={`ti ${icon} auth-field__icon`} />
        {children}
      </span>
    </label>
  );
}

/* ── Scoped styles (uses your existing design tokens) ──────── */
function AuthStyles() {
  return (
    <style>{`
      .auth-shell{
        position:relative; min-height:100dvh; width:100%;
        display:flex; align-items:center; justify-content:center;
        padding: clamp(12px, 4vw, 40px);
        background: var(--bg, #0b0f0e);
        color: var(--text, #e9eee9);
        overflow:hidden;
      }
      /* background layers */
      .auth-bg{position:absolute; inset:0; overflow:hidden; pointer-events:none; z-index:0;}
      .auth-bg__pitch{
        position:absolute; inset:-10%;
        background:
          radial-gradient(ellipse at 50% 0%, color-mix(in oklab, var(--primary, #6aa84f) 35%, transparent), transparent 60%),
          radial-gradient(ellipse at 100% 100%, color-mix(in oklab, var(--primary, #6aa84f) 22%, transparent), transparent 55%),
          linear-gradient(180deg, #0a0f0d, #0a1410 60%, #08120f);
        filter: saturate(1.05);
      }
      .auth-bg__grid{
        position:absolute; inset:0;
        background-image:
          linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px);
        background-size: 38px 38px;
        mask-image: radial-gradient(ellipse at center, #000 40%, transparent 75%);
      }
      .auth-bg__blob{
        position:absolute; border-radius:50%; filter: blur(70px); opacity:.55;
        animation: authFloat 14s ease-in-out infinite;
      }
      .auth-bg__blob--1{ width:520px; height:520px; left:-120px; top:-120px;
        background: radial-gradient(circle, color-mix(in oklab, var(--primary, #6aa84f) 75%, transparent), transparent 70%);
      }
      .auth-bg__blob--2{ width:460px; height:460px; right:-140px; bottom:-140px;
        background: radial-gradient(circle, color-mix(in oklab, #60A5FA 70%, transparent), transparent 70%);
        animation-delay:-6s;
      }
      .auth-bg__blob--3{ width:360px; height:360px; right:20%; top:30%;
        background: radial-gradient(circle, color-mix(in oklab, #E8C76A 60%, transparent), transparent 70%);
        animation-delay:-3s;
      }
      @keyframes authFloat{
        0%,100%{ transform: translate3d(0,0,0) scale(1);}
        50%   { transform: translate3d(20px,-30px,0) scale(1.06);}
      }

      .auth-wrap{
        position:relative; z-index:1;
        width:100%; max-width: 1080px;
        display:grid; grid-template-columns: 1.05fr .95fr; gap: 28px;
        align-items: stretch;
      }

      /* Brand side */
      .auth-brand{
        position:relative; padding: 36px;
        border-radius: 28px;
        background:
          linear-gradient(165deg, rgba(255,255,255,.06), rgba(255,255,255,.02)),
          radial-gradient(80% 60% at 0% 0%, color-mix(in oklab, var(--primary, #6aa84f) 28%, transparent), transparent 60%);
        border: 1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        overflow:hidden;
        display:flex; flex-direction:column; gap:28px;
      }
      .auth-brand::before{
        content:""; position:absolute; inset:0;
        background:
          repeating-linear-gradient(115deg, rgba(255,255,255,.045) 0 1px, transparent 1px 26px);
        opacity:.5; pointer-events:none;
      }
      .auth-brand__logo{ display:flex; align-items:center; gap:14px; position:relative;}
      .auth-brand__logo-mark{
        width:48px; height:48px; border-radius:14px;
        display:grid; place-items:center; font-size:24px; color:#0b1410;
        background: linear-gradient(135deg, #d8ff8b, #6aa84f);
        box-shadow: 0 10px 30px -8px color-mix(in oklab, var(--primary, #6aa84f) 65%, transparent);
      }
      .auth-brand__name{ font-size:22px; font-weight:800; letter-spacing:.3px;}
      .auth-brand__tag{ font-size:12px; color: rgba(255,255,255,.7); margin-top:2px;}

      .auth-brand__quote{
        position:relative; padding:18px 18px 18px 46px;
        border-radius:18px;
        background: rgba(255,255,255,.04);
        border:1px solid rgba(255,255,255,.08);
        font-size:15px; line-height:1.55; color: rgba(255,255,255,.88);
      }
      .auth-brand__quote .ti{
        position:absolute; left:14px; top:14px; font-size:22px;
        color: color-mix(in oklab, var(--primary, #6aa84f) 85%, white);
      }
      .auth-brand__quote p{ margin:0;}

      .auth-brand__features{ list-style:none; padding:0; margin:0; display:grid; gap:12px; position:relative;}
      .auth-brand__features li{
        display:flex; align-items:center; gap:12px;
        font-size:14px; color: rgba(255,255,255,.88);
      }
      .auth-brand__features li span{
        width:34px; height:34px; border-radius:10px; display:grid; place-items:center;
        background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08);
        color: color-mix(in oklab, var(--primary, #6aa84f) 90%, white);
        font-size:16px;
      }
      .auth-brand__foot{
        margin-top:auto; display:flex; align-items:center; gap:10px;
        color: rgba(255,255,255,.6); font-size:12px; letter-spacing:.4px; text-transform:uppercase;
      }
      .auth-dot{
        width:8px; height:8px; border-radius:50%; background:#4ade80;
        box-shadow: 0 0 0 0 rgba(74,222,128,.7); animation: authPulse 1.8s infinite;
      }
      @keyframes authPulse{
        0%{ box-shadow: 0 0 0 0 rgba(74,222,128,.55);}
        70%{ box-shadow: 0 0 0 10px rgba(74,222,128,0);}
        100%{ box-shadow: 0 0 0 0 rgba(74,222,128,0);}
      }

      /* Card */
      .auth-card{
        position:relative; padding: clamp(20px, 3vw, 32px);
        border-radius: 28px;
        background:
          linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.03));
        border:1px solid rgba(255,255,255,.08);
        backdrop-filter: blur(18px) saturate(1.05);
        -webkit-backdrop-filter: blur(18px) saturate(1.05);
        box-shadow:
          0 30px 80px -30px rgba(0,0,0,.7),
          inset 0 1px 0 rgba(255,255,255,.06);
        display:flex; flex-direction:column; gap:18px;
        animation: authIn .55s cubic-bezier(.2,.7,.2,1) both;
      }
      @keyframes authIn{ from{opacity:0; transform: translateY(14px) scale(.98);} to{opacity:1; transform:none;}}

      .auth-card__head{ display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;}
      .auth-card__logo{ display:flex; align-items:center; gap:10px;}
      .auth-card__logo-mark{
        width:36px; height:36px; border-radius:11px; display:grid; place-items:center;
        background: linear-gradient(135deg, #d8ff8b, #6aa84f); color:#0b1410; font-size:18px;
        box-shadow: 0 8px 20px -8px color-mix(in oklab, var(--primary, #6aa84f) 70%, transparent);
      }
      .auth-card__logo-name{ font-weight:800; letter-spacing:.3px;}

      .auth-segment{
        position:relative; display:inline-flex; padding:4px;
        background: rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.08);
        border-radius: 999px; overflow:hidden;
      }
      .auth-segment__btn{
        position:relative; z-index:2; appearance:none; background:transparent; border:0;
        padding: 8px 14px; border-radius:999px; font-size:13px; font-weight:600;
        color: rgba(255,255,255,.7); cursor:pointer; display:inline-flex; align-items:center; gap:6px;
        transition: color .2s;
      }
      .auth-segment__btn.is-active{ color:#0b1410;}
      .auth-segment__pill{
        position:absolute; z-index:1; top:4px; bottom:4px; left:4px; width: calc(50% - 4px);
        border-radius: 999px; background: linear-gradient(135deg, #d8ff8b, #6aa84f);
        transition: transform .35s cubic-bezier(.2,.7,.2,1);
        box-shadow: 0 6px 16px -6px color-mix(in oklab, var(--primary, #6aa84f) 60%, transparent);
      }

      .auth-card__title h1{
        font-size: clamp(22px, 3.2vw, 28px); margin:0; font-weight:800; letter-spacing:.2px;
      }
      .auth-card__title p{
        margin: 6px 0 0; color: rgba(255,255,255,.65); font-size: 13.5px;
      }

      .auth-form{ display:flex; flex-direction:column; gap:14px;}

      /* Fields */
      .auth-field{ display:flex; flex-direction:column; gap:6px; position:relative;}
      .auth-field__label{ font-size:12px; color: rgba(255,255,255,.7); font-weight:600; letter-spacing:.3px;}
      .auth-field__wrap{ position:relative;}
      .auth-field__icon{
        position:absolute; left:14px; top:50%; transform: translateY(-50%);
        color: rgba(255,255,255,.55); font-size:17px; pointer-events:none;
      }
      .auth-input{
        width:100%; height:46px; padding: 0 44px 0 42px;
        border-radius: 14px;
        background: rgba(255,255,255,.04);
        border:1px solid rgba(255,255,255,.1);
        color:#fff; font-size:14px; letter-spacing:.2px;
        transition: border-color .2s, background .2s, box-shadow .2s;
        outline:none;
      }
      .auth-input::placeholder{ color: rgba(255,255,255,.35);}
      .auth-input:focus{
        border-color: color-mix(in oklab, var(--primary, #6aa84f) 75%, white);
        background: rgba(255,255,255,.07);
        box-shadow: 0 0 0 4px color-mix(in oklab, var(--primary, #6aa84f) 22%, transparent);
      }
      .auth-input--mono{ font-family: ui-monospace, "JetBrains Mono", Menlo, monospace; letter-spacing:1.5px; text-transform:uppercase;}
      .auth-eye{
        position:absolute; right:6px; top:50%; transform: translateY(-50%);
        width:36px; height:36px; border-radius:10px; border:0; cursor:pointer;
        background: transparent; color: rgba(255,255,255,.7);
        display:grid; place-items:center; font-size:17px;
      }
      .auth-eye:hover{ background: rgba(255,255,255,.06); color:#fff;}

      .auth-block{ display:flex; flex-direction:column; gap:10px;}
      .auth-block__label{
        display:flex; align-items:center; gap:8px;
        font-size:12px; color: rgba(255,255,255,.75); font-weight:600; letter-spacing:.3px;
      }
      .auth-block__label .ti{ color: color-mix(in oklab, var(--primary, #6aa84f) 90%, white);}
      .auth-block__hint{
        margin-left:auto; font-weight:500; color: rgba(255,255,255,.45); font-size:11px;
      }

      /* Role chooser */
      .auth-role-grid{ display:grid; grid-template-columns: 1fr 1fr; gap:10px;}
      .auth-role{
        display:flex; align-items:center; gap:12px; padding:12px;
        border-radius: 14px; cursor:pointer; text-align:left;
        background: rgba(255,255,255,.03);
        border:1.5px solid rgba(255,255,255,.08);
        color:#fff; transition: all .2s;
        position:relative;
      }
      .auth-role:hover{ background: rgba(255,255,255,.06); transform: translateY(-1px);}
      .auth-role__icon{
        width:38px; height:38px; border-radius:11px; display:grid; place-items:center; font-size:18px;
        background: rgba(255,255,255,.06); color: rgba(255,255,255,.85);
        transition: all .2s;
      }
      .auth-role__txt{ display:flex; flex-direction:column; gap:2px; min-width:0;}
      .auth-role__txt strong{ font-size:13.5px;}
      .auth-role__txt small{ font-size:11px; color: rgba(255,255,255,.55);}
      .auth-role__check{
        margin-left:auto; width:22px; height:22px; border-radius:50%;
        background: transparent; border:1.5px solid rgba(255,255,255,.15);
        display:grid; place-items:center; color: transparent; font-size:13px;
        transition: all .2s;
      }
      .auth-role.is-active{
        border-color: color-mix(in oklab, var(--primary, #6aa84f) 70%, white);
        background: color-mix(in oklab, var(--primary, #6aa84f) 12%, transparent);
        box-shadow: 0 10px 24px -16px color-mix(in oklab, var(--primary, #6aa84f) 80%, transparent);
      }
      .auth-role.is-active .auth-role__icon{
        background: linear-gradient(135deg, #d8ff8b, #6aa84f); color:#0b1410;
      }
      .auth-role.is-active .auth-role__check{
        background: linear-gradient(135deg, #d8ff8b, #6aa84f); border-color: transparent; color:#0b1410;
      }

      /* Position picker */
      .auth-pos-grid{ display:grid; grid-template-columns: repeat(4, 1fr); gap:8px;}
      .auth-pos{
        display:flex; flex-direction:column; align-items:center; gap:6px;
        padding: 12px 6px; border-radius: 14px; cursor:pointer;
        background: rgba(255,255,255,.03);
        border: 1.5px solid rgba(255,255,255,.08); color:#fff;
        transition: all .2s;
      }
      .auth-pos:hover{ transform: translateY(-2px); background: rgba(255,255,255,.06);}
      .auth-pos__icon{
        width:34px; height:34px; border-radius:10px; display:grid; place-items:center; font-size:17px;
        background: rgba(255,255,255,.06); color: rgba(255,255,255,.75);
        transition: all .2s;
      }
      .auth-pos__id{ font-size:11px; font-weight:800; letter-spacing:.6px; color: rgba(255,255,255,.75);}
      .auth-pos__label{ font-size:10px; color: rgba(255,255,255,.5); font-weight:500;}
      .auth-pos.is-active{
        border-color: var(--pc);
        background: color-mix(in oklab, var(--pc) 14%, transparent);
        box-shadow: 0 10px 24px -16px var(--pc);
      }
      .auth-pos.is-active .auth-pos__icon{
        background: color-mix(in oklab, var(--pc) 25%, transparent); color: var(--pc);
      }
      .auth-pos.is-active .auth-pos__id,
      .auth-pos.is-active .auth-pos__label{ color: var(--pc);}

      .auth-hint{
        display:flex; gap:6px; align-items:center; font-size:11.5px;
        color: rgba(255,255,255,.55); margin-top:-6px;
      }

      .auth-error{
        display:flex; align-items:center; gap:10px;
        padding: 10px 12px; border-radius: 12px;
        background: color-mix(in oklab, #ef4444 14%, transparent);
        border:1px solid color-mix(in oklab, #ef4444 40%, transparent);
        color: #fecaca; font-size: 13px;
      }
      .auth-error .ti{ font-size:16px; color:#fca5a5;}

      .auth-submit{
        position:relative; height:50px; border-radius:14px; border:0; cursor:pointer;
        color:#0b1410; font-weight:800; font-size:14.5px; letter-spacing:.3px;
        overflow:hidden; margin-top:4px;
      }
      .auth-submit:disabled{ opacity:.7; cursor:not-allowed;}
      .auth-submit__bg{
        position:absolute; inset:0;
        background: linear-gradient(135deg, #d8ff8b, #6aa84f 60%, #4d8a3a);
        transition: transform .4s;
      }
      .auth-submit:hover:not(:disabled) .auth-submit__bg{ transform: scale(1.05);}
      .auth-submit__txt{
        position:relative; z-index:1;
        display:inline-flex; align-items:center; justify-content:center; gap:8px;
        width:100%; height:100%;
      }
      .auth-submit__txt .ti{ font-size:17px;}
      .auth-spin{
        width:16px; height:16px; border-radius:50%;
        border:2px solid rgba(0,0,0,.25); border-top-color:#0b1410;
        animation: authSpin .9s linear infinite;
      }
      @keyframes authSpin{ to{ transform: rotate(360deg);} }

      .auth-divider{
        display:flex; align-items:center; gap:10px; color: rgba(255,255,255,.45); font-size:11px;
        text-transform:uppercase; letter-spacing:1px;
      }
      .auth-divider span{ flex:1; height:1px; background: rgba(255,255,255,.1);}
      .auth-divider b{ font-weight:600;}

      .auth-guest{
        height:44px; border-radius:12px; cursor:pointer; font-weight:600;
        background: rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.1);
        color: rgba(255,255,255,.85); display:inline-flex; align-items:center; justify-content:center; gap:8px;
        transition: background .2s, transform .2s;
      }
      .auth-guest:hover{ background: rgba(255,255,255,.08); transform: translateY(-1px);}

      .auth-foot{
        text-align:center; color: rgba(255,255,255,.6); font-size:13px; margin:4px 0 0;
      }
      .auth-foot button{
        background:none; border:0; cursor:pointer; padding:0;
        color: color-mix(in oklab, var(--primary, #6aa84f) 85%, white); font-weight:700;
      }
      .auth-foot button:hover{ text-decoration:underline;}

      /* Responsive */
      @media (max-width: 960px){
        .auth-wrap{ grid-template-columns: 1fr; max-width: 480px;}
        .auth-brand{ display:none;}
      }
      @media (max-width: 420px){
        .auth-pos-grid{ grid-template-columns: repeat(2, 1fr);}
        .auth-role-grid{ grid-template-columns: 1fr;}
        .auth-card{ border-radius: 22px;}
      }
      @media (prefers-reduced-motion: reduce){
        .auth-bg__blob, .auth-dot, .auth-spin{ animation: none !important;}
        .auth-card{ animation: none !important;}
      }
    `}</style>
  );
}
