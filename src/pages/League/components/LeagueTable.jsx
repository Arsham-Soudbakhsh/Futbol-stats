import React from "react";
import TeamDetail from "./TeamDetail";

// Standings table. Clicking a row expands an inline detail panel.
export default function LeagueTable({
  table,
  week,
  year,
  viewMode,
  selectedTeam,
  toggleTeam,
}) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="lg-table">
        <thead>
          <tr>
            {["#", "Team", "P", "W", "D", "L", "GF", "GA", "GD", "Pts"].map((h) => (
              <th
                key={h}
                style={{ textAlign: h === "Team" ? "left" : "center" }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.map((t, i) => (
            <LeagueRow
              key={t.id}
              team={t}
              index={i}
              isOpen={selectedTeam === t.id}
              onToggle={() => toggleTeam(t.id)}
              week={week}
              year={year}
              viewMode={viewMode}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeagueRow({ team: t, index: i, isOpen, onToggle, week, year, viewMode }) {
  const gdClass =
    t.gd > 0 ? "lg-gd lg-gd--pos" : t.gd < 0 ? "lg-gd lg-gd--neg" : "lg-gd";
  return (
    <React.Fragment>
      <tr
        className={`clickable${t.me ? " me-row" : ""}${isOpen ? " open" : ""}`}
        onClick={onToggle}
      >
        <td style={{ textAlign: "center" }}>
          <div
            className="pos-badge"
            style={{
              background:
                i === 0
                  ? "var(--bg-secondary)"
                  : i === 1
                  ? "var(--surface-secondary)"
                  : "transparent",
              color: i === 0 ? "var(--warning)" : "var(--text-muted)",
              margin: "0 auto",
            }}
          >
            {i + 1}
          </div>
        </td>
        <td className="lg-team-cell">
          {t.name}
          {t.me && <span className="lg-you">YOU</span>}
          <i className={`ti ti-chevron-right caret ${isOpen ? "open" : ""}`} />
        </td>
        <td className="c">{t.played}</td>
        <td className="c">{t.wins}</td>
        <td className="c">{t.draws}</td>
        <td className="c">{t.losses}</td>
        <td className="c">{t.gf}</td>
        <td className="c">{t.ga}</td>
        <td className={`c ${gdClass}`}>
          {t.gd > 0 ? `+${t.gd}` : t.gd}
        </td>
        <td className="c lg-pts">{t.pts}</td>
      </tr>
      {isOpen && (
        <tr className="lg-detail-row">
          <td colSpan={10}>
            <TeamDetail
              teamId={t.id}
              teamName={t.name}
              week={week}
              year={year}
              viewMode={viewMode}
            />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
}
