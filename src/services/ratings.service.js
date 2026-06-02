// Captain ratings.
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

const ratingId = (fromId, toId, week, year) =>
  `${fromId}_to_${toId}_w${week}_${year}`;

export const upsertRating = (fromId, toId, week, year, pass, shoot, def, drib, absent = false) =>
  setDoc(doc(db, "captain_ratings", ratingId(fromId, toId, week, year)), {
    from_captain_id: fromId,
    to_player_id: toId,
    week_number: week,
    year,
    passing: pass,
    shooting: shoot,
    defending: def,
    dribbling: drib,
    absent: !!absent,
    updated_at: serverTimestamp(),
  });

export const getRatingsForPlayer = async (playerId, week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "captain_ratings"),
      where("to_player_id", "==", playerId),
      where("week_number", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.docs.map((d) => d.data());
};

export const getRatingsByCaptain = async (fromId, week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "captain_ratings"),
      where("from_captain_id", "==", fromId),
      where("week_number", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllRatings = async (week = null, year = null) => {
  const q =
    week !== null && year !== null
      ? query(
          collection(db, "captain_ratings"),
          where("week_number", "==", week),
          where("year", "==", year),
        )
      : query(collection(db, "captain_ratings"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};
