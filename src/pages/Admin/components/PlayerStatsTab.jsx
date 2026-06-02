import React, { useState } from "react";
import { PageLoader } from "../../../components/common/Loader";
import { PLAYER_STAT_FIELDS } from "../constants";

/**
 * Tab: per-player goals / assists / clean sheets editor.
 */
export default function PlayerStatsTab({
  players,
  statsForm,
  handleStatChange,
  saving,
  onSave,
}) {
  const [search, setSearch] = useState("");
  const filtered = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="card admin-section">
      <div className="admin-section__header">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-user" /> Player stats
        </div>
        <input
          className="admin-search"
          placeholder="Search player…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {players.length === 0 ? (
        <PageLoader label="Loading players" minHeight={140} />
      ) : (
        <div className="admin-list">
          {filtered.map((p) => {
            const s = statsForm[p.id] || { goals: 0, assists: 0, clean_sheets: 0 };
            return (
              <div key={p.id} className="admin-row">
                <div className="admin-row__head">
                  <div className="admin-row__name">{p.full_name}</div>
                  <div className="admin-row__role">{p.role}</div>
                </div>
                <div className="admin-fields">
                  {PLAYER_STAT_FIELDS.map(({ field, label, icon, max }) => (
                    <div key={field} className="admin-field">
                      <label>
                        <i className={`ti ${icon}`} /> {label}
                      </label>
                      <input
                        className="admin-input"
                        type="number"
                        min="0"
                        max={max}
                        value={s[field] ?? 0}
                        onChange={(e) =>
                          handleStatChange(p.id, field, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="admin-actions">
        <button className="admin-save" onClick={onSave} disabled={saving}>
          <i className="ti ti-device-floppy" />
          {saving ? "Saving…" : "Save player stats"}
        </button>
      </div>
    </div>
  );
}
