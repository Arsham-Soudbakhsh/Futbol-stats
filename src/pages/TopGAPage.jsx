import React, { useContext, useEffect, useState } from "react";
import { PageLoader } from "./Loader";
import { WeekContext } from "./DashboardLayout";
import { useAuthStore } from "../store/authStore";
import { getWeeklyStats, getAllStats, getAllPlayers } from "../lib/firebase";
import "./pages.css";

function RankBadge({ i }) {
  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
  return (
    <div className={`rank-pill ${i < 3 ? "rank-top" : ""}`}>
      {medal || i + 1}
    </div>
  );
}

function MiniBar({ val, max, accent }) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div className="tga-bar">
      <div
        className="tga-bar__fill"
        style={{ width: pct + "%", background: accent }}
      />
    </div>
  );
}

function LeaderCard({ title, icon, accent, rows, valKey, extraCols, emptyLabel }) {
  const max = rows[0] ? valKey(rows[0]) : 0;
  const hasData = rows.some((r) => valKey(r) > 0);
  return (
    <div className="tga-card card">
      <div className="tga-card__header">
        <i className={`ti ${icon}`} style={{ color: accent, fontSize: 16 }} />
        <span className="tga-card__title">{title}</span>
      </div>
      {!hasData ? (
        <div className="no-stats" style={{ padding: "24px 0" }}>
          <i className="ti ti-database-off no-stats__icon" />
          <div className="no-stats__text">{emptyLabel}</div>
        </div>
      ) : (
        <div className="rt-wrap">
          <table className="tga-table">
            <thead>
              <tr>
                <th style={{ width: 36, textAlign: "center" }}>#</th>
                <th>Player</th>
                {extraCols &&
                  extraCols.map((c) => (
                    <th key={c} style={{ width: 36, textAlign: "center" }}>
                      {c}
                    </th>
                  ))}
                <th className="tga-bar-col">Progress</th>
                <th style={{ width: 56, textAlign: "center" }}>Val</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p, i) => (
                <tr key={p.id} className={p.me ? "me" : ""}>
                  <td style={{ textAlign: "center" }}>
                    <RankBadge i={i} />
                  </td>
                  <td>
                    <div className="tga-player">
                      <span className={`player-name ${p.me ? "is-me" : ""}`}>
                        {p.full_name}
                      </span>
                      {p.me && <span className="you-tag">YOU</span>}
                    </div>
                  </td>
                  {extraCols &&
                    extraCols.map((c, ci) => (
                      <td key={c} style={{ textAlign: "center" }}>
                        <span className={`stat-num ${p._extras?.[ci] ? "pos" : ""}`}>
                          {p._extras?.[ci] ?? 0}
                        </span>
                      </td>
                    ))}
                  <td className="tga-bar-col">
                    <MiniBar val={valKey(p)} max={max} accent={accent} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="pts-total">{valKey(p)}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ModeSwitch({ mode, setMode, week }) {
  return (
    <div className="mode-switch">
      <button
        onClick={() => setMode("week")}
        className={`mode-btn ${mode === "week" ? "on" : ""}`}
      >
        <i className="ti ti-calendar-week" />
        <span>Week {week}</span>
      </button>
      <button
        onClick={() => setMode("total")}
        className={`mode-btn ${mode === "total" ? "on" : ""}`}
      >
        <i className="ti ti-trophy" />
        <span>Total</span>
      </button>
    </div>
  );
}

export default function TopGAPage() {
  const { week, year } = useContext(WeekContext);
  const { profile } = useAuthStore();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("week");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      mode === "week" ? getWeeklyStats(week, year) : getAllStats(),
      getAllPlayers(),
    ]).then(([stats, players]) => {
      const statsMap = {};
      stats.forEach((s) => {
        if (!statsMap[s.player_id]) statsMap[s.player_id] = { goals: 0, assists: 0 };
        if (mode === "week") {
          statsMap[s.player_id] = { goals: s.goals || 0, assists: s.assists || 0 };
        } else {
          statsMap[s.player_id].goals += s.goals || 0;
          statsMap[s.player_id].assists += s.assists || 0;
        }
      });
      const merged = players.map((p) => ({
        ...p,
        goals: statsMap[p.id]?.goals || 0,
        assists: statsMap[p.id]?.assists || 0,
        ga: (statsMap[p.id]?.goals || 0) + (statsMap[p.id]?.assists || 0),
        me: p.id === profile?.id,
      }));
      setData(merged);
      setLoading(false);
    });
  }, [week, year, profile, mode]);

  if (loading) return <PageLoader label="Loading stats" minHeight={260} />;

  const byGoal = [...data].sort((a, b) => b.goals - a.goals);
  const byAssist = [...data].sort((a, b) => b.assists - a.assists);
  const byGA = [...data]
    .sort((a, b) => b.ga - a.ga)
    .map((p) => ({ ...p, _extras: [p.goals, p.assists] }));

  const empty = `No data for ${mode === "week" ? `week ${week}` : "this season"} yet.`;

  return (
    <div className="page fade-up tga-page">
      <div className="tga-toolbar">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-chart-bar" />
          Top G / A
        </div>
        <ModeSwitch mode={mode} setMode={setMode} week={week} />
      </div>

      <div className="tga-grid">
        <LeaderCard
          title="Top scorers"
          icon="ti-ball-football"
          accent="var(--primary)"
          rows={byGoal}
          valKey={(p) => p.goals}
          emptyLabel={empty}
        />
        <LeaderCard
          title="Top assists"
          icon="ti-arrow-big-right"
          accent="var(--primary-active)"
          rows={byAssist}
          valKey={(p) => p.assists}
          emptyLabel={empty}
        />
      </div>

      <LeaderCard
        title="G + A combined"
        icon="ti-flame"
        accent="var(--warning)"
        rows={byGA}
        valKey={(p) => p.ga}
        extraCols={["G", "A"]}
        emptyLabel={empty}
      />
    </div>
  );
}
