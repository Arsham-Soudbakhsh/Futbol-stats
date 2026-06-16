import { useEffect, useState } from "react";
import {
  getAllPlayers,
  getWeeklyStats,
  getAwards,
  upsertStats,
  upsertAward,
  upsertMultiAward,
  upsertTeamOfWeekAward,
  getTeamsForWeek,
  getAllTeamWeeklyStats,
  upsertTeamWeeklyStats,
  createInviteCode,
  getInviteCodes,
  deleteInviteCodeById,
  getAllCaptains,
  createTeam,
  assignCaptainToTeamForWeek,
  unassignCaptainForWeek,
  getCaptainTeamMapForWeek,
  bustCache,
  getAllSquadsForWeek,
  renameTeam,
  deleteTeam,
  getWeekAccess,
  setWeekAccess,
} from "../../services";
import { MULTI_WINNER_AWARDS } from "../../utils/points";

/**
 * Single hook that owns every read+write the admin page needs.
 *
 * Teams and captain↔team assignments are PER-WEEK. Switching the week reloads
 * a fresh set of teams (created for that specific week) and a fresh
 * captain→team map, so previous weeks' data never leaks in.
 */
export function useAdminData({ week, year }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]); // teams for the CURRENT week only
  const [captains, setCaptains] = useState([]);
  const [captainTeamMap, setCaptainTeamMap] = useState({}); // captainId -> teamId (this week)
  const [inviteCodes, setInviteCodes] = useState([]);
  const [squads, setSquads] = useState([]);

  const [statsForm, setStatsForm] = useState({});
  const [teamForm, setTeamForm] = useState({});
  const [awardForm, setAwardForm] = useState({});
  const [teamOfWeekForm, setTeamOfWeekForm] = useState(["", "", "", "", ""]);
  const [existingAwards, setExistingAwards] = useState([]);

  const [newTeamName, setNewTeamName] = useState("");
  const [assignMap, setAssignMap] = useState({});
  const [teamNameEdits, setTeamNameEdits] = useState({});

  // ── Week access ──────────────────────────────────────────────────────────
  const [weekOpen, setWeekOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // -- one-time loads (not week-dependent) -----------------------------
  useEffect(() => {
    getAllPlayers().then((list) =>
      setPlayers(list.filter((p) => p.role !== "admin"))
    );
    getInviteCodes().then(setInviteCodes);
    getAllCaptains().then(setCaptains);
  }, []);

  // -- per-week loaders -------------------------------------------------
  // Teams + captain assignments + squads reset every time the week changes.
  useEffect(() => {
    // Clear immediately so the UI never flashes stale data from a prior week.
    setTeams([]);
    setCaptainTeamMap({});
    setAssignMap({});
    setTeamNameEdits({});

    getTeamsForWeek(week, year).then(setTeams);
    getCaptainTeamMapForWeek(week, year).then(setCaptainTeamMap);
    getAllSquadsForWeek(week, year).then(setSquads);
    getWeekAccess(week, year).then((wa) => setWeekOpen(wa?.open === true));

    getAwards(week, year).then((awards) => {
      setExistingAwards(awards);
      const form = {};
      awards.forEach((a) => {
        if (a.award_type === "best_team_week") return;
        if (MULTI_WINNER_AWARDS.has(a.award_type)) {
          form[a.award_type] =
            a.player_ids || (a.player_id ? [a.player_id] : []);
        } else {
          form[a.award_type] = a.player_id || "";
        }
      });
      setAwardForm(form);
      const teamAward = awards.find((a) => a.award_type === "best_team_week");
      setTeamOfWeekForm(
        teamAward?.player_ids
          ? [...teamAward.player_ids, "", "", "", "", ""].slice(0, 5)
          : ["", "", "", "", ""]
      );
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
    if (!teams.length) {
      setTeamForm({});
      return;
    }
    (async () => {
      const allTs = await getAllTeamWeeklyStats(week, year);
      const map = {};
      allTs.forEach((ts) => {
        map[ts.team_id] = {
          played: ts.played ?? 0,
          wins: ts.wins ?? 0,
          draws: ts.draws ?? 0,
          losses: ts.losses ?? 0,
          goals_for: ts.goals_for ?? 0,
          goals_against: ts.goals_against ?? 0,
        };
      });
      setTeamForm(map);
    })();
  }, [week, year, teams]);

  // -- helpers ----------------------------------------------------------
  const handleStatChange = (pid, field, val) =>
    setStatsForm((prev) => ({
      ...prev,
      [pid]: { ...(prev[pid] || {}), [field]: val },
    }));

  const handleTeamChange = (tid, field, val) =>
    setTeamForm((prev) => ({
      ...prev,
      [tid]: { ...(prev[tid] || {}), [field]: val },
    }));

  const reloadInvites = async () => setInviteCodes(await getInviteCodes());

  const reloadWeekScopedData = async () => {
    const [t, c, sq, map] = await Promise.all([
      getTeamsForWeek(week, year),
      getAllCaptains(),
      getAllSquadsForWeek(week, year),
      getCaptainTeamMapForWeek(week, year),
    ]);
    setTeams(t);
    setCaptains(c);
    setSquads(sq);
    setCaptainTeamMap(map);
  };

  // -- save handlers ----------------------------------------------------
  const savePlayerStats = async () => {
    setSaving(true);
    setMsg("");
    try {
      // Parallel writes — 15 players = 1 round-trip wave instead of 15.
      // settled, not all, so we don't end up in the "half saved" state
      // where the first 8 succeed and a single failure aborts the loop.
      const results = await Promise.allSettled(
        Object.entries(statsForm).map(([pid, s]) =>
          upsertStats(pid, week, year, {
            goals: parseInt(s.goals) || 0,
            assists: parseInt(s.assists) || 0,
            clean_sheets: parseInt(s.clean_sheets) || 0,
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) {
        setMsg(`⚠️ Saved ${results.length - failed.length}/${results.length} — ${failed.length} failed.`);
      } else {
        setMsg("✅ Player stats saved!");
      }
      bustCache();
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const saveTeamStats = async () => {
    setSaving(true);
    setMsg("");
    try {
      const results = await Promise.allSettled(
        Object.entries(teamForm).map(([tid, s]) =>
          upsertTeamWeeklyStats(tid, week, year, {
            played: parseInt(s.played) || 0,
            wins: parseInt(s.wins) || 0,
            draws: parseInt(s.draws) || 0,
            losses: parseInt(s.losses) || 0,
            goals_for: parseInt(s.goals_for) || 0,
            goals_against: parseInt(s.goals_against) || 0,
          })
        )
      );
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length) {
        setMsg(`⚠️ Saved ${results.length - failed.length}/${results.length} — ${failed.length} failed.`);
      } else {
        setMsg("✅ Team stats saved!");
      }
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const saveAwards = async () => {
    setSaving(true);
    setMsg("");
    try {
      for (const [type, val] of Object.entries(awardForm)) {
        if (type === "best_team_week") continue;
        if (MULTI_WINNER_AWARDS.has(type)) {
          const ids = (val || []).filter(Boolean);
          if (ids.length > 0) await upsertMultiAward(type, ids, week, year);
        } else {
          if (!val) continue;
          await upsertAward(type, val, week, year);
        }
      }
      const teamIds = teamOfWeekForm.filter(Boolean);
      if (teamIds.length > 0) await upsertTeamOfWeekAward(teamIds, week, year);
      bustCache(); // flush stale data so pages see fresh results
      setExistingAwards(await getAwards(week, year));
      setMsg("✅ Awards saved!");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
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

  const handleCreateTeam = async () => {
    const name = newTeamName.trim();
    if (!name) {
      setMsg("❌ Please enter a team name.");
      return;
    }
    setSaving(true);
    try {
      // Team is scoped to the current week.
      await createTeam(name, null, week, year);
      setNewTeamName("");
      await reloadWeekScopedData();
      setMsg(`✅ Team created (week ${week})!`);
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const handleAssignCaptain = async (captainId) => {
    const teamId = assignMap[captainId];
    setSaving(true);
    try {
      if (!teamId) {
        await unassignCaptainForWeek(captainId, week, year);
        setMsg("✅ Captain removed from this week's team.");
      } else {
        await assignCaptainToTeamForWeek(captainId, teamId, week, year);
        setMsg(`✅ Captain assigned to team (week ${week})!`);
      }
      await reloadWeekScopedData();
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const handleRenameTeam = async (teamId) => {
    const name = (teamNameEdits[teamId] || "").trim();
    if (!name) {
      setMsg("❌ Team name is empty.");
      return;
    }
    setSaving(true);
    try {
      await renameTeam(teamId, name);
      await reloadWeekScopedData();
      setMsg("✅ Team name updated!");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Delete this team (for this week only)?")) return;
    setSaving(true);
    try {
      await deleteTeam(teamId);
      await reloadWeekScopedData();
      setMsg("✅ Team deleted.");
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  // ── Week access toggle ───────────────────────────────────────────────────
  const toggleWeekAccess = async () => {
    setSaving(true);
    setMsg("");
    try {
      const next = !weekOpen;
      await setWeekAccess(week, year, next);
      setWeekOpen(next);
      setMsg(
        next
          ? `✅ Week ${week} is now open — captains can submit their squads.`
          : `✅ Week ${week} is now closed — captains can no longer make changes.`
      );
    } catch (e) {
      setMsg("❌ " + e.message);
    }
    setSaving(false);
  };

  // -- derived ----------------------------------------------------------
  // captain→team via the per-week map (NOT profile.team_id, which is global).
  const captainsPerTeam = Object.values(captainTeamMap).reduce((acc, tid) => {
    if (tid) acc[tid] = (acc[tid] || 0) + 1;
    return acc;
  }, {});
  const teamsReady = teams.filter((t) => (captainsPerTeam[t.id] || 0) >= 1);

  const teamRosters = {};
  teams.forEach((t) => {
    const captainId = Object.keys(captainTeamMap).find(
      (cid) => captainTeamMap[cid] === t.id
    );
    const captain = captainId
      ? captains.find((c) => c.id === captainId) || null
      : null;
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

  return {
    // raw collections
    players,
    teams,
    captains,
    captainTeamMap,
    inviteCodes,
    squads,
    // form state
    statsForm,
    teamForm,
    awardForm,
    setAwardForm,
    teamOfWeekForm,
    setTeamOfWeekForm,
    existingAwards,
    newTeamName,
    setNewTeamName,
    assignMap,
    setAssignMap,
    teamNameEdits,
    setTeamNameEdits,
    // week access
    weekOpen,
    toggleWeekAccess,
    // status
    saving,
    msg,
    setMsg,
    // setters
    handleStatChange,
    handleTeamChange,
    // saves
    savePlayerStats,
    saveTeamStats,
    saveAwards,
    createPlayerInvite,
    createCaptainInvite,
    removeInvite,
    handleCreateTeam,
    handleAssignCaptain,
    handleRenameTeam,
    handleDeleteTeam,
    // derived
    captainsPerTeam,
    teamsReady,
    teamRosters,
  };
}
