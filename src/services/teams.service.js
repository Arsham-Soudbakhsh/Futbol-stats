// Teams + team weekly stats.
// Teams are SCOPED PER WEEK: each team document carries week_number + year.
// Captain↔team assignment is also per week (collection: captain_team_weekly).
import {
  addDoc,
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ── Teams ────────────────────────────────────────────────────────────────────

// Returns ALL teams across all weeks (legacy callers / season views).
export const getTeams = async () => {
  const snap = await getDocs(collection(db, "teams"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Returns ONLY teams created for a specific week.
export const getTeamsForWeek = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "teams"),
      where("week_number", "==", week),
      where("year", "==", year)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getTeamById = async (teamId) => {
  const snap = await getDoc(doc(db, "teams", teamId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

// Creates a team scoped to the given week. captainId is intentionally NOT
// written onto profile.team_id any more (that field is global and would leak
// across weeks). Use assignCaptainToTeamForWeek for assignment.
export const createTeam = async (name, _captainIdIgnored, week, year) => {
  if (week == null || year == null) {
    throw new Error("createTeam: week and year are required");
  }
  const ref = await addDoc(collection(db, "teams"), {
    name,
    name_confirmed: false,
    week_number: week,
    year,
    created_at: serverTimestamp(),
  });
  return ref.id;
};

export const renameTeam = (teamId, name) =>
  updateDoc(doc(db, "teams", teamId), { name });

export const confirmTeamName = (teamId, name) =>
  updateDoc(doc(db, "teams", teamId), {
    name,
    name_confirmed: true,
  });

export const deleteTeam = (teamId) => deleteDoc(doc(db, "teams", teamId));

// ── Captain ↔ Team (per week) ────────────────────────────────────────────────
const captainAssignId = (captainId, week, year) =>
  `${captainId}_w${week}_${year}`;

export const assignCaptainToTeamForWeek = (captainId, teamId, week, year) =>
  setDoc(doc(db, "captain_team_weekly", captainAssignId(captainId, week, year)), {
    captain_id: captainId,
    team_id: teamId,
    week_number: week,
    year,
    updated_at: serverTimestamp(),
  });

export const unassignCaptainForWeek = (captainId, week, year) =>
  deleteDoc(doc(db, "captain_team_weekly", captainAssignId(captainId, week, year)));

export const getCaptainTeamForWeek = async (captainId, week, year) => {
  const snap = await getDoc(
    doc(db, "captain_team_weekly", captainAssignId(captainId, week, year))
  );
  return snap.exists() ? snap.data().team_id || null : null;
};

// Returns { [captainId]: teamId } for the given week.
export const getCaptainTeamMapForWeek = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "captain_team_weekly"),
      where("week_number", "==", week),
      where("year", "==", year)
    )
  );
  const map = {};
  snap.docs.forEach((d) => {
    const data = d.data();
    if (data.captain_id && data.team_id) map[data.captain_id] = data.team_id;
  });
  return map;
};

// Legacy alias: kept so older imports don't break. Prefer the per-week version.
export const assignTeamToCaptain = (captainId, teamId) =>
  updateDoc(doc(db, "profiles", captainId), { team_id: teamId });

// ── Team weekly stats ────────────────────────────────────────────────────────
const teamStatsId = (teamId, week, year) => `${teamId}_w${week}_${year}`;

export const getTeamWeeklyStats = async (teamId, week, year) => {
  const snap = await getDoc(
    doc(db, "team_weekly_stats", teamStatsId(teamId, week, year))
  );
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllTeamWeeklyStats = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "team_weekly_stats"),
      where("week_number", "==", week),
      where("year", "==", year)
    )
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllTeamStatsSeason = async (year) => {
  const snap = await getDocs(
    query(collection(db, "team_weekly_stats"), where("year", "==", year))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const upsertTeamWeeklyStats = (teamId, week, year, stats) =>
  setDoc(doc(db, "team_weekly_stats", teamStatsId(teamId, week, year)), {
    team_id: teamId,
    week_number: week,
    year,
    played: stats.played || 0,
    wins: stats.wins || 0,
    draws: stats.draws || 0,
    losses: stats.losses || 0,
    goals_for: stats.goals_for || 0,
    goals_against: stats.goals_against || 0,
    updated_at: serverTimestamp(),
  });
