// Teams + team weekly stats.
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const getTeams = async () => {
  const snap = await getDocs(collection(db, "teams"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const createTeam = async (name, captainId) => {
  const ref = await addDoc(collection(db, "teams"), {
    name,
    created_at: serverTimestamp(),
  });
  if (captainId) {
    await updateDoc(doc(db, "profiles", captainId), { team_id: ref.id });
  }
  return ref.id;
};

export const renameTeam = (teamId, name) =>
  updateDoc(doc(db, "teams", teamId), { name });

export const assignTeamToCaptain = (captainId, teamId) =>
  updateDoc(doc(db, "profiles", captainId), { team_id: teamId });

// ---------- TEAM WEEKLY STATS ----------
const teamStatsId = (teamId, week, year) => `${teamId}_w${week}_${year}`;

export const getTeamWeeklyStats = async (teamId, week, year) => {
  const snap = await getDoc(
    doc(db, "team_weekly_stats", teamStatsId(teamId, week, year)),
  );
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const getAllTeamWeeklyStats = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "team_weekly_stats"),
      where("week_number", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllTeamStatsSeason = async (year) => {
  const snap = await getDocs(
    query(collection(db, "team_weekly_stats"), where("year", "==", year)),
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
