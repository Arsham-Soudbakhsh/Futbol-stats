// Weekly squads.
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

const squadId = (teamId, week, year) => `${teamId}_w${week}_${year}`;

export const getWeeklySquad = async (teamId, week, year) => {
  const snap = await getDoc(doc(db, "weekly_squads", squadId(teamId, week, year)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

/**
 * Upsert a weekly squad. The 5th arg can be either:
 *   - a `positions` map (legacy: { [playerId]: "GK" | ... })
 *   - an options object: { positions?, locked? }
 * Defaults to locked = true to preserve previous behavior.
 */
export const upsertWeeklySquad = (teamId, week, year, playerIds, optsOrPositions = {}) => {
  const isOptions =
    optsOrPositions &&
    typeof optsOrPositions === "object" &&
    ("locked" in optsOrPositions || "positions" in optsOrPositions);
  const positions = isOptions ? (optsOrPositions.positions || {}) : optsOrPositions;
  const locked = isOptions && "locked" in optsOrPositions ? !!optsOrPositions.locked : true;
  return setDoc(doc(db, "weekly_squads", squadId(teamId, week, year)), {
    team_id: teamId,
    week_number: week,
    year,
    player_ids: playerIds,
    positions,
    locked,
    updated_at: serverTimestamp(),
  });
};

export const getAllSquadsForWeek = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "weekly_squads"),
      where("week_number", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// Captain is always the first entry in player_ids.
export const getSquadByCaptain = async (captainId, week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "weekly_squads"),
      where("week_number", "==", week),
      where("year", "==", year),
    ),
  );
  const docSnap = snap.docs.find((d) => (d.data().player_ids || [])[0] === captainId);
  return docSnap ? { id: docSnap.id, ...docSnap.data() } : null;
};
