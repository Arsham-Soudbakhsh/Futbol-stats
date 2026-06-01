import React, { useContext, useEffect, useState } from "react";
import { PageLoader } from "./Loader";
import { WeekContext } from "./DashboardLayout";
import { useAuthStore } from "../store/authStore";
import { getAllRatings, getAllPlayers } from "../lib/firebase";
import { avgRatings } from "../lib/points";
import "./pages.css";

function ratingColor(v) {
  if (v >= 75) return "var(--success)";
  if (v >= 55) return "var(--warning)";
  if (v > 0) return "var(--danger)";
  return "var(--text-muted)";
}

function RatingRing({ avg = 0 }) {
  const value = Math.max(0, Math.min(100, avg));
  const r = 16, cx = 20, cy = 20;
  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;
  const color = ratingColor(value);
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border)" strokeWidth="3" />
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="3"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={circ * 0.25}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="11"
        fontWeight="700"
        fill={color}
      >
        {Math.round(value)}
      </text>
    </svg>
  );
}

function SkillBar({ val }) {
  const color = ratingColor(val);
  return (
    <div className="skill-cell">
      <span className="skill-num" style={{ color }}>{val}</span>
      <div className="skill-bar">
        <div
          className="skill-bar__fill"
          style={{ width: `${val}%`, background: color }}
        />
      </div>
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

export default function TopPlayersPage() {
  const { week, year } = useContext(WeekContext);
  const { profile } = useAuthStore();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState("week");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      mode === "week" ? getAllRatings(week, year) : getAllRatings(),
      getAllPlayers(),
    ]).then(([ratings, allPlayers]) => {
      const byPlayer = {};
      ratings.forEach((r) => {
        if (!byPlayer[r.to_player_id]) byPlayer[r.to_player_id] = [];
        byPlayer[r.to_player_id].push(r);
      });

      let result;
      if (mode === "week") {
        result = allPlayers.map((p) => ({
          ...p,
          ...avgRatings(byPlayer[p.id] || []),
          me: p.id === profile?.id,
        }));
      } else {
        result = allPlayers.map((p) => {
          const playerRatings = byPlayer[p.id] || [];
          const weekGroups = {};
          playerRatings.forEach((r) => {
            const w = r.week_number;
            if (!weekGroups[w]) weekGroups[w] = [];
            weekGroups[w].push(r);
          });
          const weeklyAverages = Object.values(weekGroups).map((rs) => avgRatings(rs));
          if (!weeklyAverages.length) {
            return { ...p, passing: 0, shooting: 0, defending: 0, dribbling: 0, avg: 0, me: p.id === profile?.id };
          }
          const avg = (key) =>
            Math.round(weeklyAverages.reduce((s, w) => s + w[key], 0) / weeklyAverages.length);
          const passing = avg("passing");
          const shooting = avg("shooting");
          const defending = avg("defending");
          const dribbling = avg("dribbling");
          return {
            ...p,
            passing,
            shooting,
            defending,
            dribbling,
            avg: Math.round((passing + shooting + defending + dribbling) / 4),
            me: p.id === profile?.id,
          };
        });
      }

      result.sort((a, b) => b.avg - a.avg);
      setPlayers(result);
      setLoading(false);
    });
  }, [week, year, profile, mode]);

  if (loading) return <PageLoader label="Loading ratings" minHeight={260} />;

  const hasRatings = players.some((p) => p.avg > 0);
  const podium = hasRatings ? players.slice(0, 3) : [];

  return (
    <div className="page fade-up tp-page">
      <div className="tga-toolbar">
        <div className="card-title" style={{ margin: 0 }}>
          <i className="ti ti-star" />
          Top players
        </div>
        <ModeSwitch mode={mode} setMode={setMode} week={week} />
      </div>

      {hasRatings && (
        <div className="podium-grid">
          {podium.map((p, i) => (
            <div key={p.id} className={`podium-card podium-${i}`}>
              <div className="podium-medal">
                {i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}
              </div>
              <RatingRing avg={p.avg} />
              <div className="podium-name">
                {p.full_name}
                {p.me && <span className="you-tag" style={{ marginLeft: 6 }}>YOU</span>}
              </div>
              <div className="podium-meta">
                P {p.passing} · S {p.shooting} · D {p.defending} · Dr {p.dribbling}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        {!hasRatings ? (
          <div className="no-stats" style={{ padding: "32px 0" }}>
            <i className="ti ti-star-off no-stats__icon" />
            <div className="no-stats__text">
              No ratings submitted for {mode === "week" ? `week ${week}` : "this season"} yet.
            </div>
          </div>
        ) : (
          <div className="rt-wrap">
            <table className="tp-table">
              <thead>
                <tr>
                  <th style={{ width: 40, textAlign: "center" }}>#</th>
                  <th>Player</th>
                  <th>Pass</th>
                  <th>Shot</th>
                  <th>Def</th>
                  <th>Drib</th>
                  <th style={{ textAlign: "center", width: 56 }}>Avg</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const medal = i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null;
                  return (
                    <tr key={p.id} className={p.me ? "me" : ""}>
                      <td style={{ textAlign: "center" }}>
                        <div className={`rank-pill ${i < 3 ? "rank-top" : ""}`}>
                          {medal || i + 1}
                        </div>
                      </td>
                      <td>
                        <div className="tp-player">
                          <RatingRing avg={p.avg} />
                          <div className="tp-player__info">
                            <div className="player-line">
                              <span className={`player-name ${p.me ? "is-me" : ""}`}>
                                {p.full_name}
                              </span>
                              {p.me && <span className="you-tag">YOU</span>}
                            </div>
                            <div className="tp-player__sub">
                              Avg <strong style={{ color: ratingColor(p.avg) }}>{p.avg}</strong>/100
                            </div>
                          </div>
                        </div>
                      </td>
                      <td><SkillBar val={p.passing} /></td>
                      <td><SkillBar val={p.shooting} /></td>
                      <td><SkillBar val={p.defending} /></td>
                      <td><SkillBar val={p.dribbling} /></td>
                      <td style={{ textAlign: "center" }}>
                        <span className="pts-total">{p.avg}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
