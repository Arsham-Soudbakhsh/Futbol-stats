import React, { useContext, useState } from "react";
import { PageLoader } from "../../components/common/Loader";
import ModeSwitch from "../../components/common/ModeSwitch";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { usePointsData } from "./usePointsData";
import LeaderboardTable from "./components/LeaderboardTable";
import ScoringLegend from "./components/ScoringLegend";
import EmptyState from "./components/EmptyState";
import "./Points.css";

/**
 * PointsPage — leaderboard for either the current week or the entire season,
 * plus a static scoring-system legend underneath.
 */
export default function PointsPage() {
  const { week, year } = useContext(WeekContext);
  const { profile } = useAuthStore();
  const [mode, setMode] = useState("week");

  const { rows, loading, maxPts } = usePointsData({ week, year, profile, mode });

  if (loading) return <PageLoader label="Loading points" minHeight={220} />;

  const isEmpty = !rows.length || rows.every((r) => r.total === 0);

  return (
    <div className="page fade-up points-page">
      <div className="card">
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
          <LeaderboardTable rows={rows} maxPts={maxPts} />
        )}
      </div>

      <ScoringLegend />
    </div>
  );
}
