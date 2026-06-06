import React from "react";

/**
 * Tab: create teams, assign captains, rename teams, open/close weekly access.
 * Everything here is PER-WEEK: teams shown are only this week's teams; the
 * captain→team display reads from the per-week captainTeamMap (NOT the
 * profile.team_id field, which is global and would leak across weeks).
 */
export default function TeamsManagementTab({
  week,
  players,
  teams,
  captains,
  captainTeamMap = {},
  squads,
  captainsPerTeam,
  teamRosters,
  newTeamName,
  setNewTeamName,
  handleCreateTeam,
  assignMap,
  setAssignMap,
  handleAssignCaptain,
  teamNameEdits,
  setTeamNameEdits,
  handleRenameTeam,
  handleDeleteTeam,
  weekOpen,
  toggleWeekAccess,
  saving,
}) {
  return (
    <div className="card admin-section">
      <div className="admin-section__header">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-users-group" /> Team & Captain Management — Week {week}
        </div>
      </div>

      <div
        style={{
          padding: "8px 12px",
          margin: "0 0 12px",
          background: "rgba(214,162,61,.08)",
          border: "1px solid rgba(214,162,61,.25)",
          borderRadius: 8,
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        <i className="ti ti-info-circle" /> Teams and captain assignments are scoped to{" "}
        <b>Week {week}</b>. When you switch weeks, you need to create teams and assign captains again for that week.
      </div>

      {/* ── Week access toggle ── */}
      <WeekAccessToggle
        week={week}
        weekOpen={weekOpen}
        toggleWeekAccess={toggleWeekAccess}
        saving={saving}
      />

      <CreateTeam
        week={week}
        newTeamName={newTeamName}
        setNewTeamName={setNewTeamName}
        handleCreateTeam={handleCreateTeam}
        saving={saving}
      />

      <AssignCaptains
        week={week}
        teams={teams}
        players={players}
        captains={captains}
        captainTeamMap={captainTeamMap}
        squads={squads}
        assignMap={assignMap}
        setAssignMap={setAssignMap}
        handleAssignCaptain={handleAssignCaptain}
        saving={saving}
      />

      <TeamsStatus
        week={week}
        teams={teams}
        captains={captains}
        captainTeamMap={captainTeamMap}
        teamRosters={teamRosters}
        captainsPerTeam={captainsPerTeam}
        teamNameEdits={teamNameEdits}
        setTeamNameEdits={setTeamNameEdits}
        handleRenameTeam={handleRenameTeam}
        handleDeleteTeam={handleDeleteTeam}
        saving={saving}
      />
    </div>
  );
}

// ── Week access toggle block ─────────────────────────────────────────────────
function WeekAccessToggle({ week, weekOpen, toggleWeekAccess, saving }) {
  return (
    <div className="mgmt-block">
      <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
        <i className="ti ti-calendar-week" /> Captain Access — Week {week}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        {/* Status pill */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "6px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
            background: weekOpen
              ? "rgba(74,197,133,.15)"
              : "rgba(180,180,180,.12)",
            color: weekOpen ? "var(--success)" : "var(--text-muted)",
            border: weekOpen
              ? "1px solid rgba(74,197,133,.3)"
              : "1px solid rgba(180,180,180,.2)",
          }}
        >
          <i className={`ti ${weekOpen ? "ti-lock-open" : "ti-lock"}`} />
          {weekOpen ? `Week ${week} is open` : `Week ${week} is closed`}
        </div>

        {/* Toggle button */}
        <button
          className={`admin-save${weekOpen ? " admin-save--danger" : ""}`}
          onClick={toggleWeekAccess}
          disabled={saving}
          style={{
            background: weekOpen ? "var(--danger)" : "var(--primary)",
            minWidth: 140,
          }}
        >
          <i className={`ti ${weekOpen ? "ti-lock" : "ti-lock-open"}`} />
          {weekOpen ? "Close week" : "Open week"}
        </button>
      </div>
      <div
        style={{
          marginTop: 8,
          fontSize: 12,
          color: "var(--text-muted)",
          lineHeight: 1.6,
        }}
      >
        {weekOpen
          ? "Captains can now submit their squads. Close the week once all squads are in."
          : "Week is closed. Open it so captains can submit their squads."}
      </div>
    </div>
  );
}

// ── Create team ──────────────────────────────────────────────────────────────
function CreateTeam({ week, newTeamName, setNewTeamName, handleCreateTeam, saving }) {
  return (
    <div className="mgmt-block">
      <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
        <i className="ti ti-plus" /> Create New Team — Week {week}
      </div>
      <div className="mgmt-create">
        <input
          className="admin-input mgmt-create__input"
          type="text"
          placeholder={`Team name for week ${week}...`}
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
        />
        <button
          className="admin-save"
          onClick={handleCreateTeam}
          disabled={saving}
        >
          <i className="ti ti-plus" /> Create team
        </button>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted)" }}>
        This team will only exist for week {week}. Create a new team each week.
      </div>
    </div>
  );
}

// ── Assign captains ──────────────────────────────────────────────────────────
function AssignCaptains({
  week,
  teams,
  players,
  captains,
  captainTeamMap,
  squads,
  assignMap,
  setAssignMap,
  handleAssignCaptain,
  saving,
}) {
  return (
    <div className="mgmt-block">
      <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
        <i className="ti ti-crown" /> Assign Captain to Team — Week {week}
      </div>
      {captains.length === 0 ? (
        <div className="admin-empty">No captains have registered yet.</div>
      ) : teams.length === 0 ? (
        <div className="admin-empty">
          No teams created for this week yet. Create a team above first.
        </div>
      ) : (
        <div className="admin-list">
          {captains.map((cap) => {
            const capSquad = squads.find(
              (sq) => (sq.player_ids || [])[0] === cap.id
            );
            const squadMembers = capSquad
              ? (capSquad.player_ids || [])
                  .slice(1)
                  .map((id) => players.find((p) => p.id === id))
                  .filter(Boolean)
              : [];
            return (
              <CaptainAssignRow
                key={cap.id}
                cap={cap}
                week={week}
                teams={teams}
                currentTeamId={captainTeamMap[cap.id] || ""}
                squadMembers={squadMembers}
                assignMap={assignMap}
                setAssignMap={setAssignMap}
                handleAssignCaptain={handleAssignCaptain}
                saving={saving}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function CaptainAssignRow({
  cap,
  week,
  teams,
  currentTeamId,
  squadMembers,
  assignMap,
  setAssignMap,
  handleAssignCaptain,
  saving,
}) {
  const teamObj = teams.find((t) => t.id === currentTeamId);
  const teamName = teamObj?.name || "";
  const nameConfirmed = teamObj?.name_confirmed;

  return (
    <div className="admin-row">
      <div className="admin-row__head">
        <div className="admin-row__name">
          <i
            className="ti ti-crown"
            style={{ color: "var(--warning)", fontSize: 13 }}
          />{" "}
          {cap.full_name}
        </div>
        <div
          className="admin-row__role"
          style={{
            color: currentTeamId ? "var(--success)" : "var(--text-muted)",
          }}
        >
          {currentTeamId
            ? `✅ ${teamName}${nameConfirmed ? " (confirmed)" : " (awaiting captain confirmation)"}`
            : `No team in week ${week}`}
        </div>
      </div>

      {squadMembers.length > 0 ? (
        <div className="admin-chips">
          <span className="chip-label">
            <i className="ti ti-users" /> Squad week {week}:
          </span>
          {squadMembers.map((p) => (
            <span key={p.id} className="chip-player">
              {p.full_name}
            </span>
          ))}
        </div>
      ) : (
        <div className="chip-empty chip-empty--block">
          <i className="ti ti-clock" /> Squad not submitted yet (week {week})
        </div>
      )}

      <div className="admin-fields admin-fields--inline">
        <div className="admin-field" style={{ flex: 1 }}>
          <label>
            <i className="ti ti-shield" /> Select team (week {week})
          </label>
          <select
            className="admin-input admin-select"
            value={assignMap[cap.id] ?? currentTeamId ?? ""}
            onChange={(e) =>
              setAssignMap((prev) => ({ ...prev, [cap.id]: e.target.value }))
            }
          >
            <option value="">— No team —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-field" style={{ flexShrink: 0 }}>
          <button
            className="admin-save admin-save--compact"
            onClick={() => handleAssignCaptain(cap.id)}
            disabled={saving}
          >
            <i className="ti ti-check" /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Teams status ─────────────────────────────────────────────────────────────
function TeamsStatus({
  week,
  teams,
  captains,
  captainTeamMap = {},
  teamRosters,
  captainsPerTeam,
  teamNameEdits,
  setTeamNameEdits,
  handleRenameTeam,
  handleDeleteTeam,
  saving,
}) {
  return (
    <div>
      <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
        <i className="ti ti-chart-bar" /> Teams Status — Week {week}
      </div>
      {teams.length === 0 ? (
        <div className="admin-empty">
          No teams created for week {week} yet.
        </div>
      ) : (
        <div className="admin-list">
          {teams.map((t) => {
            const count = captainsPerTeam[t.id] || 0;
            const ready = count >= 1;
            const teamCaptainIds = Object.keys(captainTeamMap).filter(
              (cid) => captainTeamMap[cid] === t.id
            );
            const teamCaptains = captains.filter((c) =>
              teamCaptainIds.includes(c.id)
            );
            const roster = teamRosters[t.id] || { squadMembers: [] };
            return (
              <div key={t.id} className="admin-row">
                <div className="admin-row__head">
                  <div className="admin-row__name">
                    <span className="dot" /> {t.name}
                    {t.name_confirmed && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: "var(--success)",
                          fontWeight: 500,
                        }}
                      >
                        ✓ Confirmed
                      </span>
                    )}
                  </div>
                  <div
                    className="admin-row__role"
                    style={{
                      color: ready ? "var(--success)" : "var(--text-muted)",
                    }}
                  >
                    {ready
                      ? `✅ Captain: ${teamCaptains.map((c) => c.full_name).join(", ")}`
                      : "No captain assigned"}
                  </div>
                </div>

                {roster.squadMembers.length > 0 && (
                  <div className="admin-chips">
                    <span className="chip-label">
                      <i className="ti ti-users" /> Players week {week}:
                    </span>
                    {roster.squadMembers.map((p) => (
                      <span key={p.id} className="chip-player">
                        {p.full_name}
                      </span>
                    ))}
                  </div>
                )}

                <div className="admin-fields admin-fields--inline">
                  <div className="admin-field" style={{ flex: 1 }}>
                    <label>
                      <i className="ti ti-pencil" /> Rename team (admin override)
                    </label>
                    <input
                      className="admin-input"
                      type="text"
                      placeholder={t.name}
                      value={teamNameEdits[t.id] ?? ""}
                      onChange={(e) =>
                        setTeamNameEdits((prev) => ({
                          ...prev,
                          [t.id]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleRenameTeam(t.id)
                      }
                    />
                  </div>
                  <div className="admin-field" style={{ flexShrink: 0 }}>
                    <button
                      className="admin-save admin-save--compact"
                      onClick={() => handleRenameTeam(t.id)}
                      disabled={saving || !teamNameEdits[t.id]?.trim()}
                    >
                      <i className="ti ti-device-floppy" /> Save name
                    </button>
                  </div>
                  {handleDeleteTeam && (
                    <div className="admin-field" style={{ flexShrink: 0 }}>
                      <button
                        className="admin-save admin-save--compact admin-save--danger"
                        onClick={() => handleDeleteTeam(t.id)}
                        disabled={saving}
                        style={{ background: "var(--danger)" }}
                      >
                        <i className="ti ti-trash" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
