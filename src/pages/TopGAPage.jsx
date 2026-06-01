import React, { useContext, useEffect, useState } from "react";
import { PageLoader } from './Loader'
import { WeekContext } from "./DashboardLayout";
import { useAuthStore } from "../store/authStore";
import { getWeeklyStats, getAllStats, getAllPlayers } from "../lib/firebase";
const G1 = "var(--text)",
  G2 = "var(--primary)",
  G3 = "var(--primary-active)",
  G4 = "var(--primary-soft)";
const GOLD = "var(--warning)",
  GOLD_BG = "var(--bg-secondary)";

function RankBadge({ i }) {
  const styles = [
    { bg: GOLD_BG, color: GOLD },
    { bg: "var(--bg-secondary)", color: "var(--text-secondary)" },
    { bg: "var(--bg-secondary)", color: "#d57303" },
  ];
  const s = styles[i] || {
    bg: "var(--surface-secondary)",
    color: "var(--text-muted)",
  };
  return (
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: "50%",
        background: s.bg,
        color: s.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 10,
        fontWeight: 700,
        flexShrink: 0,
        margin: "0 auto",
      }}
    >
      {i + 1}
    </div>
  );
}

function MiniBar({ val, max, color }) {
  const pct = max > 0 ? (val / max) * 100 : 0;
  return (
    <div
      style={{
        flex: 1,
        height: 5,
        background: "var(--bg-secondary)",
        borderRadius: 3,
        overflow: "hidden",
        minWidth: 50,
      }}
    >
      <div
        style={{
          width: pct + "%",
          height: "100%",
          background: color,
          borderRadius: 3,
          transition: "width .5s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

function ValPill({ val, color, bg }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 20,
        fontSize: 12,
        fontWeight: 700,
        background: "var(--gradient-primary)",
        color: "#fff ",
      }}
    >
      {val}
    </span>
  );
}

function TableCard({
  title,
  icon,
  color,
  pillBg,
  pillColor,
  rows,
  valKey,
  extraCols,
}) {
  const max = rows[0] ? valKey(rows[0]) : 1;
  return (
    <div
      className="tga-card"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "11px 14px",
          borderBottom: "0.5px solid rgba(0,0,0,.06)",
          display: "flex",
          alignItems: "center",
          gap: 7,
        }}
      >
        <i className={`ti ${icon}`} style={{ color, fontSize: 15 }} />
        <span style={{ fontSize: 12, fontWeight: 500, color: G1, flex: 1 }}>
          {title}
        </span>
      </div>
      <div className="rt-wrap">
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: 12,
            minWidth: 320,
          }}
        >
          <thead>
            <tr style={{ borderBottom: "0.5px solid rgba(0,0,0,.06)" }}>
              <th
                style={{
                  padding: "6px 10px",
                  color: "var(--text-muted)",
                  fontSize: 10,
                  fontWeight: 500,
                  textAlign: "center",
                  width: 32,
                }}
              >
                #
              </th>
              <th
                style={{
                  padding: "6px 10px",
                  color: "var(--text-muted)",
                  fontSize: 10,
                  fontWeight: 500,
                  textAlign: "left",
                }}
              >
                Player
              </th>
              {extraCols &&
                extraCols.map((c) => (
                  <th
                    key={c}
                    style={{
                      padding: "6px 10px",
                      color: "var(--text-muted)",
                      fontSize: 10,
                      fontWeight: 500,
                      textAlign: "center",
                      width: 36,
                    }}
                  >
                    {c}
                  </th>
                ))}
              <th
                style={{
                  padding: "6px 10px",
                  color: "var(--text-muted)",
                  fontSize: 10,
                  fontWeight: 500,
                  width: 80,
                }}
              >
                Bar
              </th>
              <th
                style={{
                  padding: "6px 10px",
                  color: "var(--text-muted)",
                  fontSize: 10,
                  fontWeight: 500,
                  textAlign: "center",
                  width: 50,
                }}
              >
                Val
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, i) => (
              <tr
                key={p.id}
                style={{
                  borderBottom: "0.5px solid rgba(0,0,0,.04)",
                  background: p.me ? "var(--primary-soft)" : "transparent",
                  transition: "background .15s",
                }}
              >
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <RankBadge i={i} />
                </td>
                <td style={{ padding: "8px 10px" }}>
                  <div
                    style={{
                      fontWeight: p.me ? 600 : 400,
                      color: G1,
                      fontSize: 12,
                    }}
                  >
                    {p.full_name}
                    {p.me && (
                      <span style={{ fontSize: 9, color: G2, marginLeft: 4 }}>
                        ★ you
                      </span>
                    )}
                  </div>
                </td>
                {extraCols &&
                  extraCols.map((c, ci) => (
                    <td
                      key={c}
                      style={{ padding: "8px 10px", textAlign: "center" }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: ci === 0 ? G2 : "var(--primary)",
                        }}
                      >
                        {p._extras?.[ci] ?? 0}
                      </span>
                    </td>
                  ))}
                <td style={{ padding: "8px 10px" }}>
                  <MiniBar val={valKey(p)} max={max} color={color} />
                </td>
                <td style={{ padding: "8px 10px", textAlign: "center" }}>
                  <ValPill val={valKey(p)} color={pillColor} bg={pillBg} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
        if (!statsMap[s.player_id]) {
          statsMap[s.player_id] = {
            goals: 0,
            assists: 0,
          };
        }

        if (mode === "week") {
          statsMap[s.player_id] = {
            goals: s.goals || 0,
            assists: s.assists || 0,
          };
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

  return (
    <div
      className="tga-page"
      style={{ display: "flex", flexDirection: "column", gap: 10 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
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
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}.tga-fade{animation:fadeUp .2s ease both}`}</style>
      <div
        className="tga-fade tga-grid"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
      >
        <TableCard
          title="Top scorers"
          icon="ti-ball-football"
          color={G2}
          pillBg="#e8f7ef"
          pillColor={G1}
          rows={byGoal}
          valKey={(p) => p.goals}
        />
        <TableCard
          title="Top assists"
          icon="ti-arrow-big-right"
          color={G3}
          pillBg="#e8f0fe"
          pillColor="#1a3fa0"
          rows={byAssist}
          valKey={(p) => p.assists}
        />
      </div>

      <div className="tga-fade" style={{ animationDelay: ".1s" }}>
        <TableCard
          title="G + A combined"
          icon="ti-plus"
          color="url(#gaGrad)"
          pillBg={GOLD_BG}
          pillColor="#7a4e00"
          rows={byGA}
          valKey={(p) => p.ga}
          extraCols={["G", "A"]}
        />
      </div>
    </div>
  );
}
