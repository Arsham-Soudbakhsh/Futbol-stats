// Hunt vs Hunter — contract service.
//
// Collections:
//   hunt_weeks/{year_wN}    → { week_number, year, open, opened_by, opened_at, closed_at? }
//   hunt_contracts/{auto}   → see full shape below.
//
// Contract shape:
// {
//   week, year,
//   hunter_id, hunter_name, hunter_pos,
//   hunted_id, hunted_name, hunted_pos,
//   metric: "goals" | "assists" | "ga" | "overall" | "clean_sheets" | "cs_overall",
//   same_position: bool,
//   stake: number,                 // current proposed stake
//   proposed_by: "hunter" | "hunted",
//   history: [{ by, stake, at }],
//   status: "pending" | "accepted" | "rejected" | "cancelled" | "settled",
//   winner_id?: string | null,     // null => draw (hunted wins by rule, see settle)
//   result?: { hunter_value, hunted_value, metric, week, year },
//   hunt_delta?: { [uid]: number },// applied points adjustment per user
//   created_at, updated_at, accepted_at?, settled_at?
// }

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";
import { createNotification } from "./notifications.service";

const weekId = (week, year) => `${year}_w${week}`;

// ───────────────────────── hunt_weeks (admin gate) ─────────────────────────
export const getHuntWeek = async (week, year) => {
  const snap = await getDoc(doc(db, "hunt_weeks", weekId(week, year)));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const subscribeHuntWeek = (week, year, cb) =>
  onSnapshot(doc(db, "hunt_weeks", weekId(week, year)), (s) =>
    cb(s.exists() ? { id: s.id, ...s.data() } : null),
  );

export const setHuntWeekOpen = (week, year, open, adminId) =>
  setDoc(
    doc(db, "hunt_weeks", weekId(week, year)),
    {
      week_number: week,
      year,
      open,
      [open ? "opened_by" : "closed_by"]: adminId || null,
      [open ? "opened_at" : "closed_at"]: serverTimestamp(),
      updated_at: serverTimestamp(),
    },
    { merge: true },
  );

// ───────────────────────── contracts: read ─────────────────────────
export const subscribeContractsForUser = (uid, cb) => {
  if (!uid) return () => {};
  // We need contracts where I'm either hunter OR hunted. Firestore has no OR
  // across fields without composite queries, so we run TWO listeners and
  // merge in memory.
  let hunterRows = [];
  let huntedRows = [];
  const emit = () => {
    const map = new Map();
    [...hunterRows, ...huntedRows].forEach((r) => map.set(r.id, r));
    cb([...map.values()].sort((a, b) => {
      const tb = b.updated_at?.toMillis?.() || 0;
      const ta = a.updated_at?.toMillis?.() || 0;
      return tb - ta;
    }));
  };
  const u1 = onSnapshot(
    query(collection(db, "hunt_contracts"), where("hunter_id", "==", uid)),
    (s) => { hunterRows = s.docs.map((d) => ({ id: d.id, ...d.data() })); emit(); },
  );
  const u2 = onSnapshot(
    query(collection(db, "hunt_contracts"), where("hunted_id", "==", uid)),
    (s) => { huntedRows = s.docs.map((d) => ({ id: d.id, ...d.data() })); emit(); },
  );
  return () => { u1(); u2(); };
};

export const getContractsForWeek = async (week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "hunt_contracts"),
      where("week", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const countSentByHunterThisWeek = async (uid, week, year) => {
  const snap = await getDocs(
    query(
      collection(db, "hunt_contracts"),
      where("hunter_id", "==", uid),
      where("week", "==", week),
      where("year", "==", year),
    ),
  );
  return snap.size;
};

// ───────────────────────── contracts: write ─────────────────────────
export const MAX_CONTRACTS_PER_WEEK = 2;

export const sendContract = async ({
  hunter, hunted, week, year, metric, stake,
}) => {
  if (!hunter?.id || !hunted?.id) throw new Error("Missing participants");
  if (hunter.id === hunted.id) throw new Error("Cannot hunt yourself");
  if (!Number.isFinite(stake) || stake <= 0) throw new Error("Stake must be > 0");

  // Gate: week must be open
  const wk = await getHuntWeek(week, year);
  if (!wk?.open) throw new Error("Hunt week is not open");

  // Slot check
  const used = await countSentByHunterThisWeek(hunter.id, week, year);
  if (used >= MAX_CONTRACTS_PER_WEEK) {
    throw new Error(`You have used your ${MAX_CONTRACTS_PER_WEEK} requests for this week`);
  }

  const samePosition =
    !!hunter.position && !!hunted.position &&
    String(hunter.position).toUpperCase() === String(hunted.position).toUpperCase();

  const ref = await addDoc(collection(db, "hunt_contracts"), {
    week, year,
    hunter_id: hunter.id,
    hunter_name: hunter.full_name || hunter.name || "",
    hunter_pos: hunter.position || null,
    hunted_id: hunted.id,
    hunted_name: hunted.full_name || hunted.name || "",
    hunted_pos: hunted.position || null,
    metric,
    same_position: samePosition,
    stake,
    proposed_by: "hunter",
    history: [{ by: "hunter", stake, at: Date.now() }],
    status: "pending",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await createNotification({
    user_id: hunted.id,
    title: "🎯 Hunt vs Hunter",
    body: `${hunter.full_name || "A player"} hunted you. Accept? (stake: ${stake})`,
    type: "hunt_request",
    link: "/hunt",
    week, year,
  });
  return ref.id;
};

const ensureParticipant = (contract, uid, who) => {
  const expected = who === "hunter" ? contract.hunter_id : contract.hunted_id;
  if (uid !== expected) throw new Error("Not allowed");
};

export const acceptContract = (id, uid) =>
  runTransaction(db, async (tx) => {
    const ref = doc(db, "hunt_contracts", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Not found");
    const c = snap.data();
    if (c.status !== "pending") throw new Error("Not pending");
    // Whoever didn't propose last can accept.
    const acceptor = c.proposed_by === "hunter" ? "hunted" : "hunter";
    ensureParticipant(c, uid, acceptor);
    tx.update(ref, {
      status: "accepted",
      accepted_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    // notify the other side
    const other = acceptor === "hunter" ? c.hunted_id : c.hunter_id;
    const otherName = acceptor === "hunter" ? c.hunted_name : c.hunter_name;
    const meName = acceptor === "hunter" ? c.hunter_name : c.hunted_name;
    createNotification({
      user_id: other,
      title: "✅ Contract accepted",
      body: `${meName || "Opponent"} accepted your contract at stake ${c.stake}.`,
      type: "hunt_accepted",
      link: "/hunt",
      week: c.week, year: c.year,
    }).catch(() => {});
    // also tell acceptor for record
    createNotification({
      user_id: uid,
      title: "✅ Contract started",
      body: `Challenge with ${otherName} on ${c.metric} started at stake ${c.stake}.`,
      type: "hunt_accepted",
      link: "/hunt",
      week: c.week, year: c.year,
    }).catch(() => {});
  });

export const counterContract = (id, uid, newStake) =>
  runTransaction(db, async (tx) => {
    const ref = doc(db, "hunt_contracts", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Not found");
    const c = snap.data();
    if (c.status !== "pending") throw new Error("Not pending");
    if (!Number.isFinite(newStake) || newStake <= c.stake) {
      throw new Error("Counter offer must be higher than the current stake");
    }
    // The party that DIDN'T last propose is the one allowed to counter.
    const counterer = c.proposed_by === "hunter" ? "hunted" : "hunter";
    ensureParticipant(c, uid, counterer);
    tx.update(ref, {
      stake: newStake,
      proposed_by: counterer,
      history: [...(c.history || []), { by: counterer, stake: newStake, at: Date.now() }],
      updated_at: serverTimestamp(),
    });
    const other = counterer === "hunter" ? c.hunted_id : c.hunter_id;
    const meName = counterer === "hunter" ? c.hunter_name : c.hunted_name;
    createNotification({
      user_id: other,
      title: "🔁 Counter offer",
      body: `${meName || "Opponent"} raised the stake to ${newStake}. Accept or cancel.`,
      type: "hunt_counter",
      link: "/hunt",
      week: c.week, year: c.year,
    }).catch(() => {});
  });

export const rejectContract = (id, uid) =>
  runTransaction(db, async (tx) => {
    const ref = doc(db, "hunt_contracts", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Not found");
    const c = snap.data();
    if (c.status !== "pending") throw new Error("Not pending");
    // Only the party who must respond can reject (= the one who didn't propose last)
    const rejecter = c.proposed_by === "hunter" ? "hunted" : "hunter";
    ensureParticipant(c, uid, rejecter);
    tx.update(ref, {
      status: "rejected",
      updated_at: serverTimestamp(),
    });
    const other = rejecter === "hunter" ? c.hunted_id : c.hunter_id;
    const meName = rejecter === "hunter" ? c.hunter_name : c.hunted_name;
    createNotification({
      user_id: other,
      title: "❌ Contract rejected",
      body: `${meName || "Opponent"} rejected your request.`,
      type: "hunt_rejected",
      link: "/hunt",
      week: c.week, year: c.year,
    }).catch(() => {});
  });

export const cancelContract = (id, uid) =>
  runTransaction(db, async (tx) => {
    const ref = doc(db, "hunt_contracts", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Not found");
    const c = snap.data();
    if (c.status !== "pending") throw new Error("Not pending");
    // The party who proposed last can cancel their own offer.
    const canceller = c.proposed_by; // "hunter" | "hunted"
    ensureParticipant(c, uid, canceller);
    tx.update(ref, {
      status: "cancelled",
      updated_at: serverTimestamp(),
    });
    const other = canceller === "hunter" ? c.hunted_id : c.hunter_id;
    const meName = canceller === "hunter" ? c.hunter_name : c.hunted_name;
    createNotification({
      user_id: other,
      title: "🚫 Contract cancelled",
      body: `${meName || "Opponent"} cancelled the offer.`,
      type: "hunt_cancelled",
      link: "/hunt",
      week: c.week, year: c.year,
    }).catch(() => {});
  });

// ───────────────────────── settlement ─────────────────────────
// Returns { hunter_value, hunted_value, winnerId } where winnerId may be
// either hunter_id, hunted_id, or null. By rule: ties → hunted wins.
const evalMetric = async ({ contract }) => {
  const { metric, week, year, hunter_id, hunted_id } = contract;
  const { getPlayerStats } = await import("./stats.service");
  const { getAllRatings } = await import("./ratings.service");

  const [hStats, tStats] = await Promise.all([
    getPlayerStats(hunter_id, week, year),
    getPlayerStats(hunted_id, week, year),
  ]);
  let hVal = 0, tVal = 0;
  if (metric === "goals") {
    hVal = hStats?.goals || 0; tVal = tStats?.goals || 0;
  } else if (metric === "assists") {
    hVal = hStats?.assists || 0; tVal = tStats?.assists || 0;
  } else if (metric === "ga") {
    hVal = (hStats?.goals || 0) + (hStats?.assists || 0);
    tVal = (tStats?.goals || 0) + (tStats?.assists || 0);
  } else if (metric === "clean_sheets") {
    hVal = hStats?.clean_sheets || 0; tVal = tStats?.clean_sheets || 0;
  } else if (metric === "overall" || metric === "cs_overall") {
    // Use weekly captain ratings → overall.
    const { avgRatings } = await import("../utils/points");
    const all = await getAllRatings(week, year);
    const hRatings = all.filter((r) => r.player_id === hunter_id);
    const tRatings = all.filter((r) => r.player_id === hunted_id);
    hVal = avgRatings(hRatings, contract.hunter_pos).overall || 0;
    tVal = avgRatings(tRatings, contract.hunted_pos).overall || 0;
    if (metric === "cs_overall") {
      // Combined for goalkeepers: overall * 10 + clean_sheets weight
      hVal = hVal + (hStats?.clean_sheets || 0) * 5;
      tVal = tVal + (tStats?.clean_sheets || 0) * 5;
    }
  }
  let winnerId = null;
  if (hVal > tVal) winnerId = hunter_id;
  else if (tVal > hVal) winnerId = hunted_id;
  else winnerId = hunted_id; // tie → hunted wins (per rule)
  return { hVal, tVal, winnerId };
};

export const settleContract = (id) =>
  runTransaction(db, async (tx) => {
    const ref = doc(db, "hunt_contracts", id);
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new Error("Not found");
    const c = snap.data();
    if (c.status !== "accepted") throw new Error("Not accepted yet");
    const { hVal, tVal, winnerId } = await evalMetric({ contract: c });
    const loserId = winnerId === c.hunter_id ? c.hunted_id : c.hunter_id;
    const delta = c.stake;
    tx.update(ref, {
      status: "settled",
      winner_id: winnerId,
      result: { hunter_value: hVal, hunted_value: tVal, metric: c.metric, week: c.week, year: c.year },
      hunt_delta: { [winnerId]: +delta, [loserId]: -delta },
      settled_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    const winnerName = winnerId === c.hunter_id ? c.hunter_name : c.hunted_name;
    const loserName  = winnerId === c.hunter_id ? c.hunted_name : c.hunter_name;
    createNotification({
      user_id: winnerId,
      title: "🏆 Hunt won",
      body: `You beat ${loserName} on ${c.metric}. +${delta} points.`,
      type: "hunt_settled",
      link: "/hunt",
      week: c.week, year: c.year,
    }).catch(() => {});
    createNotification({
      user_id: loserId,
      title: "💀 Hunt lost",
      body: `${winnerName} beat you on ${c.metric}. -${delta} points.`,
      type: "hunt_settled",
      link: "/hunt",
      week: c.week, year: c.year,
    }).catch(() => {});
  });

export const settleAllForWeek = async (week, year) => {
  const list = await getContractsForWeek(week, year);
  const todo = list.filter((c) => c.status === "accepted");
  for (const c of todo) {
    try { await settleContract(c.id); }
    catch (e) { console.warn("settle failed", c.id, e); }
  }
  return todo.length;
};

// ───────────────────────── points integration ─────────────────────────
// Sum of all settled hunt_delta entries for a user across the season.
export const getHuntDeltaForUser = async (uid, year = null) => {
  const map = await getAllHuntDeltas(year);
  return map[uid] || 0;
};

// Bulk: returns { [uid]: totalDelta } for all settled contracts in the year.
// One query → safe for the Points page.
export const getAllHuntDeltas = async (year = null) => {
  const base = collection(db, "hunt_contracts");
  const q1 = year != null
    ? query(base, where("status", "==", "settled"), where("year", "==", year))
    : query(base, where("status", "==", "settled"));
  const snap = await getDocs(q1);
  const totals = {};
  snap.docs.forEach((d) => {
    const delta = d.data()?.hunt_delta || {};
    Object.entries(delta).forEach(([uid, v]) => {
      if (Number.isFinite(v)) totals[uid] = (totals[uid] || 0) + v;
    });
  });
  return totals;
};

