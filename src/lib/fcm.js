// Firebase Cloud Messaging (web push) integration.
//
// Responsibilities:
//   1. Ask the user for notification permission
//   2. Register the FCM service worker (public/firebase-messaging-sw.js)
//   3. Get the device's FCM token and store it under
//        fcm_tokens/{token} = { user_id, ua, updated_at }
//   4. Subscribe to foreground messages so we still display a toast/native
//      notification while the tab is open.
//
// Requires VITE_FIREBASE_VAPID_KEY in .env (Firebase Console → Project
// Settings → Cloud Messaging → Web Push certificates → Key pair).
import { getMessaging, getToken, onMessage, isSupported } from "firebase/messaging";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from "../services/firebase";
import { showBrowserNotification } from "./browserNotifications";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let _messaging = null;
let _initializedForUid = null;

async function getMessagingSafe() {
  try {
    if (!(await isSupported())) return null;
  } catch {
    return null;
  }
  if (!_messaging) _messaging = getMessaging(app);
  return _messaging;
}

async function registerFcmServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await navigator.serviceWorker.register(
      "/firebase-messaging-sw.js",
      { scope: "/firebase-cloud-messaging-push-scope" },
    );
  } catch (e) {
    console.warn("[fcm] SW register failed", e);
    return null;
  }
}

/**
 * Initialize FCM for the signed-in user. Safe to call repeatedly — it
 * no-ops when the same uid is already initialized in this session.
 */
export async function initFcmForUser(userId) {
  if (!userId) return;
  if (_initializedForUid === userId) return;
  if (!VAPID_KEY) {
    console.warn("[fcm] VITE_FIREBASE_VAPID_KEY is not set — skipping push registration");
    return;
  }
  if (typeof window === "undefined") return;
  if (Notification?.permission !== "granted") return; // wait for the user gesture

  const messaging = await getMessagingSafe();
  if (!messaging) return;

  const swReg = await registerFcmServiceWorker();
  if (!swReg) return;

  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    if (!token) return;

    await setDoc(
      doc(db, "fcm_tokens", token),
      {
        user_id: userId,
        ua: navigator.userAgent || "",
        platform: navigator.platform || "",
        updated_at: serverTimestamp(),
      },
      { merge: true },
    );
    localStorage.setItem("fcm_token", token);
    _initializedForUid = userId;
  } catch (e) {
    console.warn("[fcm] getToken failed", e);
    return;
  }

  // Foreground messages: Chrome does not auto-display these, so we surface
  // them via the existing Notification API path.
  onMessage(messaging, (payload) => {
    const n = payload.notification || {};
    const d = payload.data || {};
    showBrowserNotification({
      title: n.title || d.title || "FutbolStats",
      body: n.body || d.body || "",
      tag: d.tag,
      data: { link: d.link || "/" },
    });
  });
}

/** Remove this device's token (called on sign-out). */
export async function removeFcmTokenForCurrentDevice() {
  const token = localStorage.getItem("fcm_token");
  if (!token) return;
  try { await deleteDoc(doc(db, "fcm_tokens", token)); } catch {}
  localStorage.removeItem("fcm_token");
  _initializedForUid = null;
}
