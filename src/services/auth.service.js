// Authentication-related Firebase calls.
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export const signUp = async (email, password, fullName, role, position = null) => {
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
