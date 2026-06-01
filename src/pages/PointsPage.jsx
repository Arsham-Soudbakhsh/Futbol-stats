import React, { useContext, useEffect, useState } from "react";
import { PageLoader } from "./Loader";
import { WeekContext } from "./DashboardLayout";
import { useAuthStore } from "../store/authStore";
import {
  getWeeklyStats,
  getAllStats,
  getAwards,
  getAllAwards,
  getAllPlayers,
} from "../lib/firebase";
import { calcStatPoints, calcAwardPoints } from "../lib/points";
import "./pages.css";

const POS_CONFIG = {
  GK: { color: "var(--text-secondary)", bg: "var(--bg-secondary)" },
  DEF: { color: "var(--primary)", bg: "var(--primary-soft)" },
  MID: { color: "var(--warning)", bg: "color-mix(in oklab, var(--warning) 14%, transparent)" },
  FWD: { color: "var(--danger)", bg: "color-mix(in oklab, var(--danger) 14%, transparent)" },
};

function PosBadge({ pos }) {
  if (!pos) return null;
  const c = POS_CONFIG[pos] || {};
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        padding: "2px 6px",
        borderRadius: 999,
        background: c.bg,
        color: c.color,
        textTransform: "uppercase",
        letterSpacing: 0.4,
        flexShrink: 0,
      }}
    >
      {pos}
    </span>
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

const SCORING = [
  { label: "Goal", pts: 10, icon: "ti-ball-football", color: "var(--primary)" },
  { label: "Assist", pts: 5, icon: "ti-arrow-big-right", color: "var(--text-secondary)" },
  { label: "Clean sheet", pts: 20, icon: "ti-shield-check", color: "var(--success)" },
  { label: "Best player / week", pts: 50, icon: "ti-star", color: "var(--warning)" },
  { label: "Best G/A / week", pts: 40, icon: "ti-flame", color: "var(--warning)" },
  { label: "Top scorer / week", pts: 35, icon: "ti-target", color: "var(--warning)" },
  { label: "Top assister / week", pts: 30, icon: "ti-bolt", color: "var(--warning)" },
  { label: "Most clean sheets", pts: 30, icon: "ti-lock", color: "var(--warning)" },
  { label: "Best GK / week", pts: 30, icon: "ti-hand-stop", color: "var(--warning)" },
  { label: "Best DEF / week", pts: 20, icon: "ti-shield", color: "var(--warning)" },
  { label: "Best MID / week", pts: 20, icon: "ti-circle-dot", color: "var(--warning)" },
  { label: "Best STR / week", pts: 20, icon: "ti-rocket", color: "var(--warning)" },
  { label: "Best overall", pts: 30, icon: "ti-crown", color: "var(--warning)" },
  { label: "Team of the week", pts: 15, icon: "ti-users-group", color: "var(--warning)" },
];

export default function PointsPage() {
  const { week, year } = useContext(WeekContext);
  const { profile } = useAuthStore();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("week");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      mode === "week" ? getWeeklyStats(week, year) : getAllStats(),
      mode === "week" ? getAwards(week, year) : getAllAwards(),
      getAllPlayers(),
    ]).then(([stats, awards, players]) => {
      const statsMap = {};
      stats.forEach((s) => {
        if (!statsMap[s.player_id]) {
          statsMap[s.player_id] = { goals: 0, assists: 0, clean_sheets: 0 };
        }
        if (mode === "week") {
          statsMap[s.player_id] = {
            goals: s.goals || 0,
            assists: s.assists || 0,
            clean_sheets: s.clean_sheets || 0,
          };
        } else {
          statsMap[s.player_id].goals += s.goals || 0;
          statsMap[s.player_id].assists += s.assists || 0;
          statsMap[s.player_id].clean_sheets += s.clean_sheets || 0;
        }
      });
      const awardsMap = {};
      awards.forEach((a) => {
        if (!a.player_id) return;
        if (!awardsMap[a.player_id]) awardsMap[a.player_id] = [];
        awardsMap[a.player_id].push(a);
      });

      const result = players
        .map((p) => {
          const s = statsMap[p.id];
          const aw = awardsMap[p.id] || [];
          const statPts = calcStatPoints(s);
          const awardPts = calcAwardPoints(aw);
          return {
            id: p.id,
            name: p.full_name,
            position: p.position,
            goals: s?.goals || 0,
            assists: s?.assists || 0,
            clean_sheets: s?.clean_sheets || 0,
            statPts,
            awardPts,
            total: statPts + awardPts,
            me: p.id === profile?.id,
          };
        })
        .sort((a, b) => b.total - a.total);

      setRows(result);
      setLoading(false);
    });
  }, [week, year, profile, mode]);

  const maxPts = rows[0]?.total || 1;

  if (loading) return <PageLoader label="Loading points" minHeight={220} />;

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

        {!rows.length || rows.every((r) => r.total === 0) ? (
          <div className="no-stats" style={{ padding: "28px 0" }}>
            <i className="ti ti-award no-stats__icon" />
            <div className="no-stats__text">
              No data for {mode === "week" ? `week ${week}` : "this season"} yet.
            </div>
          </div>
        ) : (
          <div className="rt-wrap">
            <table className="pts-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Player</th>
                  <th className="r">G</th>
                  <th className="r">A</th>
                  <th className="r">CS</th>
                  <th className="r">Aw</th>
                  <th className="r">Total</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                  return (
                    <tr key={r.id} className={r.me ? "me" : ""}>
                      <td>
                        <div className={`rank-pill ${i < 3 ? "rank-top" : ""}`}>
                          {medal || i + 1}
                        </div>
                      </td>
                      <td>
                        <div className="player-cell">
                          <div className="player-line">
                            <span className={`player-name ${r.me ? "is-me" : ""}`}>
                              {r.name}
                            </span>
                            {r.me && <span className="you-tag">YOU</span>}
                            <PosBadge pos={r.position} />
                          </div>
                          <div className="player-bar">
                            <div
                              className="player-bar__fill"
                              style={{ width: `${(r.total / maxPts) * 100}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="r">
                        <span className={`stat-num ${r.goals ? "pos" : ""}`}>{r.goals}</span>
                      </td>
                      <td className="r">
                        <span className={`stat-num ${r.assists ? "neutral" : ""}`}>{r.assists}</span>
                      </td>
                      <td className="r">
                        <span className={`stat-num ${r.clean_sheets ? "ok" : ""}`}>{r.clean_sheets}</span>
                      </td>
                      <td className="r">
                        <span className={`stat-num ${r.awardPts ? "warn" : ""}`}>{r.awardPts}</span>
                      </td>
                      <td className="r">
                        <span className="pts-total">{r.total}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Scoring legend */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 12 }}>
          <i className="ti ti-info-circle" />
          Scoring system
        </div>
        <div className="scoring-grid">
          {SCORING.map((item) => (
            <div key={item.label} className="scoring-item">
              <span className="scoring-item__icon" style={{ color: item.color }}>
                <i className={`ti ${item.icon}`} />
              </span>
              <span className="scoring-item__label">{item.label}</span>
              <span className="scoring-item__pts" style={{ color: item.color }}>
                +{item.pts}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
