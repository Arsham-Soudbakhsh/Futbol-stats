import React, { useContext, useMemo, useState } from "react";
import { PageLoader } from "../../components/common/Loader";
import ModeSwitch from "../../components/common/ModeSwitch";
import PlayerProfileDrawer from "../../components/common/PlayerProfileDrawer";
import { WeekContext } from "../../components/layout/WeekContext";
import { useAuthStore } from "../../store/authStore";
import { useTopGAData } from "./useTopGAData";
import LeaderCard from "./components/LeaderCard";
import "./TopGA.css";

export default function TopGAPage() {
  const { week, year } = useContext(WeekContext);
  const { profile } = useAuthStore();
  const [mode, setMode] = useState("week");
  const [selected, setSelected] = useState(null);

  const { data, loading } = useTopGAData({ week, year, profile, mode });

  const { byGoal, byAssist, byGA, empty } = useMemo(() => {
    const byGoal = [...data].sort((a, b) => b.goals - a.goals);
    const byAssist = [...data].sort((a, b) => b.assists - a.assists);
    const byGA = [...data].sort((a, b) => b.ga - a.ga)
      .map((p) => ({ ...p, _extras: [p.goals, p.assists] }));
    const empty = `No data for ${mode === "week" ? `week ${week}` : "this season"} yet.`;
    return { byGoal, byAssist, byGA, empty };
  }, [data, mode, week]);

  if (loading) return <PageLoader label="Loading stats" minHeight={260} />;

  return (
    <div className="page fade-up tga-page">
      <div className="tga-toolbar">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-chart-bar" /> Top G / A
        </div>
        <ModeSwitch mode={mode} setMode={setMode} week={week} />
      </div>

      <div className="tga-grid">
        <LeaderCard title="Top scorers" icon="ti-ball-football" accent="var(--primary)"
          rows={byGoal} valKey={(p) => p.goals} emptyLabel={empty} onSelect={setSelected} />
        <LeaderCard title="Top assists" icon="ti-arrow-big-right" accent="var(--primary-active)"
          rows={byAssist} valKey={(p) => p.assists} emptyLabel={empty} onSelect={setSelected} />
      </div>

      <LeaderCard title="G + A combined" icon="ti-flame" accent="var(--warning)"
        rows={byGA} valKey={(p) => p.ga} extraCols={["G", "A"]}
        emptyLabel={empty} onSelect={setSelected} />

      <PlayerProfileDrawer
        player={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
