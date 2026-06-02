// Firebase initialization — single source of truth for the app instance.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyADaKl0wLMwWgPoVD0lyqOEneU0FwVGQWI",
  authDomain: "footballstats-44792.firebaseapp.com",
  projectId: "footballstats-44792",
  storageBucket: "footballstats-44792.firebasestorage.app",
  messagingSenderId: "462789823625",
  appId: "1:462789823625:web:c5315feb5bbfec0638ca58",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
