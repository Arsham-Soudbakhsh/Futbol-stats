import React from "react";
import { useTeamDetail } from "../useTeamDetail";
import PitchView from "./PitchView";
import PointsBox from "./PointsBox";

/**
 * Expandable row content: shows the team's pitch lineup on the left and
 * a player-points box on the right. Data is owned by useTeamDetail.
 */
export default function TeamDetail({ teamId, teamName, week, year, viewMode }) {
  const { loading, players, perPlayer, lineup } = useTeamDetail({
    teamId,
    week,
    year,
    viewMode,
  });

  return (
    <div className="lt-grid" style={{ padding: "10px 4px 16px" }}>
      <PitchView
        teamName={teamName}
        loading={loading}
        players={players}
        lineup={lineup}
      />
      <PointsBox
        viewMode={viewMode}
        week={week}
        year={year}
        loading={loading}
        perPlayer={perPlayer}
      />
    </div>
  );
}
