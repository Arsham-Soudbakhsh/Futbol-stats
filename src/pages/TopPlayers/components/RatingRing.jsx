import React from "react";
import { ratingColor } from "../ratingColor";

// Small ring chart that prints the overall rating in the center.
export default function RatingRing({ avg = 0 }) {
  const value = Math.max(0, Math.min(100, avg));
  const r = 16, cx = 20, cy = 20;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = ratingColor(value);

  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={color}
      >
        {Math.round(value)}
      </text>
    </svg>
  );
}
