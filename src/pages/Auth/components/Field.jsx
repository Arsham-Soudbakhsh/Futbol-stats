import React from "react";

// Labelled input wrapper with a leading icon.
export default function Field({ icon, label, children }) {
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
