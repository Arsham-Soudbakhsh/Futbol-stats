import React from "react";
import { ROLES } from "../constants";

// Two-tile role picker (Player / Captain).
export default function RolePicker({ role, onChange }) {
  return (
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
              onClick={() => onChange(r.id)}
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
  );
}
