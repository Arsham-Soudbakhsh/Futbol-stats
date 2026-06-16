// Notifications service.
//
// Collection: `notifications`
//   { user_id, title, body, type, link, week, year,
//     read, created_at }
//
// Types:
//   - "rating_received"  → a captain rated this user
//   - "rating_visible"   → all captains have submitted for the week
//   - "broadcast"        → admin announcement
//
// Submissions tracker (used to know when "all captains have rated"):
// Collection: `rating_submissions` doc id `${captainId}_w${week}_${year}`
//   { captain_id, week_number, year, submitted_at }
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

// ── CREATE ──────────────────────────────────────────────────────────────────
export const createNotification = async ({
  user_id,
  title,
  body,
  type = "info",
  link = null,
  week = null,
  year = null,
}) => {
  if (!user_id || !title) return null;
  const ref = doc(collection(db, "notifications"));
  await setDoc(ref, {
    user_id,
    title,
    body: body || "",
    type,
    link,
    week,
    year,
    read: false,
    created_at: serverTimestamp(),
  });
  return ref.id;
};

export const createNotificationsBatch = async (items = []) => {
  if (!items.length) return 0;
  // Firestore batch limit is 500.
  let count = 0;
  for (let i = 0; i < items.length; i += 450) {
    const slice = items.slice(i, i + 450);
    const batch = writeBatch(db);
    for (const n of slice) {
      if (!n.user_id || !n.title) continue;
      const ref = doc(collection(db, "notifications"));
      batch.set(ref, {
        user_id: n.user_id,
        title: n.title,
        body: n.body || "",
        type: n.type || "info",
        link: n.link || null,
        week: n.week ?? null,
        year: n.year ?? null,
        read: false,
        created_at: serverTimestamp(),
      });
      count++;
    }
    await batch.commit();
  }
  return count;
};

// ── READ ────────────────────────────────────────────────────────────────────
export const getNotificationsForUser = async (userId, max = 50) => {
  const snap = await getDocs(
    query(
      collection(db, "notifications"),
      where("user_id", "==", userId),
      orderBy("created_at", "desc"),
      limit(max),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

/**
 * Realtime listener. Returns an unsubscribe function.
 */
export const subscribeUserNotifications = (userId, onChange, onNew) => {
  if (!userId) return () => {};
  const q = query(
    collection(db, "notifications"),
    where("user_id", "==", userId),
    orderBy("created_at", "desc"),
    limit(50),
  );
  let first = true;
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    onChange?.(list);
    if (first) {
      first = false;
      return;
    }
    if (typeof onNew === "function") {
      snap.docChanges().forEach((change) => {
        if (change.type === "added") {
          onNew({ id: change.doc.id, ...change.doc.data() });
        }
      });
    }
  });
};

// ── UPDATE ──────────────────────────────────────────────────────────────────
export const markNotificationRead = (id) =>
  updateDoc(doc(db, "notifications", id), { read: true });

export const markAllNotificationsRead = async (userId) => {
  const snap = await getDocs(
    query(
      collection(db, "notifications"),
      where("user_id", "==", userId),
      where("read", "==", false),
    ),
  );
  if (snap.empty) return 0;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true }));
  await batch.commit();
  return snap.size;
};

// ── DELETE ──────────────────────────────────────────────────────────────────
export const deleteNotification = (id) =>
  deleteDoc(doc(db, "notifications", id));

export const deleteAllReadNotifications = async (userId) => {
  const snap = await getDocs(
    query(
      collection(db, "notifications"),
      where("user_id", "==", userId),
      where("read", "==", true),
    ),
  );
  if (snap.empty) return 0;
  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
};

// ── RATING SUBMISSION TRACKER ───────────────────────────────────────────────
const submissionId = (captainId, week, year) =>
  `${captainId}_w${week}_${year}`;

export const markRatingSubmission = (captainId, week, year) =>
  setDoc(doc(db, "rating_submissions", submissionId(captainId, week, year)), {
    captain_id: captainId,
    week_number: week,
    year,
    submitted_at: serverTimestamp(),
  });

export const getRatingSubmissions = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "rating_submissions"),
      where("week_number", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.docs.map((d) => d.data());
};

export const hasVisibilityNotificationBeenSent = async (week, year) => {
  const id = `visibility_w${week}_${year}`;
  const snap = await getDoc(doc(db, "notification_flags", id));
  return snap.exists();
};

export const markVisibilityNotificationSent = (week, year) =>
  setDoc(doc(db, "notification_flags", `visibility_w${week}_${year}`), {
    type: "visibility",
    week_number: week,
    year,
    sent_at: serverTimestamp(),
  });

/**
 * Atomically claim the right to send the "all captains submitted" broadcast.
 * Uses a Firestore transaction so only ONE caller wins, even if multiple
 * captains submit ratings at the exact same time (fixes the broadcast race).
 *
 * Returns true if THIS caller should send the broadcast, false otherwise.
 */
export const claimVisibilityBroadcast = async (week, year) => {
  const id = `visibility_w${week}_${year}`;
  const ref = doc(db, "notification_flags", id);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) return false; // someone else already claimed
      tx.set(ref, {
        type: "visibility",
        week_number: week,
        year,
        sent_at: serverTimestamp(),
      });
      return true;
    });
  } catch (e) {
    console.warn("claimVisibilityBroadcast tx failed", e);
    return false;
  }
};

/* ── EXPECTED CAPTAIN COUNT (LIVE) ─────────────────────────────────────────
 * Previously this pinned the captain count on the first submit, which could
 * lock in a wrong number if admin added/removed captains right before the
 * first submission. We now always read the LIVE count of currently-assigned
 * captains for the week. Combined with claimVisibilityBroadcast()'s atomic
 * flag, the broadcast still fires exactly once. */
export const getOrCreateExpectedCaptainCount = async (week, year) => {
  const { getCaptainTeamMapForWeek } = await import("./teams.service");
  const map = await getCaptainTeamMapForWeek(week, year);
  return Object.keys(map || {}).length;
};

/* ── AUDIT LOG ──────────────────────────────────────────────────────────────
 * Append-only audit trail for admin / captain actions.
 * Best-effort; failures are swallowed by callers. */
export const logAuditEvent = ({ actor_id, actor_name, action, target, meta = {} }) => {
  const ref = doc(collection(db, "audit_log"));
  return setDoc(ref, {
    actor_id: actor_id || null,
    actor_name: actor_name || null,
    action: action || "unknown",
    target: target || null,
    meta,
    created_at: serverTimestamp(),
  });
};

