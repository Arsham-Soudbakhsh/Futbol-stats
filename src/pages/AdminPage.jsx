import React, { useContext, useEffect, useState } from "react";
import { PageLoader } from "./Loader";
import { WeekContext } from "./DashboardLayout";
import { useAuthStore } from "../store/authStore";
import {
  getAllPlayers,
  getWeeklyStats,
  getAwards,
  upsertStats,
  upsertAward,
  upsertTeamOfWeekAward,
  getTeams,
  getTeamWeeklyStats,
  upsertTeamWeeklyStats,
  createInviteCode,
  getInviteCodes,
  deleteInviteCodeById,
  getAllCaptains,
  createTeam,
  assignTeamToCaptain,
  getAllSquadsForWeek,
  renameTeam,
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
  const [captains, setCaptains] = useState([]);
  const [statsForm, setStatsForm] = useState({});
  const [teamForm, setTeamForm] = useState({});
  const [awardForm, setAwardForm] = useState({});
  const [teamOfWeekForm, setTeamOfWeekForm] = useState(["", "", "", "", ""]); // 5 slots for best_team_week
  const [existingAwards, setExistingAwards] = useState([]); // awards already saved for this week
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [inviteCodes, setInviteCodes] = useState([]);
  const [search, setSearch] = useState("");
  // team-mgmt form
  const [newTeamName, setNewTeamName] = useState("");
  const [assignMap, setAssignMap] = useState({}); // captainId -> teamId
  const [squads, setSquads] = useState([]);        // weekly_squads for current week
  const [teamNameEdits, setTeamNameEdits] = useState({}); // teamId -> edited name

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
    getAllCaptains().then(setCaptains);
  }, []);

  useEffect(() => {
    getAllSquadsForWeek(week, year).then(setSquads);
    // Load existing awards for this week so admin can see who got what
    getAwards(week, year).then((awards) => {
      setExistingAwards(awards);
      // Pre-fill single-player award form
      const form = {};
      awards.forEach((a) => {
        if (a.award_type !== "best_team_week") {
          form[a.award_type] = a.player_id || "";
        }
      });
      setAwardForm(form);
      // Pre-fill best_team_week (multi)
      const teamAward = awards.find((a) => a.award_type === "best_team_week");
      if (teamAward?.player_ids) {
        const filled = [...(teamAward.player_ids), "", "", "", "", ""].slice(0, 5);
        setTeamOfWeekForm(filled);
      } else {
        setTeamOfWeekForm(["", "", "", "", ""]);
      }
    });
  }, [week, year]);

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
      // Save single-player awards (skip best_team_week — handled separately)
      for (const [type, pid] of Object.entries(awardForm)) {
        if (!pid || type === "best_team_week") continue;
        await upsertAward(type, pid, week, year);
      }
      // Save best_team_week (multi-player, up to 5)
      const teamIds = teamOfWeekForm.filter(Boolean);
      if (teamIds.length > 0) {
        await upsertTeamOfWeekAward(teamIds, week, year);
      }
      // Refresh existing awards display
      const updated = await getAwards(week, year);
      setExistingAwards(updated);
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

  const reloadTeamsAndCaptains = async () => {
    const [t, c, sq] = await Promise.all([getTeams(), getAllCaptains(), getAllSquadsForWeek(week, year)]);
    setTeams(t);
    setCaptains(c);
    setSquads(sq);
  };

  const handleRenameTeam = async (teamId) => {
    const name = (teamNameEdits[teamId] || "").trim();
    if (!name) { setMsg("❌ نام تیم خالی است."); return; }
    setSaving(true);
    try {
      await renameTeam(teamId, name);
      await reloadTeamsAndCaptains();
      setMsg("✅ نام تیم بروزرسانی شد!");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const handleCreateTeam = async () => {
    const name = newTeamName.trim();
    if (!name) { setMsg("❌ نام تیم را وارد کنید."); return; }
    setSaving(true);
    try {
      await createTeam(name, null);   // admin creates team without captain
      setNewTeamName("");
      await reloadTeamsAndCaptains();
      setMsg("✅ تیم ساخته شد!");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const handleAssignCaptain = async (captainId) => {
    const teamId = assignMap[captainId];
    if (!teamId) { setMsg("❌ ابتدا یک تیم انتخاب کنید."); return; }
    setSaving(true);
    try {
      await assignTeamToCaptain(captainId, teamId);
      await reloadTeamsAndCaptains();
      setMsg("✅ کاپیتان به تیم اضافه شد!");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  // Count captains per team (one captain per team in the new model)
  const captainsPerTeam = captains.reduce((acc, c) => {
    if (c.team_id) acc[c.team_id] = (acc[c.team_id] || 0) + 1;
    return acc;
  }, {});
  // A team is "ready" once it has at least one captain assigned.
  const teamsReady = teams.filter((t) => (captainsPerTeam[t.id] || 0) >= 1);

  // Build a lookup: teamId -> { captain, squadMembers[] } for the current week.
  const teamRosters = {};
  teams.forEach((t) => {
    const captain = captains.find((c) => c.team_id === t.id) || null;
    let squadMembers = [];
    if (captain) {
      const sq = squads.find((s) => (s.player_ids || [])[0] === captain.id);
      if (sq) {
        squadMembers = (sq.player_ids || [])
          .slice(1)
          .map((id) => players.find((p) => p.id === id))
          .filter(Boolean);
      }
    }
    teamRosters[t.id] = { captain, squadMembers };
  });


  const tabs = [
    { id: "player-stats", label: "Players", icon: "ti-user" },
    { id: "team-stats", label: "Teams", icon: "ti-shield" },
    { id: "awards", label: "Awards", icon: "ti-trophy" },
    { id: "invites", label: "Invites", icon: "ti-key" },
    { id: "teams-mgmt", label: "مدیریت تیم‌ها", icon: "ti-users-group" },
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
              {teamsReady.length === 0 && (
                <div style={{ fontSize: 13, color: "var(--text-muted)", padding: "10px 0" }}>
                  هنوز هیچ تیمی کاپیتان ندارد. ابتدا از تب «مدیریت تیم‌ها» یک کاپیتان به تیم assign کنید.
                </div>
              )}
              {teamsReady.map((t) => {
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
                const roster = teamRosters[t.id] || { captain: null, squadMembers: [] };
                return (
                  <div key={t.id} className="admin-row">
                    <div className="admin-row__head">
                      <div className="admin-row__name">
                        <span className="dot" /> {t.name}
                      </div>
                      <div className="admin-row__role">
                        {roster.captain ? (
                          <>
                            <i className="ti ti-crown" style={{ color: "var(--warning)" }} />{" "}
                            {roster.captain.full_name}
                          </>
                        ) : "بدون کاپیتان"}
                      </div>
                    </div>

                    {(roster.captain || roster.squadMembers.length > 0) && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0 12px" }}>
                        {roster.captain && (
                          <span style={{
                            fontSize: 11, padding: "3px 9px", borderRadius: 999,
                            background: "rgba(214,162,61,.14)", color: "var(--warning)",
                            border: "1px solid color-mix(in oklab, var(--warning) 30%, transparent)"
                          }}>
                            <i className="ti ti-crown" /> {roster.captain.full_name}
                          </span>
                        )}
                        {roster.squadMembers.map((p) => (
                          <span key={p.id} style={{
                            fontSize: 11, padding: "3px 9px", borderRadius: 999,
                            background: "var(--primary-soft)", color: "var(--primary)",
                            border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)"
                          }}>
                            {p.full_name}
                          </span>
                        ))}
                        {!roster.squadMembers.length && (
                          <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>
                            <i className="ti ti-clock" /> Squad هفته {week} هنوز ثبت نشده
                          </span>
                        )}
                      </div>
                    )}

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

          {/* ── Existing awards summary ── */}
          {existingAwards.length > 0 && (
            <div style={{
              marginBottom: 20, padding: "12px 14px", borderRadius: 10,
              background: "var(--bg-secondary)", border: "1px solid var(--border)"
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>
                <i className="ti ti-eye" style={{ marginRight: 5 }} />
                Saved awards this week
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {existingAwards.map((a) => {
                  const label = AWARD_LABELS[a.award_type] || a.award_type;
                  // Multi-player (best_team_week)
                  if (a.award_type === "best_team_week" && a.player_ids?.length) {
                    const names = a.player_ids
                      .map((id) => players.find((p) => p.id === id)?.full_name || id)
                      .filter(Boolean);
                    return (
                      <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 10, padding: "2px 8px", borderRadius: 4, whiteSpace: "nowrap",
                          background: "var(--primary-soft)", color: "var(--primary)",
                          border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
                          fontWeight: 600
                        }}>{label}</span>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {names.map((name, i) => (
                            <span key={i} style={{
                              fontSize: 11, padding: "2px 8px", borderRadius: 4,
                              background: "linear-gradient(135deg,rgba(243,156,18,.15),rgba(230,126,34,.1))",
                              color: "var(--warning)",
                              border: "1px solid color-mix(in oklab, var(--warning) 30%, transparent)",
                              fontWeight: 600
                            }}>
                              <i className="ti ti-shield-star" style={{ fontSize: 9, marginRight: 3 }} />
                              {name}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  // Single-player
                  const playerName = players.find((p) => p.id === a.player_id)?.full_name;
                  if (!playerName) return null;
                  return (
                    <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{
                        fontSize: 10, padding: "2px 8px", borderRadius: 4,
                        background: "var(--primary-soft)", color: "var(--primary)",
                        border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)",
                        fontWeight: 600, whiteSpace: "nowrap"
                      }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text)" }}>
                        <i className="ti ti-user" style={{ fontSize: 10, marginRight: 3, opacity: .6 }} />
                        {playerName}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Single-player awards ── */}
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 10, textTransform: "uppercase", letterSpacing: ".5px" }}>
            Individual awards
          </div>
          <div className="awards-grid">
            {AWARD_TYPES.filter(([type]) => type !== "best_team_week").map(([type, label]) => (
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

          {/* ── Best Team of the Week (5 players) ── */}
          <div style={{
            marginTop: 20, padding: "14px 14px 10px", borderRadius: 10,
            border: "1px solid color-mix(in oklab, var(--warning) 40%, transparent)",
            background: "linear-gradient(135deg,rgba(243,156,18,.07),rgba(230,126,34,.04))"
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--warning)", marginBottom: 12, textTransform: "uppercase", letterSpacing: ".5px" }}>
              <i className="ti ti-shield-star" style={{ marginRight: 5 }} />
              Best Team of the Week — pick 5 players
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 10 }}>
              {teamOfWeekForm.map((pid, i) => (
                <div key={i} className="award-field">
                  <label style={{ color: "var(--warning)" }}>
                    <i className="ti ti-shield" style={{ fontSize: 10 }} /> Player {i + 1}
                  </label>
                  <select
                    className="admin-input admin-select"
                    value={pid}
                    onChange={(e) => {
                      const updated = [...teamOfWeekForm];
                      updated[i] = e.target.value;
                      setTeamOfWeekForm(updated);
                    }}
                  >
                    <option value="">— No selection —</option>
                    {players.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={teamOfWeekForm.includes(p.id) && teamOfWeekForm[i] !== p.id}
                      >
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "var(--text-muted)" }}>
              {teamOfWeekForm.filter(Boolean).length}/5 players selected
            </div>
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

      {/* TEAMS MGMT */}
      {tab === "teams-mgmt" && (
        <div className="card admin-section">
          <div className="admin-section__header">
            <div className="card-title" style={{ margin: 0 }}>
              <i className="ti ti-users-group" /> مدیریت تیم‌ها و کاپیتان‌ها
            </div>
          </div>

          {/* ── ۱. ساخت تیم جدید ── */}
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
            <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
              <i className="ti ti-plus" /> ساخت تیم جدید
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                className="admin-input"
                style={{ flex: 1, minWidth: 200 }}
                type="text"
                placeholder="نام تیم..."
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateTeam()}
              />
              <button className="admin-save" onClick={handleCreateTeam} disabled={saving}>
                <i className="ti ti-plus" /> ساخت تیم
              </button>
            </div>
          </div>

          {/* ── ۲. assign کاپیتان به تیم ── */}
          <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border)" }}>
            <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
              <i className="ti ti-crown" /> assign کاپیتان به تیم
            </div>
            {captains.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>هیچ کاپیتانی ثبت‌نام نکرده.</div>
            ) : (
              <div className="admin-list">
                {captains.map((cap) => {
                  // پیدا کردن squad این کاپیتان برای هفته جاری
                  const capSquad = squads.find(sq => (sq.player_ids || [])[0] === cap.id);
                  const squadMembers = capSquad
                    ? (capSquad.player_ids || []).slice(1).map(id => players.find(p => p.id === id)).filter(Boolean)
                    : [];
                  return (
                    <div key={cap.id} className="admin-row">
                      <div className="admin-row__head">
                        <div className="admin-row__name">
                          <i className="ti ti-crown" style={{ color: "var(--warning)", fontSize: 13 }} /> {cap.full_name}
                        </div>
                        <div className="admin-row__role" style={{ color: cap.team_id ? "var(--success)" : "var(--text-muted)" }}>
                          {cap.team_id
                            ? `✅ ${teams.find(t => t.id === cap.team_id)?.name || cap.team_id}`
                            : "بدون تیم"}
                        </div>
                      </div>

                      {/* squad بازیکنان این کاپیتان */}
                      {squadMembers.length > 0 ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "8px 0 10px" }}>
                          <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>
                            <i className="ti ti-users" /> Squad هفته {week}:
                          </span>
                          {squadMembers.map(p => (
                            <span key={p.id} style={{
                              fontSize: 11, padding: "3px 9px", borderRadius: 999,
                              background: "var(--primary-soft)", color: "var(--primary)",
                              border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)"
                            }}>
                              {p.full_name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 11, color: "var(--text-muted)", margin: "6px 0 8px" }}>
                          <i className="ti ti-clock" /> هنوز squad ثبت نکرده (هفته {week})
                        </div>
                      )}

                      <div className="admin-fields" style={{ alignItems: "flex-end" }}>
                        <div className="admin-field" style={{ flex: 1 }}>
                          <label><i className="ti ti-shield" /> انتخاب تیم</label>
                          <select
                            className="admin-input admin-select"
                            value={assignMap[cap.id] ?? cap.team_id ?? ""}
                            onChange={(e) => setAssignMap(prev => ({ ...prev, [cap.id]: e.target.value }))}
                          >
                            <option value="">— بدون تیم —</option>
                            {teams.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="admin-field" style={{ flexShrink: 0 }}>
                          <button
                            className="admin-save"
                            style={{ padding: "8px 14px" }}
                            onClick={() => handleAssignCaptain(cap.id)}
                            disabled={saving}
                          >
                            <i className="ti ti-check" /> ذخیره
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── ۳. وضعیت تیم‌ها + تغییر نام ── */}
          <div>
            <div className="card-title" style={{ fontSize: 12, marginBottom: 10 }}>
              <i className="ti ti-chart-bar" /> وضعیت تیم‌ها
            </div>
            {teams.length === 0 ? (
              <div style={{ fontSize: 13, color: "var(--text-muted)" }}>هیچ تیمی وجود ندارد.</div>
            ) : (
              <div className="admin-list">
                {teams.map(t => {
                  const count = captainsPerTeam[t.id] || 0;
                  const ready = count >= 1;
                  const teamCaptains = captains.filter(c => c.team_id === t.id);
                  return (
                    <div key={t.id} className="admin-row">
                      <div className="admin-row__head">
                        <div className="admin-row__name">
                          <span className="dot" /> {t.name}
                        </div>
                        <div className="admin-row__role" style={{ color: ready ? "var(--success)" : "var(--text-muted)" }}>
                          {ready ? `✅ کاپیتان: ${teamCaptains.map(c => c.full_name).join("، ")}` : "بدون کاپیتان"}

                        </div>
                      </div>

                      {(() => {
                        const roster = teamRosters[t.id] || { squadMembers: [] };
                        if (!roster.squadMembers.length) return null;
                        return (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0 10px" }}>
                            <span style={{ fontSize: 11, color: "var(--text-muted)", alignSelf: "center" }}>
                              <i className="ti ti-users" /> بازیکنان هفته {week}:
                            </span>
                            {roster.squadMembers.map(p => (
                              <span key={p.id} style={{
                                fontSize: 11, padding: "3px 9px", borderRadius: 999,
                                background: "var(--primary-soft)", color: "var(--primary)",
                                border: "1px solid color-mix(in oklab, var(--primary) 25%, transparent)"
                              }}>{p.full_name}</span>
                            ))}
                          </div>
                        );
                      })()}


                      {/* rename */}
                      <div className="admin-fields" style={{ alignItems: "flex-end" }}>
                        <div className="admin-field" style={{ flex: 1 }}>
                          <label><i className="ti ti-pencil" /> تغییر نام تیم</label>
                          <input
                            className="admin-input"
                            type="text"
                            placeholder={t.name}
                            value={teamNameEdits[t.id] ?? ""}
                            onChange={(e) => setTeamNameEdits(prev => ({ ...prev, [t.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === "Enter" && handleRenameTeam(t.id)}
                          />
                        </div>
                        <div className="admin-field" style={{ flexShrink: 0 }}>
                          <button
                            className="admin-save"
                            style={{ padding: "8px 14px" }}
                            onClick={() => handleRenameTeam(t.id)}
                            disabled={saving || !teamNameEdits[t.id]?.trim()}
                          >
                            <i className="ti ti-device-floppy" /> ذخیره نام
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
