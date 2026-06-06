import React, { useContext, useState } from "react";
import { PageLoader } from "../../components/common/Loader";
import ModeSwitch from "../../components/common/ModeSwitch";
import PlayerProfileDrawer from "../../components/common/PlayerProfileDrawer";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { useTopPlayersData } from "./useTopPlayersData";
import Podium from "./components/Podium";
import RatingsTable from "./components/RatingsTable";
import "./TopPlayers.css";

export default function TopPlayersPage() {
  const { week, year } = useContext(WeekContext);
  const { profile } = useAuthStore();
  const [mode, setMode] = useState("week");
  const [selected, setSelected] = useState(null);

  const { players, loading } = useTopPlayersData({ week, year, profile, mode });

  if (loading) return <PageLoader label="Loading ratings" minHeight={260} />;

  const hasRatings = players.some((p) => p.avg > 0);
  const podium = hasRatings ? players.slice(0, 3) : [];

  return (
    <div className="page fade-up tp-page">
      <div className="tga-toolbar">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-star" /> Top players
        </div>
        <ModeSwitch mode={mode} setMode={setMode} week={week} />
      </div>

      {hasRatings && <Podium podium={podium} onSelect={setSelected} />}

      <div className="card">
        {!hasRatings ? (
          <div className="no-stats" style={{ padding: "32px 0" }}>
            <i className="ti ti-star-off no-stats__icon" />
            <div className="no-stats__text">
              No ratings submitted for{" "}
              {mode === "week" ? `week ${week}` : "this season"} yet.
            </div>
          </div>
        ) : (
          <RatingsTable players={players} onSelect={setSelected} />
        )}
      </div>

      <PlayerProfileDrawer
        player={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
