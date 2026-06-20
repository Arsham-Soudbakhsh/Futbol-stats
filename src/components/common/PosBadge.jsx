import React, { memo } from "react";
import "./PosBadge.css";

/**
 * Map of normalized position codes → CSS color tokens.
 * Falls back through nested `var(--…)` so a missing position-specific
 * token still resolves to a sensible primary/secondary color.
 */
const POS_CONFIG = {
  GK:  { color: "var(--pos-gk, var(--text-secondary))",  bg: "var(--pos-gk-soft, var(--bg-secondary))" },
  DEF: { color: "var(--pos-def, var(--primary))",        bg: "var(--pos-def-soft, var(--primary-soft))" },
  MID: { color: "var(--pos-mid, var(--warning))",        bg: "var(--pos-mid-soft, color-mix(in oklab, var(--warning) 14%, transparent))" },
  FWD: { color: "var(--pos-fwd, var(--danger))",         bg: "var(--pos-fwd-soft, color-mix(in oklab, var(--danger) 14%, transparent))" },
};

/**
 * Small colored pill that labels a player's position.
 *
 * When `pos` is empty the badge renders an invisible placeholder so
 * surrounding rows keep a stable layout (no shift between rows).
 *
 * Wrapped in `React.memo` — re-renders only when `pos`/`className` change.
 */
function PosBadge({ pos, className = "" }) {
  const norm = (pos || "").toString().toUpperCase().slice(0, 3);
  const isKnown = norm in POS_CONFIG;
  const c = isKnown ? POS_CONFIG[norm] : null;

  return (
    <span
      aria-hidden={!isKnown}
      className={`pos-badge${isKnown ? "" : " pos-badge--hidden"} ${className}`.trim()}
      style={c ? { "--pb-color": c.color, "--pb-bg": c.bg } : undefined}
    >
      {isKnown ? norm : "—"}
    </span>
  );
}

export default memo(PosBadge);
export { POS_CONFIG };
