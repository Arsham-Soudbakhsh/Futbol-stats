import React, { useContext, useEffect, useState } from "react";
import { PageLoader, SkeletonTable } from './Loader'
import { WeekContext } from "./DashboardLayout";
import { useAuthStore } from "../store/authStore";
import {
  getWeeklyStats,
  getAllStats,
  getAwards,
  getAllAwards,
  getAllPlayers,
} from "../lib/firebase";
import { calcStatPoints, calcAwardPoints, AWARD_LABELS } from "../lib/points";
import "./pages.css";

const POS_CONFIG = {
  GK: { color: "#8A9683", bg: "rgba(138,150,131,.12)" },
  DEF: { color: "var(--primary)", bg: "var(--primary-soft)" },
  MID: { color: "var(--warning)", bg: "rgba(214,162,61,.12)" },
  FWD: { color: "var(--danger)", bg: "rgba(201,91,91,.12)" },
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
        letterSpacing: 0.3,
        flexShrink: 0,
      }}
    >
      {pos}
    </span>
  );
}

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
          statsMap[s.player_id] = {
            goals: 0,
            assists: 0,
            clean_sheets: 0,
          };
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
            awards: aw,
            me: p.id === profile?.id,
          };
        })
        .sort((a, b) => b.total - a.total);

      setRows(result);
      setLoading(false);
    });
  }, [week, year, profile, mode]);

  const maxPts = rows[0]?.total || 1;

  if (loading)
    return (
      <PageLoader label="Loading points" minHeight={220} />
    );

  if (!rows.length || rows.every((r) => r.total === 0))
    return (
      <div className="no-stats fade-up">
        <i className="ti ti-award no-stats__icon" />
        <div className="no-stats__text">No data for week {week} yet.</div>
      </div>
    );

  return (
    <div className="page fade-up points-page">
      <div className="card">
        <div className="card-title">
          <i className="ti ti-award" />
          Points leaderboard
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "0 14px 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: 999,
              padding: 3,
              gap: 3,
            }}
          >
            <button
              onClick={() => setMode("week")}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background:
                  mode === "week" ? "var(--gradient-primary)" : "transparent",
                color: mode === "week" ? "#fff" : "var(--text-muted)",
              }}
            >
              <i className="ti ti-calendar-week" style={{ marginRight: 4 }} />
              Week {week}
            </button>

            <button
              onClick={() => setMode("total")}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "6px 12px",
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background:
                  mode === "total" ? "var(--gradient-primary)" : "transparent",
                color: mode === "total" ? "#fff" : "var(--text-muted)",
              }}
            >
              <i className="ti ti-trophy" style={{ marginRight: 4 }} />
              Total
            </button>
          </div>
        </div>

        <div className="rt-wrap">
          <table>
            <thead>
              <tr>
                <th style={{ width: 36 }}>#</th>
                <th>Player</th>
                <th className="r">G</th>
                <th className="r">A</th>
                <th className="r">CS</th>
                <th className="r">Awards</th>
                <th className="r">Total</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const rankColors = [
                  { bg: "rgba(214,162,61,.15)", c: "var(--warning)" },
                  { bg: "var(--bg-secondary)", c: "var(--text-secondary)" },
                  { bg: "rgba(201,91,91,.1)", c: "var(--danger)" },
                ];
                const rc = rankColors[i] || {
                  bg: "var(--bg-secondary)",
                  c: "var(--text-muted)",
                };

                return (
                  <tr key={r.id} className={r.me ? "me" : ""}>
                    {/* Rank */}
                    <td>
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: "50%",
                          background: rc.bg,
                          color: rc.c,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: i < 3 ? 11 : 12,
                          fontWeight: 700,
                          margin: "0 auto",
                        }}
                      >
                        {i === 0
                          ? "🥇"
                          : i === 1
                            ? "🥈"
                            : i === 2
                              ? "🥉"
                              : i + 1}
                      </div>
                    </td>

                    {/* Player */}
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: r.me ? 600 : 500,
                                fontSize: 13,
                              }}
                            >
                              {r.name}
                            </span>
                            {r.me && (
                              <span
                                style={{
                                  fontSize: 9,
                                  color: "var(--primary)",
                                  fontWeight: 700,
                                }}
                              >
                                YOU
                              </span>
                            )}
                            <PosBadge pos={r.position} />
                          </div>
                          {/* Points bar */}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              marginTop: 4,
                            }}
                          >
                            <div
                              style={{
                                width: Math.max(4, (r.total / maxPts) * 120),
                                height: 3,
                                borderRadius: 999,
                                background: "var(--primary)",
                                transition: "width .5s cubic-bezier(.4,0,.2,1)",
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                              }}
                            >
                              {r.total} pts
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Stats */}
                    <td className="r">
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            r.goals > 0
                              ? "var(--primary)"
                              : "var(--text-muted)",
                          fontSize: 13,
                        }}
                      >
                        {r.goals}
                      </span>
                    </td>
                    <td className="r">
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            r.assists > 0
                              ? "var(--text-secondary)"
                              : "var(--text-muted)",
                          fontSize: 13,
                        }}
                      >
                        {r.assists}
                      </span>
                    </td>
                    <td className="r">
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            r.clean_sheets > 0
                              ? "var(--success)"
                              : "var(--text-muted)",
                          fontSize: 13,
                        }}
                      >
                        {r.clean_sheets}
                      </span>
                    </td>
                    <td className="r">
                      <span
                        style={{
                          fontWeight: 600,
                          color:
                            r.awardPts > 0
                              ? "var(--warning)"
                              : "var(--text-muted)",
                          fontSize: 13,
                        }}
                      >
                        {r.awardPts}
                      </span>
                    </td>

                    {/* Total */}
                    <td className="r">
                      <span className="pts-pill">{r.total}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Points breakdown legend */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 10 }}>
          <i className="ti ti-info-circle" />
          Scoring system
        </div>
        <div
          className="scoring-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 8,
          }}
        >
          {[
            { label: "Goal", pts: 10, color: "var(--primary)" },
            { label: "Assist", pts: 5, color: "var(--text-secondary)" },
            { label: "Clean sheet", pts: 10, color: "var(--success)" },
            { label: "Best player", pts: 50, color: "var(--warning)" },
            { label: "Best overall", pts: 30, color: "var(--warning)" },
            { label: "Team of month", pts: 200, color: "var(--warning)" },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: "var(--bg-secondary)",
                borderRadius: 12,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  fontWeight: 500,
                }}
              >
                {item.label}
              </span>
              <span
                style={{ fontSize: 12, fontWeight: 700, color: item.color }}
              >
                +{item.pts}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
