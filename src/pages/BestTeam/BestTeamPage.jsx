import React, { useContext, useState } from "react";
import { PageLoader } from "../../components/common/Loader";
import { WeekContext } from "../../components/layout/WeekContext";
import { useBestTeamData } from "./useBestTeamData";
import BestPitch from "./components/BestPitch";
import PlayerDetail from "./components/PlayerDetail";
import PositionRankings from "./components/PositionRankings";
import "./BestTeam.css";

/**
 * BestTeamPage — Squad of the Week (5 picks) + per-position ranking lists.
 * The picker only considers players who declared each position.
 *
 * Formation: 1 GK · 1 DEF · 2 MID · 1 ST
 */
export default function BestTeamPage() {
  const { week, year } = useContext(WeekContext);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("ST");

  const { loading, enriched, byPosition, bestXI } = useBestTeamData({
    week,
    year,
  });

  // Reset selection on scope change.
  React.useEffect(() => setSelected(null), [week, year]);

  const filledCount = Object.values(bestXI).filter(Boolean).length;
  const totalSlots = 5;

  return (
    <div className="fade-up bt-page">
      <div className="bt-grid">
        <div className="card" style={{ padding: 14 }}>
          <div className="card-title">
            <i className="ti ti-layout-board" />
            Squad of the Week
            <span className="badge">Week {week}</span>
            {!loading && filledCount > 0 && filledCount < totalSlots && (
              <span
                className="badge"
                style={{ background: "var(--warning)", color: "#fff", marginLeft: 6 }}
                title="Some position slots are missing data"
              >
                {filledCount}/{totalSlots} filled
              </span>
            )}
          </div>

          {loading ? (
            <PageLoader label="Building Squad of the Week" minHeight={200} />
          ) : filledCount === 0 ? (
            <div className="bt-empty-state">
              <i
                className="ti ti-ball-football"
                style={{
                  fontSize: 32,
                  opacity: 0.4,
                  display: "block",
                  marginBottom: 8,
                }}
              />
              No data for week {week} yet.
              <br />
              <span style={{ fontSize: 11 }}>
                Stats &amp; ratings need to be entered first.
              </span>
            </div>
          ) : (
            <>
              <BestPitch
                bestXI={bestXI}
                selected={selected}
                onSelect={setSelected}
              />
              {selected && (
                <PlayerDetail
                  player={selected}
                  onClose={() => setSelected(null)}
                />
              )}
            </>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <i className="ti ti-trophy" />
            Position Rankings
            <span className="badge">Week {week}</span>
          </div>

          {loading ? (
            <PageLoader label="Loading rankings" minHeight={160} />
          ) : (
            <PositionRankings
              enriched={enriched}
              byPosition={byPosition}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              selected={selected}
              setSelected={setSelected}
            />
          )}
        </div>
      </div>
    </div>
  );
}
