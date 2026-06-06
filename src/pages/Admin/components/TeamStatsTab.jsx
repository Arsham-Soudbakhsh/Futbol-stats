import React from "react";
import { PageLoader } from "../../../components/common/Loader";
import { TEAM_STAT_FIELDS } from "../constants";

/**
 * Tab: per-team P / W / D / L / GF / GA editor with roster preview.
 * Only "ready" teams (i.e. a captain has been assigned) show fields.
 */
export default function TeamStatsTab({
  week,
  teams,
  teamsReady,
  teamForm,
  teamRosters,
  handleTeamChange,
  saving,
  onSave,
}) {
  return (
    <div className="card admin-section">
      <div className="admin-section__header">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-shield" /> Team stats
        </div>
      </div>
      <p className="admin-hint">Enter cumulative stats for week {week}.</p>

      {teams.length === 0 ? (
        <PageLoader label="Loading teams" minHeight={140} />
      ) : (
        <div className="admin-list">
          {teamsReady.length === 0 && (
            <div className="admin-empty">
              No teams have a captain yet. First assign a captain from the "Team Management" tab.
            </div>
          )}

          {teamsReady.map((t) => {
            const s =
              teamForm[t.id] || {
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
              };
            const roster = teamRosters[t.id] || { captain: null, squadMembers: [] };
            return (
              <TeamStatsRow
                key={t.id}
                team={t}
                stats={s}
                roster={roster}
                week={week}
                handleTeamChange={handleTeamChange}
              />
            );
          })}
        </div>
      )}

      <div className="admin-actions">
        <button className="admin-save" onClick={onSave} disabled={saving}>
          <i className="ti ti-device-floppy" />
          {saving ? "Saving…" : "Save team stats"}
        </button>
      </div>
    </div>
  );
}

function TeamStatsRow({ team: t, stats: s, roster, week, handleTeamChange }) {
  return (
    <div className="admin-row">
      <div className="admin-row__head">
        <div className="admin-row__name">
          <span className="dot" /> {t.name}
        </div>
        <div className="admin-row__role">
          {roster.captain ? (
            <>
              <i className="ti ti-crown" style={{ color: "var(--warning)" }} />{" "}
              {roster.captain.full_name}
            </>
          ) : (
            "No captain"
          )}
        </div>
      </div>

      {(roster.captain || roster.squadMembers.length > 0) && (
        <div className="admin-chips">
          {roster.captain && (
            <span className="chip-captain">
              <i className="ti ti-crown" /> {roster.captain.full_name}
            </span>
          )}
          {roster.squadMembers.map((p) => (
            <span key={p.id} className="chip-player">{p.full_name}</span>
          ))}
          {!roster.squadMembers.length && (
            <span className="chip-empty">
              <i className="ti ti-clock" /> Squad not submitted yet for week {week}
            </span>
          )}
        </div>
      )}

      <div className="admin-fields admin-fields--6">
        {TEAM_STAT_FIELDS.map(({ field, label, icon }) => (
          <div key={field} className="admin-field">
            <label>
              <i className={`ti ${icon}`} /> {label}
            </label>
            <input
              className="admin-input"
              type="number"
              min="0"
              value={s[field] ?? 0}
              onChange={(e) => handleTeamChange(t.id, field, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
