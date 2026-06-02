import React from "react";
import { AWARD_LABELS } from "../../../utils/points";
import { AWARD_TYPES } from "../constants";

/**
 * Tab: per-award player selector plus the multi-player "Best team of the week".
 */
export default function AwardsTab({
  week,
  players,
  existingAwards,
  awardForm,
  setAwardForm,
  teamOfWeekForm,
  setTeamOfWeekForm,
  saving,
  onSave,
}) {
  return (
    <div className="card admin-section">
      <div className="admin-section__header">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-trophy" /> Awards — week {week}
        </div>
      </div>

      {existingAwards.length > 0 && (
        <ExistingAwardsSummary
          existingAwards={existingAwards}
          players={players}
        />
      )}

      <div className="admin-subsection-title">Individual awards</div>
      <div className="awards-grid">
        {AWARD_TYPES.filter(([type]) => type !== "best_team_week").map(
          ([type, label]) => (
            <div key={type} className="award-field">
              <label>{label}</label>
              <select
                className="admin-input admin-select"
                value={awardForm[type] || ""}
                onChange={(e) =>
                  setAwardForm((prev) => ({ ...prev, [type]: e.target.value }))
                }
              >
                <option value="">— No selection —</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}</option>
                ))}
              </select>
            </div>
          ),
        )}
      </div>

      <TeamOfWeekPicker
        players={players}
        teamOfWeekForm={teamOfWeekForm}
        setTeamOfWeekForm={setTeamOfWeekForm}
      />

      <div className="admin-actions">
        <button className="admin-save" onClick={onSave} disabled={saving}>
          <i className="ti ti-trophy" />
          {saving ? "Saving…" : "Save awards"}
        </button>
      </div>
    </div>
  );
}

function ExistingAwardsSummary({ existingAwards, players }) {
  return (
    <div className="awards-summary">
      <div className="awards-summary__head">
        <i className="ti ti-eye" />
        Saved awards this week
      </div>
      <div className="awards-summary__list">
        {existingAwards.map((a) => {
          const label = AWARD_LABELS[a.award_type] || a.award_type;

          if (a.award_type === "best_team_week" && a.player_ids?.length) {
            const names = a.player_ids
              .map((id) => players.find((p) => p.id === id)?.full_name || id)
              .filter(Boolean);
            return (
              <div key={a.id} className="awards-summary__row">
                <span className="awards-summary__type">{label}</span>
                <div className="awards-summary__players">
                  {names.map((name, i) => (
                    <span key={i} className="awards-summary__gold">
                      <i className="ti ti-shield-star" />
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            );
          }

          const playerName = players.find((p) => p.id === a.player_id)?.full_name;
          if (!playerName) return null;
          return (
            <div key={a.id} className="awards-summary__row">
              <span className="awards-summary__type">{label}</span>
              <span className="awards-summary__player">
                <i className="ti ti-user" /> {playerName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TeamOfWeekPicker({ players, teamOfWeekForm, setTeamOfWeekForm }) {
  return (
    <div className="best-team-box">
      <div className="best-team-box__title">
        <i className="ti ti-shield-star" />
        Best Team of the Week — pick 5 players
      </div>
      <div className="best-team-box__grid">
        {teamOfWeekForm.map((pid, i) => (
          <div key={i} className="award-field">
            <label className="best-team-box__label">
              <i className="ti ti-shield" /> Player {i + 1}
            </label>
            <select
              className="admin-input admin-select"
              value={pid}
              onChange={(e) => {
                const updated = [...teamOfWeekForm];
                updated[i] = e.target.value;
                setTeamOfWeekForm(updated);
              }}
            >
              <option value="">— No selection —</option>
              {players.map((p) => (
                <option
                  key={p.id}
                  value={p.id}
                  disabled={
                    teamOfWeekForm.includes(p.id) && teamOfWeekForm[i] !== p.id
                  }
                >
                  {p.full_name}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="best-team-box__count">
        {teamOfWeekForm.filter(Boolean).length}/5 players selected
      </div>
    </div>
  );
}
