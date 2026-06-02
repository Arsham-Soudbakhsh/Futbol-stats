import React from "react";
import { POSITIONS } from "../constants";

// Four-tile pitch-position picker. Required for both player and captain.
export default function PositionPicker({ position, onChange }) {
  return (
    <div className="auth-block">
      <div className="auth-block__label">
        <i className="ti ti-map-pin" /> Your position
        <span className="auth-block__hint">
          Captains pick their pitch role too
        </span>
      </div>
      <div className="auth-pos-grid">
        {POSITIONS.map((p) => {
          const active = position === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(p.id)}
              className={`auth-pos ${active ? "is-active" : ""}`}
              style={{ "--pc": p.color }}
            >
              <span className="auth-pos__icon">
                <i className={`ti ${p.icon}`} />
              </span>
              <span className="auth-pos__id">{p.id}</span>
              <span className="auth-pos__label">{p.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
