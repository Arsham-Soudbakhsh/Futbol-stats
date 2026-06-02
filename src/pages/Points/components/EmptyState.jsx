import React from "react";

export default function EmptyState({ mode, week }) {
  return (
    <div className="no-stats" style={{ padding: "28px 0" }}>
      <i className="ti ti-award no-stats__icon" />
      <div className="no-stats__text">
        No data for {mode === "week" ? `week ${week}` : "this season"} yet.
      </div>
    </div>
  );
}
