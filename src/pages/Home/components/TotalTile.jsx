import React from "react";
import { C } from "../constants";

// Season-view stat tile (smaller than KPI, 6-column grid).
export default function TotalTile({ icon, label, val, accent, dark }) {
  return (
    <div className={`tt${dark ? " tt--dark" : ""}`}>
      <i
        className={`ti ${icon} tt__icon`}
        style={{ color: dark ? "#fff" : accent || C.brand }}
      />
      <div className="tt__val">{val ?? 0}</div>
      <div className="tt__label">{label}</div>
    </div>
  );
}
