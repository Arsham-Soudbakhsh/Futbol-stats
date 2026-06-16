// Cloud Functions for FutbolStats
//
// Trigger: any new doc in `notifications/{notifId}`.
// Action : look up every fcm_tokens doc with the matching user_id and send
//          an FCM push so the target device gets a system notification even
//          when the app is fully closed.
//
// Deploy:
//   cd functions && npm install
//   firebase deploy --only functions
//
// Requires Blaze plan (pay-as-you-go) on the Firebase project.
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

initializeApp();
const db = getFirestore();
const messaging = getMessaging();

export const fanoutNotification = onDocumentCreated(
  { document: "notifications/{notifId}", region: "us-central1" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const n = snap.data() || {};
    const userId = n.user_id;
    if (!userId) return;

    // Collect all FCM tokens belonging to this user.
    const tokensSnap = await db
      .collection("fcm_tokens")
      .where("user_id", "==", userId)
      .get();
    if (tokensSnap.empty) return;

    const tokens = tokensSnap.docs.map((d) => d.id);

    const message = {
      notification: {
        title: n.title || "FutbolStats",
        body: n.body || "",
      },
      data: {
        link: n.link || "/",
        type: n.type || "info",
        tag: event.params.notifId,
      },
      webpush: {
        fcmOptions: { link: n.link || "/" },
        notification: {
          icon: "/pwa-192x192.png",
          badge: "/pwa-192x192.png",
          tag: event.params.notifId,
        },
      },
    };

    const res = await messaging.sendEachForMulticast({ tokens, ...message });

    // Clean up tokens the FCM service has invalidated.
    const stale = [];
    res.responses.forEach((r, i) => {
      if (r.success) return;
      const code = r.error?.code || "";
      if (
        code === "messaging/registration-token-not-registered" ||
        code === "messaging/invalid-registration-token"
      ) {
        stale.push(tokens[i]);
      }
    });
    if (stale.length) {
      const batch = db.batch();
      stale.forEach((t) => batch.delete(db.collection("fcm_tokens").doc(t)));
      await batch.commit();
    }

    // Best-effort: mark the source doc as pushed
    try {
      await snap.ref.update({
        pushed_at: FieldValue.serverTimestamp(),
        push_success: res.successCount,
        push_failure: res.failureCount,
      });
    } catch {}
  },
);
