import React, { useContext, useEffect, useState } from "react";
import { PageLoader } from "../../components/common/Loader";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { useLeagueTable } from "./useLeagueTable";
import LeagueTable from "./components/LeagueTable";
import "./League.css";

/**
 * LeaguePage — sortable standings table. Each row expands to show that
 * team's pitch lineup and per-player points for the selected week.
 * Season view removed — data is always scoped to the selected week.
 */
export default function LeaguePage() {
  const { week, year } = useContext(WeekContext);
  const { profile } = useAuthStore();
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Always week view — season toggle removed per product decision.
  const viewMode = "week";

  const { table, loading } = useLeagueTable({ week, year, profile, viewMode });

  // Collapse open detail rows whenever the week changes.
  useEffect(() => {
    setSelectedTeam(null);
  }, [week, year]);

  const hasData = table.some((t) => t.played > 0);
  const toggleTeam = (id) => setSelectedTeam((prev) => (prev === id ? null : id));

  return (
    <div className="lg-page">
      <div className="lg-card">
        <div className="lg-card__title">
          <i className="ti ti-trophy lg-card__icon" />
          League table
          <span className="lg-card__badge">Week {week}</span>
        </div>

        {loading ? (
          <PageLoader label="Loading league" minHeight={180} />
        ) : !hasData ? (
          <div className="lg-empty">
            <i className="ti ti-database-off lg-empty__icon" />
            No team stats entered yet for week {week}.
            <br />
            <span className="lg-empty__hint">
              Go to Admin panel → Team stats to add data.
            </span>
          </div>
        ) : (
          <LeagueTable
            table={table}
            week={week}
            year={year}
            viewMode={viewMode}
            selectedTeam={selectedTeam}
            toggleTeam={toggleTeam}
          />
        )}
      </div>
    </div>
  );
}
