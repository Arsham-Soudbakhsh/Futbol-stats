import React from "react";

/**
 * Tab: create teams, assign captains, rename teams.
 * The page-level hook owns all of this state; we just render it.
 */
export default function TeamsManagementTab({
  week,
  players,
  teams,
  captains,
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
  saving,
}) {
  return (
    <div className="card admin-section">
      <div className="admin-section__header">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-users-group" /> مدیریت تیم‌ها و کاپیتان‌ها
        </div>
      </div>

      <CreateTeam
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
        teamRosters={teamRosters}
        captainsPerTeam={captainsPerTeam}
        teamNameEdits={teamNameEdits}
        setTeamNameEdits={setTeamNameEdits}
        handleRenameTeam={handleRenameTeam}
        saving={saving}
      />
    </div>
  );
}

function CreateTeam({ newTeamName, setNewTeamName, handleCreateTeam, saving }) {
  return (
    <div className="mgmt-block">
      <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
        <i className="ti ti-plus" /> ساخت تیم جدید
      </div>
      <div className="mgmt-create">
        <input
          className="admin-input mgmt-create__input"
          type="text"
          placeholder="نام تیم..."
          value={newTeamName}
          onChange={(e) => setNewTeamName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
        />
        <button
          className="admin-save"
          onClick={handleCreateTeam}
          disabled={saving}
        >
          <i className="ti ti-plus" /> ساخت تیم
        </button>
      </div>
    </div>
  );
}

function AssignCaptains({
  week,
  teams,
  players,
  captains,
  squads,
  assignMap,
  setAssignMap,
  handleAssignCaptain,
  saving,
}) {
  return (
    <div className="mgmt-block">
      <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
        <i className="ti ti-crown" /> assign کاپیتان به تیم
      </div>
      {captains.length === 0 ? (
        <div className="admin-empty">هیچ کاپیتانی ثبت‌نام نکرده.</div>
      ) : (
        <div className="admin-list">
          {captains.map((cap) => {
            const capSquad = squads.find(
              (sq) => (sq.player_ids || [])[0] === cap.id,
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
  squadMembers,
  assignMap,
  setAssignMap,
  handleAssignCaptain,
  saving,
}) {
  const teamName = teams.find((t) => t.id === cap.team_id)?.name || cap.team_id;
  return (
    <div className="admin-row">
      <div className="admin-row__head">
        <div className="admin-row__name">
          <i className="ti ti-crown" style={{ color: "var(--warning)", fontSize: 13 }} />{" "}
          {cap.full_name}
        </div>
        <div
          className="admin-row__role"
          style={{ color: cap.team_id ? "var(--success)" : "var(--text-muted)" }}
        >
          {cap.team_id ? `✅ ${teamName}` : "بدون تیم"}
        </div>
      </div>

      {squadMembers.length > 0 ? (
        <div className="admin-chips">
          <span className="chip-label">
            <i className="ti ti-users" /> Squad هفته {week}:
          </span>
          {squadMembers.map((p) => (
            <span key={p.id} className="chip-player">{p.full_name}</span>
          ))}
        </div>
      ) : (
        <div className="chip-empty chip-empty--block">
          <i className="ti ti-clock" /> هنوز squad ثبت نکرده (هفته {week})
        </div>
      )}

      <div className="admin-fields admin-fields--inline">
        <div className="admin-field" style={{ flex: 1 }}>
          <label>
            <i className="ti ti-shield" /> انتخاب تیم
          </label>
          <select
            className="admin-input admin-select"
            value={assignMap[cap.id] ?? cap.team_id ?? ""}
            onChange={(e) =>
              setAssignMap((prev) => ({ ...prev, [cap.id]: e.target.value }))
            }
          >
            <option value="">— بدون تیم —</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="admin-field" style={{ flexShrink: 0 }}>
          <button
            className="admin-save admin-save--compact"
            onClick={() => handleAssignCaptain(cap.id)}
            disabled={saving}
          >
            <i className="ti ti-check" /> ذخیره
          </button>
        </div>
      </div>
    </div>
  );
}

function TeamsStatus({
  week,
  teams,
  captains,
  teamRosters,
  captainsPerTeam,
  teamNameEdits,
  setTeamNameEdits,
  handleRenameTeam,
  saving,
}) {
  return (
    <div>
      <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
        <i className="ti ti-chart-bar" /> وضعیت تیم‌ها
      </div>
      {teams.length === 0 ? (
        <div className="admin-empty">هیچ تیمی وجود ندارد.</div>
      ) : (
        <div className="admin-list">
          {teams.map((t) => {
            const count = captainsPerTeam[t.id] || 0;
            const ready = count >= 1;
            const teamCaptains = captains.filter((c) => c.team_id === t.id);
            const roster = teamRosters[t.id] || { squadMembers: [] };
            return (
              <div key={t.id} className="admin-row">
                <div className="admin-row__head">
                  <div className="admin-row__name">
                    <span className="dot" /> {t.name}
                  </div>
                  <div
                    className="admin-row__role"
                    style={{
                      color: ready ? "var(--success)" : "var(--text-muted)",
                    }}
                  >
                    {ready
                      ? `✅ کاپیتان: ${teamCaptains.map((c) => c.full_name).join("، ")}`
                      : "بدون کاپیتان"}
                  </div>
                </div>

                {roster.squadMembers.length > 0 && (
                  <div className="admin-chips">
                    <span className="chip-label">
                      <i className="ti ti-users" /> بازیکنان هفته {week}:
                    </span>
                    {roster.squadMembers.map((p) => (
                      <span key={p.id} className="chip-player">{p.full_name}</span>
                    ))}
                  </div>
                )}

                <div className="admin-fields admin-fields--inline">
                  <div className="admin-field" style={{ flex: 1 }}>
                    <label>
                      <i className="ti ti-pencil" /> تغییر نام تیم
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
                      <i className="ti ti-device-floppy" /> ذخیره نام
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
