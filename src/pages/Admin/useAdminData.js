import { useEffect, useState } from "react";
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
} from "../../services";

/**
 * Single hook that owns every read+write the admin page needs.
 * Returning a giant object keeps the page itself thin and lets each
 * tab destructure exactly what it cares about.
 */
export function useAdminData({ week, year }) {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [captains, setCaptains] = useState([]);
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

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  // -- initial load -----------------------------------------------------
  useEffect(() => {
    getAllPlayers().then((list) =>
      setPlayers(list.filter((p) => p.role !== "admin")),
    );
    getTeams().then(setTeams);
    getInviteCodes().then(setInviteCodes);
    getAllCaptains().then(setCaptains);
  }, []);

  // -- per-week loaders -------------------------------------------------
  useEffect(() => {
    getAllSquadsForWeek(week, year).then(setSquads);
    getAwards(week, year).then((awards) => {
      setExistingAwards(awards);
      const form = {};
      awards.forEach((a) => {
        if (a.award_type !== "best_team_week") form[a.award_type] = a.player_id || "";
      });
      setAwardForm(form);
      const teamAward = awards.find((a) => a.award_type === "best_team_week");
      setTeamOfWeekForm(
        teamAward?.player_ids
          ? [...teamAward.player_ids, "", "", "", "", ""].slice(0, 5)
          : ["", "", "", "", ""],
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
    if (!teams.length) return;
    (async () => {
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
  const reloadTeamsAndCaptains = async () => {
    const [t, c, sq] = await Promise.all([
      getTeams(),
      getAllCaptains(),
      getAllSquadsForWeek(week, year),
    ]);
    setTeams(t);
    setCaptains(c);
    setSquads(sq);
  };

  // -- save handlers ----------------------------------------------------
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
        if (!pid || type === "best_team_week") continue;
        await upsertAward(type, pid, week, year);
      }
      const teamIds = teamOfWeekForm.filter(Boolean);
      if (teamIds.length > 0) await upsertTeamOfWeekAward(teamIds, week, year);
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
      setMsg("❌ نام تیم را وارد کنید.");
      return;
    }
    setSaving(true);
    try {
      await createTeam(name, null);
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
    if (!teamId) {
      setMsg("❌ ابتدا یک تیم انتخاب کنید.");
      return;
    }
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

  const handleRenameTeam = async (teamId) => {
    const name = (teamNameEdits[teamId] || "").trim();
    if (!name) {
      setMsg("❌ نام تیم خالی است.");
      return;
    }
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

  // -- derived ----------------------------------------------------------
  const captainsPerTeam = captains.reduce((acc, c) => {
    if (c.team_id) acc[c.team_id] = (acc[c.team_id] || 0) + 1;
    return acc;
  }, {});
  const teamsReady = teams.filter((t) => (captainsPerTeam[t.id] || 0) >= 1);

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

  return {
    // raw collections
    players,
    teams,
    captains,
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
    // derived
    captainsPerTeam,
    teamsReady,
    teamRosters,
  };
}
