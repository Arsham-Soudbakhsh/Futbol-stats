import React, { useContext, useState } from "react";
import { PageLoader } from "../../components/common/Loader";
import ModeSwitch from "../../components/common/ModeSwitch";
import PlayerProfileDrawer from "../../components/common/PlayerProfileDrawer";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { usePointsData } from "./usePointsData";
import LeaderboardTable from "./components/LeaderboardTable";
import ScoringLegend from "./components/ScoringLegend";
import EmptyState from "./components/EmptyState";
import "./Points.css";

export default function PointsPage() {
  const { week, year } = useContext(WeekContext);
  const { profile } = useAuthStore();
  const [mode, setMode] = useState("week");
  const [selected, setSelected] = useState(null);

  // Single source: hook returns rows + playersIndex (with avatar_url).
  // No more duplicate getAllPlayers() fetch in the page.
  const { rows, loading, maxPts, playersIndex } = usePointsData({
    week,
    year,
    profile,
    mode,
  });

  const handleSelect = (row) => {
    const full = playersIndex[row.id];
    setSelected(full || { id: row.id, full_name: row.name, position: row.position });
  };

  if (loading) return <PageLoader label="Loading points" minHeight={220} />;

  const isEmpty = !rows.length || rows.every((r) => r.total === 0);

  return (
    <div className="page fade-up points-page">
      <div className="card points-card">
        <div className="pts-header">
          <div className="card-title" style={{ margin: 0 }}>
            <i className="ti ti-award" />
            Points leaderboard
          </div>
          <ModeSwitch mode={mode} setMode={setMode} week={week} />
        </div>

        {isEmpty ? (
          <EmptyState mode={mode} week={week} />
        ) : (
          <LeaderboardTable rows={rows} maxPts={maxPts} onSelect={handleSelect} />
        )}
      </div>

      <ScoringLegend />

      <PlayerProfileDrawer
        player={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
