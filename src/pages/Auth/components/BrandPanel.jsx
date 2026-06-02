import React from "react";

// Left-hand brand pane (hidden on small screens via CSS).
export default function BrandPanel() {
  return (
    <aside className="auth-brand">
      <div className="auth-brand__logo">
        <span className="auth-brand__logo-mark">
          <i className="ti ti-ball-football" />
        </span>
        <div>
          <div className="auth-brand__name">FutbolStats</div>
          <div className="auth-brand__tag">Captain · Squad · Glory</div>
        </div>
      </div>

      <div className="auth-brand__quote">
        <i className="ti ti-quote" />
        <p>“Track every pass, every goal, every legend in the making.”</p>
      </div>

      <ul className="auth-brand__features">
        <li>
          <span><i className="ti ti-chart-radar" /></span>
          Player radars &amp; weekly trends
        </li>
        <li>
          <span><i className="ti ti-trophy" /></span>
          Best Team of the week, on a real pitch
        </li>
        <li>
          <span><i className="ti ti-shield-star" /></span>
          Captain panel: pick squad &amp; rate teammates
        </li>
        <li>
          <span><i className="ti ti-flame" /></span>
          Live leaderboards &amp; awards
        </li>
      </ul>

      <div className="auth-brand__foot">
        <span className="auth-dot" /> Season 2026 — Live
      </div>
    </aside>
  );
}
