import React from "react";
import Field from "./Field";
import RolePicker from "./RolePicker";
import PositionPicker from "./PositionPicker";

/**
 * Auth form fields. Receives the entire `form` object from useAuthForm.
 * Form state, submit handler and mode toggling all live in the hook.
 */
export default function AuthForm({ form }) {
  const {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    showPwd,
    setShowPwd,
    fullName,
    setFullName,
    role,
    setRole,
    position,
    setPosition,
    inviteCode,
    setInviteCode,
    loading,
    error,
    submit,
  } = form;

  return (
    <form onSubmit={submit} className="auth-form">
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
          <RolePicker
            role={role}
            onChange={(id) => {
              setRole(id);
              setInviteCode("");
            }}
          />
          <PositionPicker position={position} onChange={setPosition} />

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
            <>
              Sign in <i className="ti ti-arrow-right" />
            </>
          ) : (
            <>
              Create account <i className="ti ti-sparkles" />
            </>
          )}
        </span>
      </button>
    </form>
  );
}
