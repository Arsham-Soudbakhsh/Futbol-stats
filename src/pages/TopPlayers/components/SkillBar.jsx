import React from "react";
import { ratingColor } from "../ratingColor";

/**
 * Numeric value + horizontal bar. Optional override color (otherwise derived from value).
 */
export default function SkillBar({ val, color }) {
  const c = color || ratingColor(val);
  return (
    <div className="skill-cell">
      <span className="skill-num" style={{ color: c }}>{val}</span>
      <div className="skill-bar">
        <div className="skill-bar__fill" style={{ width: `${val}%`, background: c }} />
      </div>
    </div>
  );
}
