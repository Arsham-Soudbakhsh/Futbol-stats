import React from "react";
import { C } from "../constants";
import { getMetricsConfig, normalizePosition } from "../../../utils/positionMetrics";

/**
 * Dual-polygon radar: the signed-in player overlaid against the average of
 * teammates that share the same position.
 *
 * Props:
 *  - position: "GK" | "DEF" | "MID" | "FWD"
 *  - you:   { m1, m2, m3, m4 } or null
 *  - peers: { m1, m2, m3, m4 } or null
 *  - peerCount: number
 *  - size: pixel size
 */
export default function ComparisonRadar({
  position,
  you = {},
  peers = null,
  size = 200,
}) {
  const cfg = getMetricsConfig(position);
  const youColor = cfg.color || C.brand;
  const peerColor = "var(--text-muted)";

  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const keys = cfg.metrics.map((m) => m.key);
  const labels = cfg.metrics.map((m) => shortLabel(m.label));

  const pt = (i, r) => {
    const a = ((Math.PI * 2) / keys.length) * i - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ringPts = (r) => keys.map((_, i) => pt(i, r).join(",")).join(" ");
  const polyPts = (src) =>
    keys
      .map((k, i) =>
        pt(i, (Math.max(0, Math.min(100, src?.[k] || 0)) / 100) * maxR).join(",")
      )
      .join(" ");

  const youPts = polyPts(you);
  const peerPts = peers ? polyPts(peers) : null;
  const posKey = normalizePosition(position) || "MID";

  return (
    <svg width={size} height={size} className="radar-svg cmp-radar">
      <defs>
        <radialGradient id={`cmpYou-${posKey}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={youColor} stopOpacity="0.45" />
          <stop offset="100%" stopColor={youColor} stopOpacity="0.08" />
        </radialGradient>
      </defs>

      {[0.33, 0.66, 1].map((k, i) => (
        <polygon key={i} points={ringPts(maxR * k)} fill="none"
          stroke="var(--border)" strokeWidth="1" />
      ))}
      {keys.map((_, i) => {
        const [x, y] = pt(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y}
          stroke="var(--border)" strokeWidth="1" />;
      })}

      {/* Peers polygon (background) */}
      {peerPts && (
        <polygon points={peerPts} fill="none"
          stroke={peerColor} strokeWidth="1.6"
          strokeDasharray="4 4" opacity="0.85" />
      )}

      {/* Your polygon (foreground) */}
      <polygon points={youPts}
        fill={`url(#cmpYou-${posKey})`}
        stroke={youColor} strokeWidth="2.2"
        style={{ transition: "all .6s ease" }} />
      {keys.map((k, i) => {
        const [x, y] = pt(i, (Math.max(0, Math.min(100, you?.[k] || 0)) / 100) * maxR);
        return <circle key={k} cx={x} cy={y} r="3.6" fill="#fff"
          stroke={youColor} strokeWidth="2" />;
      })}

      {labels.map((lb, i) => {
        const [x, y] = pt(i, maxR + 16);
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
  const words = label.split(/\s+/);
  if (words.length === 1) return label.slice(0, 5).toUpperCase();
  return words.slice(0, 2).map((w) => w.slice(0, 4)).join(" ").toUpperCase();
}
