import React from "react";

/**
 * Segmented "Week N | Total/Season" toggle reused on Points / TopGA / TopPlayers.
 * Responsive: on very small screens the labels collapse to compact form
 * via CSS (.mode-btn__full hidden, .mode-btn__short shown).
 */
export default function ModeSwitch({
  mode,
  setMode,
  week,
  totalLabel = "Total",
  totalIcon = "ti-trophy",
}) {
  return (
    <div className="mode-switch" role="tablist" aria-label="Time range">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "week"}
        onClick={() => setMode("week")}
        className={`mode-btn ${mode === "week" ? "on" : ""}`}
      >
        <i className="ti ti-calendar-week" aria-hidden />
        <span className="mode-btn__full">Week {week}</span>
        <span className="mode-btn__short">W{week}</span>
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "total"}
        onClick={() => setMode("total")}
        className={`mode-btn ${mode === "total" ? "on" : ""}`}
      >
        <i className={`ti ${totalIcon}`} aria-hidden />
        <span className="mode-btn__full">{totalLabel}</span>
        <span className="mode-btn__short">{totalLabel.slice(0, 3)}</span>
      </button>
    </div>
  );
}