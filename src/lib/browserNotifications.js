// Lightweight wrapper around the Web Notifications API.
//
// We ask for permission once (lazily), then use the global Notification
// constructor to surface in-app pushes. This works on desktop browsers
// and on Android Chrome / installed PWAs whenever the app (or its
// service worker) is alive. True background push (when the app is fully
// closed) requires Firebase Cloud Messaging + a VAPID key + a server
// push endpoint — see the README note added with this feature.

const ICON = "/pwa-192x192.png";
const BADGE = "/pwa-192x192.png";

export function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission; // "default" | "granted" | "denied"
}

export async function requestNotificationPermission() {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const res = await Notification.requestPermission();
    return res;
  } catch {
    return "denied";
  }
}

/**
 * Show a notification. Uses the active ServiceWorkerRegistration when
 * available (required on Android Chrome for installed PWAs), otherwise
 * falls back to the page-scoped Notification constructor.
 */
export async function showBrowserNotification({ title, body, tag, data }) {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;
  try {
    const reg =
      "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration()
        : null;
    const options = {
      body: body || "",
      icon: ICON,
      badge: BADGE,
      tag: tag || undefined,
      data: data || undefined,
    };
    if (reg && reg.showNotification) {
      await reg.showNotification(title, options);
    } else {
      // Fallback (desktop)
      new Notification(title, options);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[notifications] show failed", e);
  }
}
