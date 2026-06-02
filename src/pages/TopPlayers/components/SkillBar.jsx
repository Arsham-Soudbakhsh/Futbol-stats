import React from "react";
import { ratingColor } from "../ratingColor";

// One skill cell with numeric value + horizontal bar.
export default function SkillBar({ val }) {
  const color = ratingColor(val);
  return (
    <div className="skill-cell">
      <span className="skill-num" style={{ color }}>{val}</span>
      <div className="skill-bar">
        <div
          className="skill-bar__fill"
          style={{ width: `${val}%`, background: color }}
        />
      </div>
    </div>
  );
}
