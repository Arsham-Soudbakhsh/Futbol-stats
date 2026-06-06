// Weekly access control — admin opens/closes each week for captains.
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const weekAccessId = (week, year) => `${year}_w${week}`;

/**
 * Returns the access document for a given week, or null if it doesn't exist.
 * { open: true/false, week_number, year, updated_at }
 */
export const getWeekAccess = async (week, year) => {
  const snap = await getDoc(
    doc(db, "week_access", weekAccessId(week, year))
  );
  return snap.exists() ? snap.data() : null;
};

/**
 * Admin opens or closes a week for captain data entry.
 * open = true  → captains can submit squads this week
 * open = false → captains see a "week is locked" screen
 */
export const setWeekAccess = (week, year, open) =>
  setDoc(doc(db, "week_access", weekAccessId(week, year)), {
    week_number: week,
    year,
    open,
    updated_at: serverTimestamp(),
  });
