import React from "react";
import { C } from "../constants";

// Hex-radar showing the four skill axes (PAS, SHO, DEF, DRI).
export default function Radar({ values, size = 180 }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 22;
  const keys = ["passing", "shooting", "defending", "dribbling"];
  const labels = ["PAS", "SHO", "DEF", "DRI"];

  const pt = (i, r) => {
    const a = ((Math.PI * 2) / keys.length) * i - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ringPts = (r) => keys.map((_, i) => pt(i, r).join(",")).join(" ");
  const dataPts = keys
    .map((k, i) =>
      pt(i, (Math.max(0, Math.min(100, values[k] || 0)) / 100) * maxR).join(","),
    )
    .join(" ");

  return (
    <svg width={size} height={size} className="radar-svg">
      <defs>
        <radialGradient id="radFill" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={C.brand} stopOpacity="0.35" />
          <stop offset="100%" stopColor={C.brand} stopOpacity="0.08" />
        </radialGradient>
      </defs>

      {[0.33, 0.66, 1].map((k, i) => (
        <polygon
          key={i}
          points={ringPts(maxR * k)}
          fill="none"
          stroke="var(--border)"
          strokeWidth="1"
        />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, maxR);
        return (
          <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />
        );
      })}

      <polygon
        points={dataPts}
        fill="url(#radFill)"
        stroke={C.brand}
        strokeWidth="2"
        style={{ transition: "all .6s ease" }}
      />
      {keys.map((k, i) => {
        const [x, y] = pt(
          i,
          (Math.max(0, Math.min(100, values[k] || 0)) / 100) * maxR,
        );
        return (
          <circle
            key={k}
            cx={x}
            cy={y}
            r="3.5"
            fill="#fff"
            stroke={C.brand}
            strokeWidth="2"
          />
        );
      })}
      {labels.map((lb, i) => {
        const [x, y] = pt(i, maxR + 12);
        return (
          <text
            key={lb}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="10"
            fontWeight="700"
            fill="var(--text-muted)"
          >
            {lb}
          </text>
        );
      })}
    </svg>
  );
}
