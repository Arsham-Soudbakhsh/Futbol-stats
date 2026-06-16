import React, { useEffect, useRef } from "react";

/**
 * Top bar with menu toggle, week pills (1-8) and a theme switch.
 * - Active pill scrolls into view on mobile so the user always sees their selection.
 * - Future weeks (>4) are visually dimmer but remain clickable so users can preview.
 */
const TOTAL_WEEKS = 8;

export default function TopBar({
  week,
  onWeekChange,
  onMenu,
  onToggleTheme,
  isDark,
}) {
  const barRef = useRef(null);

  // Keep the active week visible whenever it changes (mobile horizontal scroll).
  useEffect(() => {
    const el = barRef.current?.querySelector(".week-pill.active");
    if (el && typeof el.scrollIntoView === "function") {
      el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [week]);

  return (
    <div className="top-bar">
      <button
        className="menu-btn"
        onClick={onMenu}
        aria-label="Open menu"
        type="button"
      >
        <i className="ti ti-menu-2" style={{ fontSize: 19 }} aria-hidden="true" />
      </button>

      <nav className="week-bar" ref={barRef} aria-label="Select week">
        {Array.from({ length: TOTAL_WEEKS }, (_, i) => i + 1).map((w) => {
          const isActive = week === w;
          const isFuture = w > 4;
          return (
            <button
              key={w}
              type="button"
              className={`week-pill${isActive ? " active" : ""}${isFuture ? " future" : ""}`}
              onClick={() => onWeekChange(w)}
              aria-pressed={isActive}
              aria-label={`Week ${w}${isFuture ? " (upcoming)" : ""}`}
            >
              Week {w}
            </button>
          );
        })}
      </nav>

      <button
        type="button"
        className="topbar-icon-btn"
        onClick={onToggleTheme}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <i
          className={`ti ${isDark ? "ti-sun" : "ti-moon"}`}
          style={{ fontSize: 17 }}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}
