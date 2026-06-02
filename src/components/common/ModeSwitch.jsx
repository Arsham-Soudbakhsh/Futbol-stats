import React from "react";

/**
 * Segmented "Week N | Total/Season" toggle reused on Points / TopGA / TopPlayers.
 * `totalLabel` lets callers say "Total" or "Season" as needed.
 */
export default function ModeSwitch({
  mode,
  setMode,
  week,
  totalLabel = "Total",
  totalIcon = "ti-trophy",
}) {
  return (
    <div className="mode-switch">
      <button
        onClick={() => setMode("week")}
        className={`mode-btn ${mode === "week" ? "on" : ""}`}
      >
        <i className="ti ti-calendar-week" />
        <span>Week {week}</span>
      </button>
      <button
        onClick={() => setMode("total")}
        className={`mode-btn ${mode === "total" ? "on" : ""}`}
      >
        <i className={`ti ${totalIcon}`} />
        <span>{totalLabel}</span>
      </button>
    </div>
  );
}
