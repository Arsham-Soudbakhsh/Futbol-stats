// PWA service worker registration via vite-plugin-pwa
// Only runs in production builds (devOptions.enabled = false).
import { registerSW } from 'virtual:pwa-register'

export function setupPWA() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  // Safety: do not register inside iframes (e.g. preview hosts)
  try {
    if (window.self !== window.top) return
  } catch {
    return
  }

  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      // Auto-update: silently apply the new SW on next idle reload
      try { updateSW(true) } catch {}
    },
    onOfflineReady() {
      // eslint-disable-next-line no-console
      console.log('[PWA] App is ready to work offline.')
    },
    onRegisteredSW(swUrl) {
      // eslint-disable-next-line no-console
      console.log('[PWA] Service worker registered:', swUrl)
    },
    onRegisterError(err) {
      // eslint-disable-next-line no-console
      console.warn('[PWA] SW registration error', err)
    },
  })
}
