// Captain ratings — v2 schema (position-based metrics + overall).
// Old v1 docs (passing/shooting/defending/dribbling) are still readable
// via the normalizeRating() helper in utils/ratingSchema.js.

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
import {
  CURRENT_RATING_SCHEMA,
  schemaForSeason,
} from "../utils/seasons";
import {
  computeOverall,
  normalizePosition,
  defaultMetrics,
} from "../utils/positionMetrics";

const ratingId = (fromId, toId, week, year) =>
  `${fromId}_to_${toId}_w${week}_${year}`;

/**
 * Write a v2 rating document.
 *
 *   upsertRating({
 *     fromId, toId, week, year,
 *     position: "MID",
 *     metrics: { m1: 80, m2: 65, m3: 70, m4: 60 },
 *     absent: false,
 *   })
 *
 * NOTE: also mirrors `overall` into legacy passing/shooting/defending/dribbling
 * so any code that hasn't been migrated yet still gets sensible numbers.
 */
export const upsertRating = ({
  fromId,
  toId,
  week,
  year,
  position,
  metrics = defaultMetrics(),
  absent = false,
}) => {
  const pos = normalizePosition(position) || "MID";
  const overall = computeOverall(metrics);
  const payload = {
    from_captain_id: fromId,
    to_player_id: toId,
    week_number: week,
    year,
    season: year,
    schema: schemaForSeason(year) >= 2 ? CURRENT_RATING_SCHEMA : 1,
    position: pos,
    metrics: {
      m1: Number(metrics.m1) || 0,
      m2: Number(metrics.m2) || 0,
      m3: Number(metrics.m3) || 0,
      m4: Number(metrics.m4) || 0,
    },
    overall,
    absent: !!absent,
    // legacy mirror (single value across all 4 — used only by un-migrated readers)
    passing: overall,
    shooting: overall,
    defending: overall,
    dribbling: overall,
    updated_at: serverTimestamp(),
  };
  return setDoc(doc(db, "captain_ratings", ratingId(fromId, toId, week, year)), payload);
};

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
