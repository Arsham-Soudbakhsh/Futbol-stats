import React from "react";

/**
 * Top bar with menu toggle, week pills (1-8) and a theme switch.
 * Future weeks (>4) get a `future` modifier so they can be styled
 * differently while still being clickable.
 */
const TOTAL_WEEKS = 8;

export default function TopBar({
  week,
  onWeekChange,
  onMenu,
  onToggleTheme,
  isDark,
}) {
  return (
    <div className="top-bar">
      <button className="menu-btn" onClick={onMenu} aria-label="Menu">
        <i className="ti ti-menu-2" style={{ fontSize: 19 }} />
      </button>

      <div className="week-bar">
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => (
          <button
            key={w}
            className={`week-pill${week === w ? " active" : ""}${w > 4 ? " future" : ""}`}
            onClick={() => onWeekChange(w)}
          >
            Week {w}
          </button>
        ))}
      </div>

      <button
        className="topbar-icon-btn"
        onClick={onToggleTheme}
        title={isDark ? "Light mode" : "Dark mode"}
      >
        <i
          className={`ti ${isDark ? "ti-sun" : "ti-moon"}`}
          style={{ fontSize: 17 }}
        />
      </button>
    </div>
  );
}
