import React from "react";
import { AWARD_LABELS, MULTI_WINNER_AWARDS } from "../../../utils/points";
import { AWARD_TYPES } from "../constants";

/**
 * Tab: per-award player selector plus the multi-player "Best team of the week".
 *
 * BUG FIX: top_scorer_week / top_assister_week / best_ga_week / most_cleansheets
 * can now have multiple winners selected via a multi-select list.
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
          ([type, label]) =>
            MULTI_WINNER_AWARDS.has(type) ? (
              <MultiWinnerField
                key={type}
                type={type}
                label={label}
                players={players}
                awardForm={awardForm}
                setAwardForm={setAwardForm}
              />
            ) : (
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

/**
 * Multi-winner award field: shows a list of checkboxes so multiple players
 * can win the same award (e.g. both scored 2 goals = both get top scorer).
 */
function MultiWinnerField({ type, label, players, awardForm, setAwardForm }) {
  const selected = Array.isArray(awardForm[type]) ? awardForm[type] : [];

  const toggle = (pid) => {
    setAwardForm((prev) => {
      const cur = Array.isArray(prev[type]) ? prev[type] : [];
      const next = cur.includes(pid)
        ? cur.filter((id) => id !== pid)
        : [...cur, pid];
      return { ...prev, [type]: next };
    });
  };

  return (
    <div className="award-field award-field--multi">
      <label>
        {label}
        <span
          style={{
            marginLeft: 6,
            fontSize: 11,
            color: "var(--text-muted)",
            fontWeight: 400,
          }}
        >
          (می‌توانید چند نفر انتخاب کنید)
        </span>
      </label>
      <div
        className="admin-multi-list"
        style={{
          maxHeight: 180,
          overflowY: "auto",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "4px 0",
          background: "var(--bg-secondary)",
        }}
      >
        {players.map((p) => {
          const checked = selected.includes(p.id);
          return (
            <label
              key={p.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                cursor: "pointer",
                background: checked ? "var(--primary-soft)" : "transparent",
                transition: "background 0.15s",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(p.id)}
                style={{ accentColor: "var(--primary)", width: 14, height: 14 }}
              />
              <span style={{ fontSize: 13, color: "var(--text)" }}>
                {p.full_name}
              </span>
              {checked && (
                <i
                  className="ti ti-check"
                  style={{
                    marginLeft: "auto",
                    color: "var(--primary)",
                    fontSize: 13,
                  }}
                />
              )}
            </label>
          );
        })}
      </div>
      {selected.length > 0 && (
        <div style={{ fontSize: 12, color: "var(--primary)", marginTop: 4 }}>
          {selected.length} نفر انتخاب شده
        </div>
      )}
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

          // BUG FIX: multi-winner awards also use player_ids array
          if (a.player_ids?.length) {
            const names = a.player_ids
              .map((id) => players.find((p) => p.id === id)?.full_name || id)
              .filter(Boolean);
            return (
              <div key={a.id} className="awards-summary__row">
                <span className="awards-summary__type">{label}</span>
                <div className="awards-summary__players">
                  {names.map((name, i) => (
                    <span key={i} className="awards-summary__gold">
                      <i className={`ti ${a.award_type === "best_team_week" ? "ti-shield-star" : "ti-user"}`} />
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
