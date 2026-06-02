// Profile / player CRUD.
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "./firebase";

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

// Captain helpers.
export const getAllCaptains = async () => {
  const snap = await getDocs(
    query(collection(db, "profiles"), where("role", "==", "captain")),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
};

export const getCaptainsWithoutTeam = async () => {
  const snap = await getDocs(
    query(collection(db, "profiles"), where("role", "==", "captain")),
  );
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => !p.team_id);
};
