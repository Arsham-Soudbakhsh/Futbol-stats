import React from "react";

const POS_CONFIG = {
  GK: { color: "var(--text-secondary)", bg: "var(--bg-secondary)" },
  DEF: { color: "var(--primary)", bg: "var(--primary-soft)" },
  MID: {
    color: "var(--warning)",
    bg: "color-mix(in oklab, var(--warning) 14%, transparent)",
  },
  FWD: {
    color: "var(--danger)",
    bg: "color-mix(in oklab, var(--danger) 14%, transparent)",
  },
};

/**
 * Small coloured pill that labels a player's position.
 * Used by Points, Captain and several other pages.
 */
export default function PosBadge({ pos, className = "" }) {
  if (!pos) return null;
  const c = POS_CONFIG[pos] || {};
  return (
    <span
      className={`pos-badge ${className}`.trim()}
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        flexShrink: 0,
      }}
    >
      {pos}
    </span>
  );
}

export { POS_CONFIG };
