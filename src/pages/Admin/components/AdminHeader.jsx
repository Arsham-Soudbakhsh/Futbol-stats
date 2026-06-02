import React from "react";
import { ADMIN_TABS } from "../constants";

// Top card with title, current-week pill and the tab bar.
export default function AdminHeader({ week, year, tab, onTabChange }) {
  return (
    <div className="card admin-header">
      <div className="admin-header__top">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-settings" />
          Admin panel
        </div>
        <span className="admin-week-pill">
          <i className="ti ti-calendar-week" /> Week {week} · {year}
        </span>
      </div>
      <div className="admin-tabs">
        {ADMIN_TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? "on" : ""}`}
            onClick={() => onTabChange(t.id)}
          >
            <i className={`ti ${t.icon}`} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
