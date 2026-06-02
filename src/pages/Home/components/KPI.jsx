import React from "react";
import { C } from "../constants";

// Hero KPI tile. `dark` swaps to a primary gradient surface (used by Points).
export default function KPI({ icon, label, val, accent, dark }) {
  return (
    <div className={`kpi${dark ? " kpi--dark" : ""}`}>
      <div
        className="kpi__bar"
        style={{
          background: dark ? "rgba(255,255,255,.4)" : accent || C.brand,
        }}
      />
      <i
        className={`ti ${icon} kpi__icon`}
        style={{
          color: dark ? "rgba(255,255,255,.7)" : accent || C.brand,
        }}
      />
      <div className="kpi__label">{label}</div>
      <div className="kpi__val">{val}</div>
    </div>
  );
}
