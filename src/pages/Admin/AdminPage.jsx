import React, { useContext, useState } from "react";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { useAdminData } from "./useAdminData";
import AdminHeader from "./components/AdminHeader";
import PlayerStatsTab from "./components/PlayerStatsTab";
import TeamStatsTab from "./components/TeamStatsTab";
import AwardsTab from "./components/AwardsTab";
import InvitesTab from "./components/InvitesTab";
import TeamsManagementTab from "./components/TeamsManagementTab";
import "./Admin.css";

/**
 * AdminPage — five-tab control panel for admins.
 * All data + write handlers come from useAdminData; this component
 * just routes the active tab to a render-only sub-component.
 */
export default function AdminPage() {
  const { profile } = useAuthStore();
  const { week, year } = useContext(WeekContext);
  const [tab, setTab] = useState("player-stats");

  const data = useAdminData({ week, year });
  const { msg, setMsg, saving } = data;

  if (profile?.role !== "admin") {
    return (
      <div className="card" style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Access denied. Admin only.
        </div>
      </div>
    );
  }

  const switchTab = (id) => {
    setTab(id);
    setMsg("");
  };

  return (
    <div className="page fade-up admin-page">
      <AdminHeader
        week={week}
        year={year}
        tab={tab}
        onTabChange={switchTab}
      />

      {msg && (
        <div className={`admin-msg ${msg.startsWith("✅") ? "ok" : "err"}`}>
          {msg}
        </div>
      )}

      {tab === "player-stats" && (
        <PlayerStatsTab
          players={data.players}
          statsForm={data.statsForm}
          handleStatChange={data.handleStatChange}
          saving={saving}
          onSave={data.savePlayerStats}
        />
      )}

      {tab === "team-stats" && (
        <TeamStatsTab
          week={week}
          teams={data.teams}
          teamsReady={data.teamsReady}
          teamForm={data.teamForm}
          teamRosters={data.teamRosters}
          handleTeamChange={data.handleTeamChange}
          saving={saving}
          onSave={data.saveTeamStats}
        />
      )}

      {tab === "awards" && (
        <AwardsTab
          week={week}
          players={data.players}
          existingAwards={data.existingAwards}
          awardForm={data.awardForm}
          setAwardForm={data.setAwardForm}
          teamOfWeekForm={data.teamOfWeekForm}
          setTeamOfWeekForm={data.setTeamOfWeekForm}
          saving={saving}
          onSave={data.saveAwards}
        />
      )}

      {tab === "invites" && (
        <InvitesTab
          inviteCodes={data.inviteCodes}
          onCreatePlayer={data.createPlayerInvite}
          onCreateCaptain={data.createCaptainInvite}
          onRemove={data.removeInvite}
        />
      )}

      {tab === "teams-mgmt" && (
        <TeamsManagementTab
          week={week}
          players={data.players}
          teams={data.teams}
          captains={data.captains}
          captainTeamMap={data.captainTeamMap}
          squads={data.squads}
          captainsPerTeam={data.captainsPerTeam}
          teamRosters={data.teamRosters}
          newTeamName={data.newTeamName}
          setNewTeamName={data.setNewTeamName}
          handleCreateTeam={data.handleCreateTeam}
          assignMap={data.assignMap}
          setAssignMap={data.setAssignMap}
          handleAssignCaptain={data.handleAssignCaptain}
          teamNameEdits={data.teamNameEdits}
          setTeamNameEdits={data.setTeamNameEdits}
          handleRenameTeam={data.handleRenameTeam}
          handleDeleteTeam={data.handleDeleteTeam}
          weekOpen={data.weekOpen}
          toggleWeekAccess={data.toggleWeekAccess}
          saving={saving}
        />
      )}
    </div>
  );
}
