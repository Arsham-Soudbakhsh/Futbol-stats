import React, { useContext, useEffect, useState } from "react";
import { PageLoader } from "./Loader";
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
import "./pages.css";

const AWARD_TYPES = Object.entries(AWARD_LABELS);

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
  const [search, setSearch] = useState("");

  if (profile?.role !== "admin")
    return (
      <div className="card" style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          Access denied. Admin only.
        </div>
      </div>
    );

  useEffect(() => {
    getAllPlayers().then((list) => setPlayers(list.filter((p) => p.role !== "admin")));
    getTeams().then(setTeams);
    getInviteCodes().then(setInviteCodes);
  }, []);

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

  const handleStatChange = (pid, field, val) =>
    setStatsForm((prev) => ({ ...prev, [pid]: { ...(prev[pid] || {}), [field]: val } }));

  const handleTeamChange = (tid, field, val) =>
    setTeamForm((prev) => ({ ...prev, [tid]: { ...(prev[tid] || {}), [field]: val } }));

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

  const reloadInvites = async () => setInviteCodes(await getInviteCodes());
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
    { id: "player-stats", label: "Players", icon: "ti-user" },
    { id: "team-stats", label: "Teams", icon: "ti-shield" },
    { id: "awards", label: "Awards", icon: "ti-trophy" },
    { id: "invites", label: "Invites", icon: "ti-key" },
  ];

  const filteredPlayers = players.filter((p) =>
    p.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="page fade-up admin-page">
      {/* Header */}
      <div className="card admin-header">
        <div className="admin-header__top">
          <div className="card-title" style={{ margin: 0 }}>
            <i className="ti ti-settings" />
            Admin panel
          </div>
          <span className="admin-week-pill">
            <i className="ti ti-calendar-week" /> Week {week} · {year}
          </span>
        </div>
        <div className="admin-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? "on" : ""}`}
              onClick={() => { setTab(t.id); setMsg(""); }}
            >
              <i className={`ti ${t.icon}`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {msg && (
        <div className={`admin-msg ${msg.startsWith("✅") ? "ok" : "err"}`}>
          {msg}
        </div>
      )}

      {/* PLAYER STATS */}
      {tab === "player-stats" && (
        <div className="card admin-section">
          <div className="admin-section__header">
            <div className="card-title" style={{ margin: 0 }}>
              <i className="ti ti-user" /> Player stats
            </div>
            <input
              className="admin-search"
              placeholder="Search player…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {players.length === 0 ? (
            <PageLoader label="Loading players" minHeight={140} />
          ) : (
            <div className="admin-list">
              {filteredPlayers.map((p) => {
                const s = statsForm[p.id] || { goals: 0, assists: 0, clean_sheets: 0 };
                return (
                  <div key={p.id} className="admin-row">
                    <div className="admin-row__head">
                      <div className="admin-row__name">{p.full_name}</div>
                      <div className="admin-row__role">{p.role}</div>
                    </div>
                    <div className="admin-fields">
                      {[
                        { field: "goals", label: "Goals", icon: "ti-ball-football", max: 30 },
                        { field: "assists", label: "Assists", icon: "ti-arrow-big-right", max: 30 },
                        { field: "clean_sheets", label: "Clean sheets", icon: "ti-shield-check", max: 10 },
                      ].map(({ field, label, icon, max }) => (
                        <div key={field} className="admin-field">
                          <label>
                            <i className={`ti ${icon}`} /> {label}
                          </label>
                          <input
                            className="admin-input"
                            type="number"
                            min="0"
                            max={max}
                            value={s[field] ?? 0}
                            onChange={(e) => handleStatChange(p.id, field, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="admin-actions">
            <button className="admin-save" onClick={savePlayerStats} disabled={saving}>
              <i className="ti ti-device-floppy" />
              {saving ? "Saving…" : "Save player stats"}
            </button>
          </div>
        </div>
      )}

      {/* TEAM STATS */}
      {tab === "team-stats" && (
        <div className="card admin-section">
          <div className="admin-section__header">
            <div className="card-title" style={{ margin: 0 }}>
              <i className="ti ti-shield" /> Team stats
            </div>
          </div>
          <p className="admin-hint">
            آمار تجمعی هفته {week} رو وارد کن.
          </p>

          {teams.length === 0 ? (
            <PageLoader label="Loading teams" minHeight={140} />
          ) : (
            <div className="admin-list">
              {teams.map((t) => {
                const s = teamForm[t.id] || {
                  played: 0, wins: 0, draws: 0, losses: 0, goals_for: 0, goals_against: 0,
                };
                const fields = [
                  { field: "played", label: "Played", icon: "ti-calendar" },
                  { field: "wins", label: "Wins", icon: "ti-check" },
                  { field: "draws", label: "Draws", icon: "ti-equal" },
                  { field: "losses", label: "Losses", icon: "ti-x" },
                  { field: "goals_for", label: "Goals for", icon: "ti-ball-football" },
                  { field: "goals_against", label: "Goals against", icon: "ti-target-off" },
                ];
                return (
                  <div key={t.id} className="admin-row">
                    <div className="admin-row__head">
                      <div className="admin-row__name">
                        <span className="dot" /> {t.name}
                      </div>
                    </div>
                    <div className="admin-fields admin-fields--6">
                      {fields.map(({ field, label, icon }) => (
                        <div key={field} className="admin-field">
                          <label>
                            <i className={`ti ${icon}`} /> {label}
                          </label>
                          <input
                            className="admin-input"
                            type="number"
                            min="0"
                            value={s[field] ?? 0}
                            onChange={(e) => handleTeamChange(t.id, field, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="admin-actions">
            <button className="admin-save" onClick={saveTeamStats} disabled={saving}>
              <i className="ti ti-device-floppy" />
              {saving ? "Saving…" : "Save team stats"}
            </button>
          </div>
        </div>
      )}

      {/* AWARDS */}
      {tab === "awards" && (
        <div className="card admin-section">
          <div className="admin-section__header">
            <div className="card-title" style={{ margin: 0 }}>
              <i className="ti ti-trophy" /> Awards — week {week}
            </div>
          </div>

          <div className="awards-grid">
            {AWARD_TYPES.map(([type, label]) => (
              <div key={type} className="award-field">
                <label>{label}</label>
                <select
                  className="admin-input admin-select"
                  value={awardForm[type] || ""}
                  onChange={(e) => setAwardForm((prev) => ({ ...prev, [type]: e.target.value }))}
                >
                  <option value="">— No selection —</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="admin-actions">
            <button className="admin-save" onClick={saveAwards} disabled={saving}>
              <i className="ti ti-trophy" />
              {saving ? "Saving…" : "Save awards"}
            </button>
          </div>
        </div>
      )}

      {/* INVITES */}
      {tab === "invites" && (
        <div className="card admin-section">
          <div className="admin-section__header">
            <div className="card-title" style={{ margin: 0 }}>
              <i className="ti ti-key" /> Invite codes
            </div>
          </div>

          <div className="invite-actions">
            <button className="admin-save" onClick={createPlayerInvite}>
              <i className="ti ti-user-plus" /> Player code
            </button>
            <button className="admin-save admin-save--alt" onClick={createCaptainInvite}>
              <i className="ti ti-crown" /> Captain code
            </button>
          </div>

          {inviteCodes.length === 0 ? (
            <div className="no-stats" style={{ padding: "20px 0" }}>
              <i className="ti ti-key-off no-stats__icon" />
              <div className="no-stats__text">No invite codes yet.</div>
            </div>
          ) : (
            <div className="invite-list">
              {inviteCodes.map((code) => (
                <div key={code.id} className="invite-row">
                  <div className="invite-row__main">
                    <code className="invite-code">{code.code}</code>
                    <div className="invite-meta">
                      <span className={`invite-tag ${code.role}`}>{code.role}</span>
                      <span className={`invite-tag ${code.used ? "used" : "unused"}`}>
                        {code.used ? "USED" : "UNUSED"}
                      </span>
                    </div>
                  </div>
                  <button
                    className="invite-del"
                    onClick={() => removeInvite(code.code)}
                    aria-label="Delete invite"
                  >
                    <i className="ti ti-trash" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
