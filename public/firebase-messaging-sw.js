/* eslint-disable no-undef */
// Firebase Cloud Messaging service worker.
// Handles push notifications when the app is in the background OR completely
// closed. This runs in its own scope ("/firebase-cloud-messaging-push-scope")
// and is separate from the vite-plugin-pwa app-shell SW.

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyADaKl0wLMwWgPoVD0lyqOEneU0FwVGQWI",
  authDomain: "footballstats-44792.firebaseapp.com",
  projectId: "footballstats-44792",
  storageBucket: "footballstats-44792.firebasestorage.app",
  messagingSenderId: "462789823625",
  appId: "1:462789823625:web:c5315feb5bbfec0638ca58",
});

const messaging = firebase.messaging();

// Background handler — fired when the app tab is not focused / app is closed.
// We always show a notification (with our own icon/badge) so the user sees it
// regardless of which OS/browser is delivering the push.
messaging.onBackgroundMessage((payload) => {
  const n = payload.notification || {};
  const d = payload.data || {};
  const title = n.title || d.title || "FutbolStats";
  const options = {
    body: n.body || d.body || "",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    tag: d.tag || undefined,
    data: { link: d.link || "/", ...d },
  };
  self.registration.showNotification(title, options);
});

// Tapping a notification focuses an existing tab or opens a new one.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const w of wins) {
        if ("focus" in w) {
          w.navigate(link).catch(() => {});
          return w.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(link);
    }),
  );
});
