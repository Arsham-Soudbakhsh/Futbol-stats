import React, { useState } from "react";
import { useEffect } from "react";
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
  { id: "GK", label: "Goalkeeper", icon: "ti-hand-stop", color: "#8A9683" },
  { id: "DEF", label: "Defender", icon: "ti-shield", color: "#5E8C31" },
  {
    id: "MID",
    label: "Midfielder",
    icon: "ti-arrows-exchange",
    color: "#D6A23D",
  },
  { id: "FWD", label: "Forward", icon: "ti-ball-football", color: "#C95B5B" },
];

export default function AuthPage() {
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("player");
  const [position, setPosition] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { enterAsGuest, user } = useAuthStore();
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleGuest = () => {
    enterAsGuest();
    navigate("/");
  };

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
      if (role === "player" && !position) {
        setError("Please select your position.");
        return;
      }

      if (!inviteCode.trim()) {
        setError("Invite code required.");
        return;
      }

      inviteData = await verifyInviteCode(inviteCode.trim());

      if (!inviteData) {
        setError("Invalid or used invite code.");
        return;
      }

      if (inviteData.role !== role) {
        setError(`This code is for ${inviteData.role}.`);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        const user = await signUp(
          email,
          password,
          fullName,
          role,
          role === "player" ? position : null,
        );

        await consumeInviteCode(inviteCode.trim(), user.uid);

        navigate("/");
      }
    } catch (err) {
      const msgs = {
        "auth/email-already-in-use": "This email is already registered.",
        "auth/invalid-email": "Invalid email address.",
        "auth/weak-password": "Password must be at least 6 characters.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Incorrect email or password.",
      };
      setError(msgs[err.code] || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card fade-up">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="9" stroke="white" strokeWidth="1.5" />
              <path
                d="M11 4L13 8.5H18L14.5 11.5L16 16.5L11 13.5L6 16.5L7.5 11.5L4 8.5H9Z"
                fill="white"
                opacity=".9"
              />
            </svg>
          </div>
          <div className="auth-logo-name">FutbolStats</div>
          <div
            style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}
          >
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </div>
        </div>

        <form onSubmit={handle}>
          {/* Full name */}
          {mode === "signup" && (
            <div className="form-group">
              <label className="form-label">Full name</label>
              <input
                className="form-input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Arsham Rezaei"
                required
              />
            </div>
          )}

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          {mode === "signup" && (
            <>
              {/* Role */}
              <div className="form-group">
                <label className="form-label">I am a</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value);
                    setPosition("");
                    setInviteCode("");
                  }}
                >
                  <option value="player">Player</option>
                  <option value="captain">Captain</option>
                </select>
              </div>

              {/* Position — only for players */}
              {role === "player" && (
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(4,1fr)",
                      gap: 8,
                    }}
                  >
                    {POSITIONS.map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setPosition(pos.id)}
                        style={{
                          padding: "10px 6px",
                          borderRadius: 14,
                          border: `1.5px solid ${position === pos.id ? pos.color : "var(--border)"}`,
                          background:
                            position === pos.id
                              ? `${pos.color}18`
                              : "var(--surface-secondary)",
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: 5,
                          transition: "all .2s",
                        }}
                      >
                        <i
                          className={`ti ${pos.icon}`}
                          style={{
                            fontSize: 18,
                            color:
                              position === pos.id
                                ? pos.color
                                : "var(--text-muted)",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color:
                              position === pos.id
                                ? pos.color
                                : "var(--text-muted)",
                            letterSpacing: 0.3,
                            textTransform: "uppercase",
                          }}
                        >
                          {pos.id}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            color: "var(--text-muted)",
                            fontWeight: 500,
                          }}
                        >
                          {pos.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Captain code */}
              <div className="form-group">
                <label className="form-label">Invite code</label>

                <input
                  className="form-input"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  placeholder="Enter invite code"
                  style={{
                    fontFamily: "monospace",
                    letterSpacing: ".5px",
                  }}
                  required
                />

                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    marginTop: 5,
                  }}
                >
                  Provided by admin
                </div>
              </div>
            </>
          )}

          {error && <div className="error-msg">{error}</div>}

          <button
            className="btn btn-primary"
            style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
            disabled={loading}
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="auth-divider">
          <div className="auth-divider__line" />
          <span className="auth-divider__text">or</span>
          <div className="auth-divider__line" />
        </div>

        <button
          className="btn btn-ghost"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleGuest}
        >
          <i className="ti ti-eye" style={{ fontSize: 15 }} />
          Continue as guest
        </button>

        <div className="auth-toggle">
          {mode === "signin" ? (
            <>
              No account?{" "}
              <span onClick={() => switchMode("signup")}>Sign up</span>
            </>
          ) : (
            <>
              Have an account?{" "}
              <span onClick={() => switchMode("signin")}>Sign in</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
