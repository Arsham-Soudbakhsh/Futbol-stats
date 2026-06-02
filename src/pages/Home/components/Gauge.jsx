import React from "react";
import { C } from "../constants";

// Circular gauge that paints the overall rating, tinted by tier.
export default function Gauge({ value, label }) {
  const v = Math.max(0, Math.min(100, value || 0));
  const size = 148;
  const stroke = 12;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const off = circ - (v / 100) * circ;
  const tier = v >= 80 ? "elite" : v >= 65 ? "good" : v >= 50 ? "avg" : "low";
  const color =
    tier === "elite"
      ? C.gold
      : tier === "good"
      ? C.brand2
      : tier === "avg"
      ? C.brand
      : "var(--text-muted)";

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id="gg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={C.brand} />
            <stop offset="100%" stopColor={color} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--bg-secondary)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#gg)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)",
          }}
        />
      </svg>
      <div className="gauge__inner">
        <div className="gauge__val">{v}</div>
        <div className="gauge__label">{label}</div>
      </div>
    </div>
  );
}
