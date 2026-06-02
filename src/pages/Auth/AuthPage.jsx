import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useAuthForm } from "./useAuthForm";
import AuthBackground from "./components/AuthBackground";
import BrandPanel from "./components/BrandPanel";
import AuthForm from "./components/AuthForm";
import "./Auth.css";

/**
 * AuthPage — split sign-in / sign-up flow with branded background.
 * All form state and submission logic lives in useAuthForm.
 */
export default function AuthPage() {
  const navigate = useNavigate();
  const { enterAsGuest, user } = useAuthStore();

  const form = useAuthForm({ onSuccess: () => navigate("/") });

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleGuest = () => {
    enterAsGuest();
    navigate("/");
  };

  const { mode, switchMode } = form;

  return (
    <div className="auth-shell">
      <AuthBackground />

      <div className="auth-wrap">
        <BrandPanel />

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
                style={{
                  transform: `translateX(${mode === "signup" ? "100%" : "0%"})`,
                }}
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

          <AuthForm form={form} />

          <div className="auth-divider">
            <span />
            <b>or</b>
            <span />
          </div>

          <button className="auth-guest" type="button" onClick={handleGuest}>
            <i className="ti ti-eye" /> Continue as guest
          </button>

          <p className="auth-foot">
            {mode === "signin" ? (
              <>
                New here?{" "}
                <button type="button" onClick={() => switchMode("signup")}>
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already a member?{" "}
                <button type="button" onClick={() => switchMode("signin")}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </main>
      </div>
    </div>
  );
}
