import React from "react";

const POS_CONFIG = {
  GK: { color: "var(--pos-gk, var(--text-secondary))", bg: "var(--pos-gk-soft, var(--bg-secondary))" },
  DEF: { color: "var(--pos-def, var(--primary))", bg: "var(--pos-def-soft, var(--primary-soft))" },
  MID: {
    color: "var(--pos-mid, var(--warning))",
    bg: "var(--pos-mid-soft, color-mix(in oklab, var(--warning) 14%, transparent))",
  },
  FWD: {
    color: "var(--pos-fwd, var(--danger))",
    bg: "var(--pos-fwd-soft, color-mix(in oklab, var(--danger) 14%, transparent))",
  },
};

/**
 * Small coloured pill that labels a player's position.
 * When `pos` is empty, renders an invisible placeholder so callers
 * keep a stable layout (no layout shift between rows).
 */
export default function PosBadge({ pos, className = "" }) {
  const norm = (pos || "").toString().toUpperCase().slice(0, 3);
  const isKnown = norm in POS_CONFIG;
  const c = isKnown ? POS_CONFIG[norm] : { color: "transparent", bg: "transparent" };
  return (
    <span
      aria-hidden={!isKnown}
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
        visibility: isKnown ? "visible" : "hidden",
        minWidth: 26,
        textAlign: "center",
      }}
    >
      {isKnown ? norm : "—"}
    </span>
  );
}

export { POS_CONFIG };
