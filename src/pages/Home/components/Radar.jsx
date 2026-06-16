import React from "react";
import { C } from "../constants";
import { getMetricsConfig, normalizePosition } from "../../../utils/positionMetrics";

/**
 * Position-aware hex radar.
 * Props:
 *   - position: "GK" | "DEF" | "MID" | "FWD" (drives axis labels & colors)
 *   - values: { m1, m2, m3, m4 } OR legacy { passing, shooting, defending, dribbling }
 *   - size: pixel size
 */
export default function Radar({ position, values = {}, size = 180 }) {
  const cfg = getMetricsConfig(position);
  const axisColor = cfg.color || C.brand;

  // Accept both new (m1..m4) and legacy (passing/shooting/defending/dribbling) shapes.
  const v = {
    m1: values.m1 ?? values.passing   ?? 0,
    m2: values.m2 ?? values.shooting  ?? 0,
    m3: values.m3 ?? values.defending ?? 0,
    m4: values.m4 ?? values.dribbling ?? 0,
  };

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 28;
  const keys = cfg.metrics.map((m) => m.key);
  const labels = cfg.metrics.map((m) => shortLabel(m.label));

  const pt = (i, r) => {
    const a = ((Math.PI * 2) / keys.length) * i - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ringPts = (r) => keys.map((_, i) => pt(i, r).join(",")).join(" ");
  const dataPts = keys
    .map((k, i) => pt(i, (Math.max(0, Math.min(100, v[k] || 0)) / 100) * maxR).join(","))
    .join(" ");

  return (
    <svg width={size} height={size} className="radar-svg">
      <defs>
        <radialGradient id={`radFill-${normalizePosition(position) || "MID"}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={axisColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={axisColor} stopOpacity="0.08" />
        </radialGradient>
      </defs>

      {[0.33, 0.66, 1].map((k, i) => (
        <polygon key={i} points={ringPts(maxR * k)} fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth="1" />;
      })}

      <polygon points={dataPts}
        fill={`url(#radFill-${normalizePosition(position) || "MID"})`}
        stroke={axisColor} strokeWidth="2"
        style={{ transition: "all .6s ease" }} />
      {keys.map((k, i) => {
        const [x, y] = pt(i, (Math.max(0, Math.min(100, v[k] || 0)) / 100) * maxR);
        return <circle key={k} cx={x} cy={y} r="3.5" fill="#fff" stroke={axisColor} strokeWidth="2" />;
      })}
      {labels.map((lb, i) => {
        const [x, y] = pt(i, maxR + 14);
        return (
          <text key={lb} x={x} y={y}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fontWeight="700" fill="var(--text-muted)">
            {lb}
          </text>
        );
      })}
    </svg>
  );
}

function shortLabel(label) {
  // "Shot Stopping" → "SHOT", "Defensive Work Rate" → "DEF WORK"
  const words = label.split(/\s+/);
  if (words.length === 1) return label.slice(0, 5).toUpperCase();
  return words.slice(0, 2).map((w) => w.slice(0, 4)).join(" ").toUpperCase();
}
