import React, { useContext, useEffect, useState } from "react";
import { WeekContext } from "./DashboardLayout";
import { useAuthStore } from "../store/authStore";
import {
  getAllPlayers,
  getWeeklyStats,
  upsertStats,
  upsertAward,
  getTeams,
  getTeamWeeklyStats,
  upsertTeamWeeklyStats,
  createInviteCode,
  getInviteCodes,
  deleteInviteCodeById,
} from "../lib/firebase";
import { AWARD_LABELS } from "../lib/points";

const AWARD_TYPES = Object.entries(AWARD_LABELS);

const GREEN1 = "var(--text)";
const GREEN2 = "var(--primary)";

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--border)",
  borderRadius: 10,
  fontSize: 14,
  fontWeight: 500,
  textAlign: "center",
  fontFamily: "DM Mono, monospace",
  outline: "none",
  background: "var(--surface)",
  color: GREEN1,
  transition: "border-color .18s",
};

export default function AdminPage() {
  const { profile } = useAuthStore();
  const { week, year } = useContext(WeekContext);
  const [tab, setTab] = useState("player-stats");
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [statsForm, setStatsForm] = useState({});
  const [teamForm, setTeamForm] = useState({});
  const [awardForm, setAwardForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [inviteCodes, setInviteCodes] = useState([]);

  if (profile?.role !== "admin")
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "16px 18px",
        }}
      >
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Access denied. Admin only.
        </div>
      </div>
    );

  // Load players
  useEffect(() => {
    getAllPlayers().then((list) =>
      setPlayers(list.filter((p) => p.role !== "admin")),
    );

    getTeams().then(setTeams);

    getInviteCodes().then(setInviteCodes);
  }, []);

  // Load player stats for this week
  useEffect(() => {
    getWeeklyStats(week, year).then((rows) => {
      const map = {};
      rows.forEach((s) => {
        map[s.player_id] = {
          goals: s.goals ?? 0,
          assists: s.assists ?? 0,
          clean_sheets: s.clean_sheets ?? 0,
        };
      });
      setStatsForm(map);
    });
  }, [week, year]);

  // Load team stats for this week
  useEffect(() => {
    const loadTeamStats = async () => {
      const map = {};
      for (const t of teams) {
        const ts = await getTeamWeeklyStats(t.id, week, year);
        if (ts) {
          map[t.id] = {
            played: ts.played ?? 0,
            wins: ts.wins ?? 0,
            draws: ts.draws ?? 0,
            losses: ts.losses ?? 0,
            goals_for: ts.goals_for ?? 0,
            goals_against: ts.goals_against ?? 0,
          };
        }
      }
      setTeamForm(map);
    };
    if (teams.length > 0) loadTeamStats();
  }, [week, year, teams]);

  const handleStatChange = (pid, field, val) => {
    setStatsForm((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [field]: val },
    }));
  };

  const handleTeamChange = (tid, field, val) => {
    setTeamForm((prev) => ({
      ...prev,
      [tid]: { ...(prev[tid] || {}), [field]: val },
    }));
  };

  const savePlayerStats = async () => {
    setSaving(true);
    setMsg("");
    try {
      for (const [pid, s] of Object.entries(statsForm)) {
        await upsertStats(pid, week, year, {
          goals: parseInt(s.goals) || 0,
          assists: parseInt(s.assists) || 0,
          clean_sheets: parseInt(s.clean_sheets) || 0,
        });
      }
      setMsg("✅ Player stats saved!");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const saveTeamStats = async () => {
    setSaving(true);
    setMsg("");
    try {
      for (const [tid, s] of Object.entries(teamForm)) {
        await upsertTeamWeeklyStats(tid, week, year, {
          played: parseInt(s.played) || 0,
          wins: parseInt(s.wins) || 0,
          draws: parseInt(s.draws) || 0,
          losses: parseInt(s.losses) || 0,
          goals_for: parseInt(s.goals_for) || 0,
          goals_against: parseInt(s.goals_against) || 0,
        });
      }
      setMsg("✅ Team stats saved!");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const saveAwards = async () => {
    setSaving(true);
    setMsg("");
    try {
      for (const [type, pid] of Object.entries(awardForm)) {
        if (!pid) continue;
        await upsertAward(type, pid, week, year);
      }
      setMsg("✅ Awards saved!");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };
  const reloadInvites = async () => {
    const list = await getInviteCodes();
    setInviteCodes(list);
  };

  const createPlayerInvite = async () => {
    const code = await createInviteCode("player");
    await reloadInvites();
    setMsg(`✅ Player code created: ${code}`);
  };

  const createCaptainInvite = async () => {
    const code = await createInviteCode("captain");
    await reloadInvites();
    setMsg(`✅ Captain code created: ${code}`);
  };

  const removeInvite = async (code) => {
    await deleteInviteCodeById(code);
    await reloadInvites();
  };

  const tabs = [
    { id: "player-stats", label: "Player stats", icon: "ti-user" },
    { id: "team-stats", label: "Team stats", icon: "ti-shield" },
    { id: "awards", label: "Awards", icon: "ti-trophy" },
    { id: "invites", label: "Invites", icon: "ti-key" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        .adm-card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:16px 18px;animation:fadeUp .2s ease both}
        .adm-tab{padding:7px 14px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;color:#8fa396;border:none;background:transparent;font-family:var(--font-sans);transition:all .15s;display:flex;align-items:center;gap:6px}
        .adm-tab:hover{background:var(--bg-secondary);color:var(--navy)}
        .adm-tab.on{background:var(--text);color:#fff}
        .num-input:focus{border-color:var(--blue) !important;outline:none}
        .save-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 18px;border-radius:8px;font-size:13px;font-weight:500;cursor:pointer;border:none;background:var(--text);color:#fff;font-family:var(--font-sans);transition:background .18s}
        .save-btn:hover{background:var(--blue)}
        .save-btn:disabled{opacity:.5;cursor:default}
        .player-row{display:flex;flex-direction:column;padding:12px 0;border-bottom:0.5px solid rgba(0,0,0,.06)}
        .player-row:last-child{border-bottom:none;padding-bottom:0}
        .team-row{padding:14px 0;border-bottom:0.5px solid rgba(0,0,0,.06)}
        .team-row:last-child{border-bottom:none;padding-bottom:0}
        .field-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
        .field-item label{display:block;font-size:10px;color:#8fa396;margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px}
        .cs-toggle{display:flex;align-items:center;gap:8px;margin-top:22px}
        .cs-box{width:20px;height:20px;border-radius:5px;border:1.5px solid rgba(0,0,0,.15);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0}
        .cs-box.checked{background:var(--blue);border-color:var(--blue)}
        .msg{font-size:12px;padding:8px 12px;border-radius:7px;margin-bottom:10px}
        .msg.ok{background:var(--primary-soft);color:var(--navy)}
        .msg.err{background:#fce8e6;color:#8b1f12}
      `}</style>

      {/* Header */}
      <div className="adm-card">
        <div
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: GREEN1,
            marginBottom: 12,
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <i
            className="ti ti-settings"
            style={{ color: GREEN2, fontSize: 16 }}
          />
          Admin panel
          <span
            style={{
              fontSize: 10,
              padding: "2px 8px",
              background: "var(--primary-soft)",
              color: GREEN1,
              borderRadius: 20,
              fontWeight: 400,
              marginLeft: 4,
            }}
          >
            Week {week}
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`adm-tab${tab === t.id ? " on" : ""}`}
              onClick={() => {
                setTab(t.id);
                setMsg("");
              }}
            >
              <i className={`ti ${t.icon}`} style={{ fontSize: 14 }} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── TAB: PLAYER STATS ── */}
      {tab === "player-stats" && (
        <div className="adm-card">
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: GREEN1,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i className="ti ti-user" style={{ color: GREEN2, fontSize: 15 }} />
            Player stats
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 400,
                marginLeft: 4,
              }}
            >
              — گل، پاس‌گل، کلین‌شیت هر بازیکن
            </span>
          </div>

          {players.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Loading players…
            </div>
          ) : (
            players.map((p) => {
              const s = statsForm[p.id] || {
                goals: 0,
                assists: 0,
                clean_sheets: 0,
              };
              return (
                <div key={p.id} className="player-row">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <div
                        style={{ fontSize: 13, fontWeight: 500, color: GREEN1 }}
                      >
                        {p.full_name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--text-muted)",
                          marginTop: 1,
                          textTransform: "capitalize",
                        }}
                      >
                        {p.role}
                      </div>
                    </div>
                  </div>
                  <div className="field-grid">
                    {[
                      { field: "goals", label: "Goals ⚽", max: 30 },
                      { field: "assists", label: "Assists 🎯", max: 30 },
                      {
                        field: "clean_sheets",
                        label: "Clean sheets 🧤",
                        max: 10,
                      },
                    ].map(({ field, label, max }) => (
                      <div key={field} className="field-item">
                        <label>{label}</label>
                        <input
                          className="num-input"
                          style={inputStyle}
                          type="number"
                          min="0"
                          max={max}
                          value={s[field] ?? 0}
                          onChange={(e) =>
                            handleStatChange(p.id, field, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <div style={{ marginTop: 16 }}>
            {msg && (
              <div className={`msg${msg.startsWith("✅") ? " ok" : " err"}`}>
                {msg}
              </div>
            )}
            <button
              className="save-btn"
              onClick={savePlayerStats}
              disabled={saving}
            >
              <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />
              {saving ? "Saving…" : "Save player stats"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: TEAM STATS ── */}
      {tab === "team-stats" && (
        <div className="adm-card">
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: GREEN1,
              marginBottom: 4,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i
              className="ti ti-shield"
              style={{ color: GREEN2, fontSize: 15 }}
            />
            Team stats
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 400,
                marginLeft: 4,
              }}
            >
              — نتایج تیمی این هفته
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              marginBottom: 14,
              lineHeight: 1.6,
            }}
          >
            آمار تجمعی هفته {week} رو وارد کن — مثلاً اگه تیم ۳ بازی داشت:
            Played=3، Wins=2، ...
          </div>

          {teams.length === 0 ? (
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Loading teams…
            </div>
          ) : (
            teams.map((t) => {
              const s = teamForm[t.id] || {
                played: 0,
                wins: 0,
                draws: 0,
                losses: 0,
                goals_for: 0,
                goals_against: 0,
              };
              return (
                <div key={t.id} className="team-row">
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: GREEN1,
                      marginBottom: 10,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: GREEN2,
                      }}
                    />
                    {t.name}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {[
                      { field: "played", label: "Played" },
                      { field: "wins", label: "Wins ✅" },
                      { field: "draws", label: "Draws 🤝" },
                    ].map(({ field, label }) => (
                      <div key={field} className="field-item">
                        <label>{label}</label>
                        <input
                          className="num-input"
                          style={inputStyle}
                          type="number"
                          min="0"
                          value={s[field] ?? 0}
                          onChange={(e) =>
                            handleTeamChange(t.id, field, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 8,
                    }}
                  >
                    {[
                      { field: "losses", label: "Losses ❌" },
                      { field: "goals_for", label: "Goals scored ⚽" },
                      { field: "goals_against", label: "Goals conceded 🥅" },
                    ].map(({ field, label }) => (
                      <div key={field} className="field-item">
                        <label>{label}</label>
                        <input
                          className="num-input"
                          style={inputStyle}
                          type="number"
                          min="0"
                          value={s[field] ?? 0}
                          onChange={(e) =>
                            handleTeamChange(t.id, field, e.target.value)
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}

          <div style={{ marginTop: 16 }}>
            {msg && (
              <div className={`msg${msg.startsWith("✅") ? " ok" : " err"}`}>
                {msg}
              </div>
            )}
            <button
              className="save-btn"
              onClick={saveTeamStats}
              disabled={saving}
            >
              <i className="ti ti-device-floppy" style={{ fontSize: 14 }} />
              {saving ? "Saving…" : "Save team stats"}
            </button>
          </div>
        </div>
      )}

      {/* ── TAB: AWARDS ── */}
      {tab === "awards" && (
        <div className="adm-card">
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: GREEN1,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i
              className="ti ti-trophy"
              style={{ color: GREEN2, fontSize: 15 }}
            />
            Awards
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
                fontWeight: 400,
                marginLeft: 4,
              }}
            >
              — جوایز هفته {week}
            </span>
          </div>

          {AWARD_TYPES.map(([type, label]) => (
            <div key={type} style={{ marginBottom: 12 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 11,
                  color: "var(--text-muted)",
                  marginBottom: 5,
                  textTransform: "uppercase",
                  letterSpacing: ".4px",
                }}
              >
                {label}
              </label>
              <select
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  fontSize: 13,
                  fontFamily: "var(--font-sans)",
                  color: GREEN1,
                  background: "var(--surface)",
                  outline: "none",
                }}
                value={awardForm[type] || ""}
                onChange={(e) =>
                  setAwardForm((prev) => ({ ...prev, [type]: e.target.value }))
                }
              >
                <option value="">— No selection —</option>
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.full_name}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            {msg && (
              <div className={`msg${msg.startsWith("✅") ? " ok" : " err"}`}>
                {msg}
              </div>
            )}
            <button className="save-btn" onClick={saveAwards} disabled={saving}>
              <i className="ti ti-trophy" style={{ fontSize: 14 }} />
              {saving ? "Saving…" : "Save awards"}
            </button>
          </div>
        </div>
      )}
      {tab === "invites" && (
        <div className="adm-card">
          <div
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: GREEN1,
              marginBottom: 14,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <i
              className="ti ti-key"
              style={{
                color: GREEN2,
                fontSize: 15,
              }}
            />
            Invite Codes
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <button className="save-btn" onClick={createPlayerInvite}>
              <i className="ti ti-user-plus" />
              Player Code
            </button>

            <button className="save-btn" onClick={createCaptainInvite}>
              <i className="ti ti-crown" />
              Captain Code
            </button>
          </div>

          {inviteCodes.length === 0 ? (
            <div
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
              }}
            >
              No invite codes yet.
            </div>
          ) : (
            inviteCodes.map((code) => (
              <div
                key={code.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontFamily: "monospace",
                    }}
                  >
                    {code.code}
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                    }}
                  >
                    {code.role} • {code.used ? "USED" : "UNUSED"}
                  </div>
                </div>

                <button
                  onClick={() => removeInvite(code.code)}
                  style={{
                    border: "none",
                    cursor: "pointer",
                    background: "transparent",
                  }}
                >
                  <i
                    className="ti ti-trash"
                    style={{
                      fontSize: 16,
                      color: "var(--danger)",
                    }}
                  />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
