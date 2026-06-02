// Invite codes (captain & player).
import {
  collection,
  deleteDoc,
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

export const consumeInviteCode = (code, uid) =>
  updateDoc(doc(db, "invite_codes", code), { used: true, used_by: uid });

export const getInviteCodes = async () => {
  const snap = await getDocs(collection(db, "invite_codes"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const deleteInviteCodeById = (code) =>
  deleteDoc(doc(db, "invite_codes", code));

// ---------- CAPTAIN CODES (legacy) ----------
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
