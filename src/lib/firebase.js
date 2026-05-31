import { initializeApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADaKl0wLMwWgPoVD0lyqOEneU0FwVGQWI",
  authDomain: "footballstats-44792.firebaseapp.com",
  projectId: "footballstats-44792",
  storageBucket: "footballstats-44792.firebasestorage.app",
  messagingSenderId: "462789823625",
  appId: "1:462789823625:web:c5315feb5bbfec0638ca58",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ---------- AUTH ----------
export const signUp = async (
  email,
  password,
  fullName,
  role,
  position = null,
) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  await setDoc(doc(db, "profiles", cred.user.uid), {
    full_name: fullName,
    role,
    position,
    team_id: null,
    avatar_url: null,
    created_at: serverTimestamp(),
  });
  await cred.user.reload();
  return cred.user;
};

export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export const signOut = () => fbSignOut(auth);

export const onAuth = (cb) => onAuthStateChanged(auth, cb);

// ---------- PROFILE ----------
export const getProfile = async (uid) => {
  const snap = await getDoc(doc(db, "profiles", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const updateProfile = (uid, data) =>
  updateDoc(doc(db, "profiles", uid), data);

export const getAllPlayers = async () => {
  const snap = await getDocs(
    query(collection(db, "profiles"), where("role", "!=", "admin")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getAllProfiles = async () => {
  const snap = await getDocs(collection(db, "profiles"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ---------- CAPTAIN CODES ----------
export const verifyCaptainCode = async (code) => {
  const snap = await getDocs(
    query(collection(db, "captain_codes"), where("code", "==", code)),
  );
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
};

export const createCaptainCode = (code, label) =>
  setDoc(doc(db, "captain_codes", code), {
    code,
    label,
    created_at: serverTimestamp(),
  });

// ---------- TEAMS ----------
export const getTeams = async () => {
  const snap = await getDocs(collection(db, "teams"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

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

// ---------- WEEKLY SQUAD ----------
const squadId = (teamId, week, year) => `${teamId}_w${week}_${year}`;

export const getWeeklySquad = async (teamId, week, year) => {
  const snap = await getDoc(
    doc(db, "weekly_squads", squadId(teamId, week, year)),
  );
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
};

export const upsertWeeklySquad = (
  teamId,
  week,
  year,
  playerIds,
  positions = {},
) =>
  setDoc(doc(db, "weekly_squads", squadId(teamId, week, year)), {
    team_id: teamId,
    week_number: week,
    year,
    player_ids: playerIds,
    positions,
    locked: true,
    updated_at: serverTimestamp(),
  });

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

// ---------- WEEKLY STATS ----------
const statsId = (playerId, week, year) => `${playerId}_w${week}_${year}`;

export const getPlayerStats = async (playerId, week, year) => {
  const snap = await getDoc(
    doc(db, "weekly_stats", statsId(playerId, week, year)),
  );
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

// ---------- AWARDS ----------
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

export const upsertAward = (awardType, playerId, week, year) =>
  setDoc(doc(db, "awards", `${awardType}_w${week}_${year}`), {
    award_type: awardType,
    player_id: playerId,
    week_number: week,
    year,
    updated_at: serverTimestamp(),
  });

// ---------- CAPTAIN RATINGS ----------
const ratingId = (fromId, toId, week, year) =>
  `${fromId}_to_${toId}_w${week}_${year}`;

// NOTE: now also persists `absent` so the UI can restore the "Absent" toggle
// after a refresh. Old callers that didn't pass `absent` keep working.
export const upsertRating = (
  fromId,
  toId,
  week,
  year,
  pass,
  shoot,
  def,
  drib,
  absent = false,
) =>
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

// NEW: load all ratings submitted BY a given captain for a given week/year.
// Used by CaptainPage to rehydrate the slider state after a refresh, which
// is what fixes the "save then refresh resets everything" bug.
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
  let q;

  if (week !== null && year !== null) {
    q = query(
      collection(db, "captain_ratings"),
      where("week_number", "==", week),
      where("year", "==", year),
    );
  } else {
    q = query(collection(db, "captain_ratings"));
  }

  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

// ---------- INVITE CODES ----------
const randomPart = () =>
  Math.random().toString(36).substring(2, 6).toUpperCase();

export const generateInviteCode = (role) => {
  const prefix = role === "captain" ? "CAP" : "PLY";
  return `${prefix}-${randomPart()}-${randomPart()}`;
};

export const createInviteCode = async (role) => {
  const code = generateInviteCode(role);

  await setDoc(doc(db, "invite_codes", code), {
    code,
    role,
    used: false,
    used_by: null,
    created_at: serverTimestamp(),
  });

  return code;
};

export const verifyInviteCode = async (code) => {
  const snap = await getDoc(doc(db, "invite_codes", code));

  if (!snap.exists()) return null;

  const data = snap.data();

  if (data.used) return null;

  return { id: snap.id, ...data };
};

export const consumeInviteCode = async (code, uid) => {
  await updateDoc(doc(db, "invite_codes", code), {
    used: true,
    used_by: uid,
  });
};

export const getInviteCodes = async () => {
  const snap = await getDocs(collection(db, "invite_codes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteInviteCodeById = async (code) => {
  await deleteDoc(doc(db, "invite_codes", code));
};