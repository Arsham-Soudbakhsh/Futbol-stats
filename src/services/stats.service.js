// Weekly player stats (goals / assists / clean sheets).
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const statsId = (playerId, week, year) => `${playerId}_w${week}_${year}`;

export const getPlayerStats = async (playerId, week, year) => {
  const snap = await getDoc(doc(db, "weekly_stats", statsId(playerId, week, year)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const upsertStats = (playerId, week, year, stats) =>
  setDoc(doc(db, "weekly_stats", statsId(playerId, week, year)), {
    player_id: playerId,
    week_number: week,
    year,
    goals: stats.goals || 0,
    assists: stats.assists || 0,
    clean_sheets: stats.clean_sheets || 0,
    updated_at: serverTimestamp(),
  });

export const getWeeklyStats = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "weekly_stats"),
      where("week_number", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllStats = async () => {
  const snap = await getDocs(collection(db, "weekly_stats"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
