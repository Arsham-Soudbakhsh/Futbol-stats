import React, { useContext, useEffect, useState } from "react";
import { PageLoader } from './Loader'
import { WeekContext } from "./DashboardLayout";
import { useAuthStore } from "../store/authStore";
import { getAllRatings, getAllPlayers } from "../lib/firebase";
import { avgRatings } from "../lib/points";

const G1 = "var(--text)",
  G2 = "var(--primary)",
  G3 = "var(--primary-active)",
  G4 = "var(--primary-soft)";
const GOLD = "var(--warning)",
  GOLD_BG = "var(--bg-secondary)";

function RatingRing({ avg = 0 }) {
  const value = Math.max(0, Math.min(100, avg));

  const r = 15;
  const cx = 18;
  const cy = 18;

  const circ = 2 * Math.PI * r;
  const dash = (value / 100) * circ;

  const color = value >= 70 ? "#22c55e" : value >= 50 ? "#eab308" : "#ef4444";

  return (
    <svg width="36" height="36" viewBox="0 0 36 36">
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="#e8ede9"
        strokeWidth="3"
      />

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
        transform="rotate(-90 18 18)"
      />

      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill={color}
      >
        {Math.round(value)}
      </text>
    </svg>
  );
}

function SkillDots({ val, color }) {
  const filled = Math.round((val / 100) * 5);
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 2 }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          style={{
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: i < filled ? color : "var(--bg-secondary)",
          }}
        />
      ))}
    </div>
  );
}

function RatingCell({ val, color }) {
  return (
    <td style={{ padding: "8px 6px", textAlign: "center" }}>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>
          {val}
        </span>
        <SkillDots val={val} color={color} />
      </div>
    </td>
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
      // Group ratings by player
      const byPlayer = {};
      ratings.forEach((r) => {
        if (!byPlayer[r.to_player_id]) byPlayer[r.to_player_id] = [];
        byPlayer[r.to_player_id].push(r);
      });

      let result;

      if (mode === "week") {
        result = allPlayers.map((p) => {
          const r = avgRatings(byPlayer[p.id] || []);

          return {
            ...p,
            ...r,
            me: p.id === profile?.id,
          };
        });
      } else {
        result = allPlayers.map((p) => {
          const playerRatings = byPlayer[p.id] || [];

          // گروه‌بندی بر اساس هفته
          const weekGroups = {};

          playerRatings.forEach((r) => {
            const w = r.week_number;

            if (!weekGroups[w]) {
              weekGroups[w] = [];
            }

            weekGroups[w].push(r);
          });

          const weeklyAverages = Object.values(weekGroups).map((rs) =>
            avgRatings(rs),
          );

          if (!weeklyAverages.length) {
            return {
              ...p,
              passing: 0,
              shooting: 0,
              defending: 0,
              dribbling: 0,
              avg: 0,
              me: p.id === profile?.id,
            };
          }

          const passing = Math.round(
            weeklyAverages.reduce((s, w) => s + w.passing, 0) /
              weeklyAverages.length,
          );

          const shooting = Math.round(
            weeklyAverages.reduce((s, w) => s + w.shooting, 0) /
              weeklyAverages.length,
          );

          const defending = Math.round(
            weeklyAverages.reduce((s, w) => s + w.defending, 0) /
              weeklyAverages.length,
          );

          const dribbling = Math.round(
            weeklyAverages.reduce((s, w) => s + w.dribbling, 0) /
              weeklyAverages.length,
          );

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

  return (
    <div
      className="tp-page"
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.tp-fade{animation:fadeUp .2s ease both}`}</style>

      <div
        className="tp-fade tp-card"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
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
              transition: "all .2s ease",
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
              transition: "all .2s ease",
              background:
                mode === "total" ? "var(--gradient-primary)" : "transparent",
              color: mode === "total" ? "#fff" : "var(--text-muted)",
            }}
          >
            <i className="ti ti-trophy" style={{ marginRight: 4 }} />
            Total
          </button>
        </div>

        {!hasRatings ? (
          <div
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              padding: "24px",
              textAlign: "center",
            }}
          >
            <i
              className="ti ti-star-off"
              style={{
                fontSize: 24,
                display: "block",
                marginBottom: 8,
                color: "var(--border-strong)",
              }}
            />
            No ratings submitted for week {week} yet.
          </div>
        ) : (
          <div className="rt-wrap">
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
                minWidth: 520,
              }}
            >
              <thead>
                <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,.06)" }}>
                  {["#", "Player", "Pass", "Shot", "Def", "Drib", "Avg"].map(
                    (h, i) => (
                      <th
                        key={h}
                        style={{
                          padding: "7px 6px",
                          color: "var(--text-muted)",
                          fontSize: 10,
                          fontWeight: 500,
                          textAlign: i <= 1 ? "left" : "center",
                        }}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {players.map((p, i) => {
                  const isTop3 = i < 3;
                  const rankColors = [
                    { bg: "#FFD700", c: GOLD },
                    { bg: "#868686", c: "var(--text)" },
                    { bg: "#b45d00", c: "var(--text)" },
                  ];
                  const rc = rankColors[i] || {
                    bg: "var(--surface-secondary)",
                    c: "var(--text-muted)",
                  };
                  const avgColor =
                    p.avg >= 75 ? G2 : p.avg >= 60 ? G4 : "var(--text-muted)";

                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: "0.5px solid rgba(0,0,0,.04)",
                        background: p.me
                          ? "var(--primary-soft)"
                          : "transparent",
                        transition: "background .15s",
                      }}
                    >
                      <td
                        style={{
                          padding: "8px 10px",
                          textAlign: "center",
                          width: 36,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: rc.bg,
                            color: rc.c,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            margin: "0 auto",
                          }}
                        >
                          {isTop3 ? (i === 0 ? "👑" : i + 1) : i + 1}
                        </div>
                      </td>
                      <td style={{ padding: "8px 10px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <RatingRing avg={p.avg} />
                          <div>
                            <div
                              style={{
                                fontWeight: p.me ? 600 : 500,
                                color: G1,
                                fontSize: 12,
                              }}
                            >
                              {p.full_name}
                              {p.me && (
                                <span
                                  style={{
                                    fontSize: 9,
                                    color: G2,
                                    marginLeft: 4,
                                  }}
                                >
                                  ★ you
                                </span>
                              )}
                            </div>
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-muted)",
                                marginTop: 1,
                              }}
                            >
                              Avg:{" "}
                              <span
                                style={{
                                  color: "var(--primary)",
                                  fontWeight: 600,
                                }}
                              >
                                {p.avg}
                              </span>
                              /100
                            </div>
                          </div>
                        </div>
                      </td>
                      <RatingCell val={p.passing} color={G3} />
                      <RatingCell val={p.shooting} color={G3} />
                      <RatingCell val={p.defending} color={G3} />
                      <RatingCell val={p.dribbling} color={G3} />
                      <td style={{ padding: "8px 10px", textAlign: "center" }}>
                        <div
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "3px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 700,
                            background:
                              i === 0
                                ? GOLD_BG
                                : i < 3
                                  ? "var(--primary-soft)"
                                  : "var(--surface-secondary)",
                            color:
                              i === 0
                                ? "var(--warning)"
                                : i < 3
                                  ? G1
                                  : "var(--text-muted)",
                          }}
                        >
                          {p.avg}
                        </div>
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
