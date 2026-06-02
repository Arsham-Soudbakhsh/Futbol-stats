// Awards.
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const getAwards = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "awards"),
      where("week_number", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllAwards = async () => {
  const snap = await getDocs(collection(db, "awards"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Single-player award (for awards where only 1 winner is allowed).
export const upsertAward = (awardType, playerId, week, year) =>
  setDoc(doc(db, "awards", `${awardType}_w${week}_${year}`), {
    award_type: awardType,
    player_id: playerId,
    week_number: week,
    year,
    updated_at: serverTimestamp(),
  });

// BUG FIX: Multi-player award (top_scorer_week, top_assister_week, best_ga_week, most_cleansheets).
// Stores an array of player_ids under a single doc per award type per week.
export const upsertMultiAward = (awardType, playerIds, week, year) => {
  const ids = (playerIds || []).filter(Boolean);
  return setDoc(doc(db, "awards", `${awardType}_w${week}_${year}`), {
    award_type: awardType,
    player_ids: ids,
    player_id: ids[0] || null, // backwards compat for displays that use player_id
    week_number: week,
    year,
    updated_at: serverTimestamp(),
  });
};

// Multi-player team-of-the-week award.
export const upsertTeamOfWeekAward = async (playerIds, week, year) => {
  const ids = (playerIds || []).filter(Boolean).slice(0, 5);
  return setDoc(doc(db, "awards", `best_team_week_w${week}_${year}`), {
    award_type: "best_team_week",
    player_ids: ids,
    player_id: ids[0] || null, // backwards compat
    week_number: week,
    year,
    updated_at: serverTimestamp(),
  });
};
