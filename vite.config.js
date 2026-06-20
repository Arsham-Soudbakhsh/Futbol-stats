/**
 * Vite build configuration.
 *
 * Highlights of this config:
 *   • React + PWA plugin (Workbox-powered, manual register in main.jsx)
 *   • Manual vendor chunks — keeps Firebase / charts / React isolated
 *     so a page change doesn't invalidate the heavy vendor cache
 *   • esbuild strips `console.*` and `debugger` in production
 *   • Target = esnext → smaller, faster bundles for evergreen browsers
 */
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: false, // registered manually in main.jsx
        devOptions: { enabled: false },
        includeAssets: [
          'favicon.ico',
          'apple-touch-icon.png',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'maskable-icon-512x512.png',
        ],
        manifest: {
          name: 'FutbolStats',
          short_name: 'FutbolStats',
          description: 'Football league stats, squads, captains and rankings',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#0b1a12',
          theme_color: '#0b1a12',
          lang: 'en',
          dir: 'ltr',
          icons: [
            { src: 'pwa-192x192.png?v=2', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512x512.png?v=2', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-icon-512x512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
            { src: 'apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,ico,webp,woff,woff2}'],
          // The FCM messaging worker owns its own scope and must always be fresh.
          globIgnores: ['**/firebase-messaging-sw.js'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/api\//,
            /^\/firebase-messaging-sw\.js$/,
            /^\/firebase-cloud-messaging-push-scope/,
          ],
          runtimeCaching: [
            {
              // HTML navigations → network first so new deploys show up.
              urlPattern: ({ request }) => request.mode === 'navigate',
              handler: 'NetworkFirst',
              options: { cacheName: 'html-cache', networkTimeoutSeconds: 3 },
            },
            {
              urlPattern: ({ url }) =>
                url.origin === 'https://fonts.googleapis.com' ||
                url.origin === 'https://fonts.gstatic.com',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'google-fonts' },
            },
            {
              urlPattern: ({ url }) => url.origin === 'https://cdn.jsdelivr.net',
              handler: 'StaleWhileRevalidate',
              options: { cacheName: 'jsdelivr-cdn' },
            },
            {
              // Firebase / Firestore / Google APIs → always network first.
              urlPattern: ({ url }) =>
                url.hostname.endsWith('googleapis.com') ||
                url.hostname.endsWith('firebaseio.com') ||
                url.hostname.endsWith('firebaseapp.com'),
              handler: 'NetworkFirst',
              options: { cacheName: 'firebase-api', networkTimeoutSeconds: 5 },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],

    resolve: {
      // Path alias '@' → '/src' so imports stay stable when files move.
      alias: { '@': '/src' },
    },

    build: {
      target: 'esnext',
      cssCodeSplit: true,
      sourcemap: false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          /**
           * Split vendor bundles by domain.
           * Page bundles stay tiny — a release that only touches a page
           * does NOT bust the long-lived `firebase` / `charts` / `react` caches.
           */
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('firebase')) return 'vendor-firebase';
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) return 'vendor-charts';
            if (id.includes('react-router')) return 'vendor-router';
            if (id.includes('zustand') || id.includes('sonner')) return 'vendor-ui';
            if (id.includes('react') || id.includes('scheduler')) return 'vendor-react';
            return 'vendor';
          },
        },
      },
    },

    esbuild: isProd
      ? {
          // Strip dev-only noise from production bundles.
          drop: ['console', 'debugger'],
          legalComments: 'none',
        }
      : undefined,
  };
});
