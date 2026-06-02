import React from "react";
import { PageLoader } from "../../../components/common/Loader";

// Right-hand box that lists each player's tally + total points.
export default function PointsBox({ viewMode, week, year, loading, perPlayer }) {
  return (
    <div className="lg-card" style={{ padding: 12 }}>
      <div className="lg-card__title">
        <i className="ti ti-trophy lg-card__icon" />
        Player points
        <span className="lg-card__badge">
          {viewMode === "season" ? `Season ${year}` : `Week ${week}`}
        </span>
      </div>

      {loading ? (
        <PageLoader label="Loading" minHeight={120} />
      ) : !perPlayer.length ? (
        <div className="lt-empty-state">No players for this team.</div>
      ) : (
        perPlayer.map((p, i) => (
          <div key={p.id} className="lt-points-row">
            <div className="lt-rank">{i + 1}</div>
            <div className="lt-points-row__body">
              <div className="lt-points-row__name">{p.full_name}</div>
              <div className="lt-points-row__meta">
                {p.stats.goals}G · {p.stats.assists}A · {p.stats.clean_sheets}CS
                {p.awardPts > 0 && <> · +{p.awardPts} awards</>}
              </div>
            </div>
            <span className="lt-pts-pill">{p.points}</span>
          </div>
        ))
      )}
    </div>
  );
}
